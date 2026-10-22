#!/usr/bin/env node
// Scrapes conductor.build docs + changelog into src/content/ and downloads media into public/assets/{docs,changelog}/.
// No dependencies (Node >= 18, global fetch). Usage:  node scripts/scrape-content.mjs [--no-media] [--only=docs|changelog]
//
// Sources (in priority order):
//   docs:      React Server Component (RSC) flight payload embedded in each page (self.__next_f) -> full MDX tree,
//              including collapsed accordion and inactive tab content that the SSR HTML omits.
//              Plus /<path>.md (raw markdown export) for code-fence languages and a markdown copy.
//   changelog: RSC "entry" props (slug, version, date, title, markdown content) + SSR HTML of the post body.
//   nav:       page tree passed to the docs layout in the RSC payload of /docs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// macOS behind a TLS-inspecting proxy: Node does not read the system keychain, so re-exec with the keychain
// roots exported to a PEM via NODE_EXTRA_CA_CERTS (opt out with SCRAPE_NO_KEYCHAIN=1).
if (process.platform === 'darwin' && !process.env.NODE_EXTRA_CA_CERTS && !process.env.SCRAPE_NO_KEYCHAIN) {
  const { execSync, spawnSync } = await import('node:child_process');
  const os = await import('node:os');
  try {
    const pem = execSync(
      'security find-certificate -a -p /Library/Keychains/System.keychain /System/Library/Keychains/SystemRootCertificates.keychain',
      { maxBuffer: 64 * 1024 * 1024 },
    );
    const caFile = path.join(os.tmpdir(), 'scrape-content-ca.pem');
    fs.writeFileSync(caFile, pem);
    const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: 'inherit', env: { ...process.env, NODE_EXTRA_CA_CERTS: caFile } });
    process.exit(r.status ?? 1);
  } catch {}
}
const ORIGIN = 'https://www.conductor.build';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const PUB = path.join(ROOT, 'public');
const args = process.argv.slice(2);
const NO_MEDIA = args.includes('--no-media');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1];
const CONCURRENCY = 4;
const DELAY_MS = 150;
const UA = 'Mozilla/5.0 (clone-recon content scraper)';

const failures = [];
const mediaMap = new Map(); // remote url -> {local, kind, bytes, contentType, referencedBy:Set}

// ---------------------------------------------------------------- utils
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchRetry(url, { as = 'text', tries = 3 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (as === 'buffer') return { buf: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type'), finalUrl: res.url };
      return { text: await res.text(), finalUrl: res.url };
    } catch (e) {
      lastErr = e;
      await sleep(500 * (i + 1));
    }
  }
  throw lastErr;
}
async function pool(items, fn, n = CONCURRENCY) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        try {
          out[idx] = await fn(items[idx], idx);
        } catch (e) {
          failures.push({ item: String(items[idx]), error: String(e && e.message ? e.message : e) });
          out[idx] = null;
        }
        await sleep(DELAY_MS);
      }
    }),
  );
  return out;
}
function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');
const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

// ---------------------------------------------------------------- RSC flight parsing
function extractFlight(html) {
  const re = /self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g;
  let m;
  let s = '';
  while ((m = re.exec(html))) {
    try {
      const a = JSON.parse(m[1]);
      if (a[0] === 1 && typeof a[1] === 'string') s += a[1];
    } catch {}
  }
  return s;
}
function parseRows(flight) {
  const buf = Buffer.from(flight, 'utf8');
  const rows = new Map();
  let i = 0;
  while (i < buf.length) {
    while (i < buf.length && buf[i] === 0x0a) i++;
    if (i >= buf.length) break;
    const colon = buf.indexOf(0x3a, i);
    if (colon < 0) break;
    const id = buf.slice(i, colon).toString();
    if (!/^[0-9a-f]+$/.test(id)) {
      // resync to next newline
      const nl = buf.indexOf(0x0a, i);
      if (nl < 0) break;
      i = nl + 1;
      continue;
    }
    let j = colon + 1;
    const tag = String.fromCharCode(buf[j]);
    if (tag === 'T') {
      const comma = buf.indexOf(0x2c, j);
      const len = parseInt(buf.slice(j + 1, comma).toString(), 16);
      rows.set(id, { kind: 'text', value: buf.slice(comma + 1, comma + 1 + len).toString('utf8') });
      i = comma + 1 + len;
      continue;
    }
    let kind = 'json';
    if (/[A-Z]/.test(tag)) {
      kind = tag;
      j++;
      if (String.fromCharCode(buf[j]) === 'L') j++; // HL
    }
    const nl = buf.indexOf(0x0a, j);
    const end = nl < 0 ? buf.length : nl;
    const raw = buf.slice(j, end).toString('utf8');
    let value = raw;
    try {
      value = JSON.parse(raw);
    } catch {}
    rows.set(id, { kind, value });
    i = end + 1;
  }
  return rows;
}
class Flight {
  constructor(html) {
    this.rows = parseRows(extractFlight(html));
    this.clientNames = new Map();
    for (const [id, r] of this.rows) if (r.kind === 'I' && Array.isArray(r.value)) this.clientNames.set(id, r.value[2] || 'default');
  }
  row(id) {
    const r = this.rows.get(id);
    return r ? r.value : undefined;
  }
  // resolve a "$..." reference string (not element types)
  deref(v, depth = 0) {
    if (depth > 50) return v;
    if (typeof v !== 'string' || v[0] !== '$') return v;
    if (v === '$undefined') return undefined;
    if (v.startsWith('$$')) return v.slice(1);
    if (v === '$') return v;
    const m = v.match(/^\$[L@]?([0-9a-f]+)((?::[^:]+)*)$/);
    if (!m) return v;
    let cur = this.row(m[1]);
    if (cur === undefined) return undefined;
    if (m[2]) {
      for (const key of m[2].slice(1).split(':')) {
        cur = this.deref(cur, depth + 1);
        if (cur == null) return undefined;
        if (Array.isArray(cur) && cur[0] === '$' && typeof cur[1] === 'string') {
          const map = { type: 1, key: 2, props: 3 };
          cur = key in map ? cur[map[key]] : cur[key];
        } else cur = cur[key];
      }
    }
    return this.deref(cur, depth + 1);
  }
  // deep resolve plain data (not React elements)
  data(v, depth = 0) {
    v = this.deref(v);
    if (depth > 60) return v;
    if (Array.isArray(v)) return v.map((x) => this.data(x, depth + 1));
    if (v && typeof v === 'object') {
      const o = {};
      for (const k of Object.keys(v)) {
        const r = this.data(v[k], depth + 1);
        if (r !== undefined) o[k] = r;
      }
      return o;
    }
    return v;
  }
  isElement(v) {
    return Array.isArray(v) && v[0] === '$' && v.length >= 4;
  }
  typeName(t) {
    if (typeof t !== 'string') return null;
    if (/^\$[0-9a-f]+$/.test(t)) {
      const r = this.row(t.slice(1));
      if (typeof r === 'string') return this.typeName(r);
    }
    const m = t.match(/^\$L([0-9a-f]+)$/);
    if (m) return { client: this.clientNames.get(m[1]) || 'default' };
    if (t.startsWith('$S')) return { fragment: true };
    return { tag: t };
  }
  findElements(pred, root = null, out = [], seen = new Set()) {
    const visit = (v, d) => {
      if (d > 400) return;
      v = this.deref(v);
      if (v && typeof v === 'object') {
        if (seen.has(v)) return;
        seen.add(v);
      }
      if (this.isElement(v)) {
        if (pred(v)) out.push(v);
        visit(v[3], d + 1);
      } else if (Array.isArray(v)) v.forEach((x) => visit(x, d + 1));
      else if (v && typeof v === 'object') Object.values(v).forEach((x) => visit(x, d + 1));
    };
    if (root) visit(root, 0);
    else for (const [, r] of this.rows) if (r.kind === 'json') visit(r.value, 0);
    return out;
  }
  findClient(name) {
    return this.findElements((e) => {
      const t = this.typeName(e[1]);
      return t && t.client === name;
    });
  }
}

// ---------------------------------------------------------------- link + media rewriting
function rewriteHref(href) {
  if (!href || typeof href !== 'string') return href;
  if (href.startsWith(ORIGIN)) href = href.slice(ORIGIN.length) || '/';
  else if (href.startsWith('https://conductor.build')) href = href.slice('https://conductor.build'.length) || '/';
  return href;
}
function mediaKey(url, section, pageSlug) {
  let u;
  try {
    u = new URL(url, ORIGIN);
  } catch {
    return null;
  }
  u.searchParams.delete('dpl');
  const clean = u.origin + u.pathname + (u.search || '');
  let base = decodeURIComponent(path.basename(u.pathname)) || 'file';
  base = base.replace(/[^A-Za-z0-9._-]+/g, '-');
  if (base.length > 90) {
    const ext = path.extname(base);
    base = base.slice(0, 60) + '-' + crypto.createHash('md5').update(clean).digest('hex').slice(0, 8) + ext;
  }
  let sub;
  if (u.hostname === 'i.ytimg.com') {
    sub = `${section}/youtube`;
    base = `${u.pathname.split('/')[2]}-${base}`;
  }
  else if (u.pathname.startsWith('/docs-assets/')) sub = `docs/${path.dirname(u.pathname.replace(/^\/docs-assets\//, '')).replace(/^\.$/, '')}`.replace(/\/$/, '');
  else if (u.pathname.startsWith('/changelog/')) sub = 'changelog/images';
  else if (section === 'changelog') sub = `changelog/media/${pageSlug.split('-')[0]}`;
  else sub = `docs/media`;
  const local = `/assets/${sub}/${base}`.replace(/\/+/g, '/');
  return { clean, local };
}
function registerMedia(url, kind, section, pageSlug) {
  const k = mediaKey(url, section, pageSlug);
  if (!k) return url;
  let rec = mediaMap.get(k.clean);
  if (!rec) {
    rec = { remote: k.clean, local: k.local, kind, referencedBy: new Set() };
    mediaMap.set(k.clean, rec);
  }
  rec.referencedBy.add(`${section}:${pageSlug}`);
  return rec.local;
}

// ---------------------------------------------------------------- docs tree conversion
const VOID = new Set(['img', 'br', 'hr', 'input', 'source', 'col', 'wbr']);
const SVG_TAGS = new Set(['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'ellipse', 'defs', 'clipPath', 'mask', 'use', 'linearGradient', 'stop']);
const KEEP_ATTRS = new Set(['id', 'href', 'src', 'alt', 'title', 'width', 'height', 'colSpan', 'rowSpan', 'start', 'type', 'target', 'rel', 'controls', 'autoPlay', 'muted', 'loop', 'playsInline', 'poster', 'checked', 'disabled', 'placeholder', 'aria-label', 'role', 'value', 'open']);

function textOf(nodes) {
  if (nodes == null) return '';
  if (typeof nodes === 'string') return nodes;
  if (Array.isArray(nodes)) return nodes.map(textOf).join('');
  if (nodes.type === 'text') return nodes.value;
  if (nodes.children) return textOf(nodes.children);
  if (nodes.type === 'code') return nodes.code || '';
  return '';
}
function iconNodeToSvg(iconNode, cls = '') {
  if (!Array.isArray(iconNode)) return null;
  const inner = iconNode
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs || {}).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${escAttr(v)}"`).join(' ')}></${tag}>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${cls ? ` data-lucide="${escAttr(cls)}"` : ''}>${inner}</svg>`;
}

class DocsConverter {
  constructor(flight, ctx) {
    this.f = flight;
    this.ctx = ctx; // {slug, mdFences:[{lang,title,code}], fenceIdx}
    this.components = new Set();
  }
  cls(props) {
    return (props && typeof props.className === 'string' ? props.className : '') || '';
  }
  // convert any child value into an array of nodes
  nodes(v, depth = 0) {
    v = this.f.deref(v);
    if (v == null || v === false || v === true) return [];
    if (typeof v === 'string' || typeof v === 'number') return [{ type: 'text', value: String(v) }];
    if (this.f.isElement(v)) {
      const n = this.element(v, depth + 1);
      return n == null ? [] : Array.isArray(n) ? n : [n];
    }
    if (Array.isArray(v)) return v.flatMap((x) => this.nodes(x, depth + 1));
    return [];
  }
  children(props, depth) {
    return this.nodes(props ? props.children : null, depth);
  }
  element(el, depth) {
    const t = this.f.typeName((el[1]));
    const props = this.f.deref(el[3]) || {};
    if (!t || t.fragment) return this.children(props, depth);
    if (t.client) return this.client(t.client, props, depth);
    return this.host(t.tag, props, depth);
  }
  attrs(tag, props) {
    const a = {};
    for (const [k, v0] of Object.entries(props)) {
      if (k === 'children' || k === 'className' || k === 'style' || k === 'dangerouslySetInnerHTML') continue;
      const v = this.f.deref(v0);
      if (v === undefined || v === null || typeof v === 'object') continue;
      if (SVG_TAGS.has(tag)) a[k.replace(/[A-Z]/g, (ch) => '-' + ch.toLowerCase()).replace(/^view-box$/, 'viewBox')] = v;
      else if (KEEP_ATTRS.has(k) || k.startsWith('data-') || k.startsWith('aria-')) a[k] = v;
    }
    if (a.href) a.href = rewriteHref(a.href);
    if (a.src && (tag === 'img' || tag === 'video' || tag === 'source')) a.src = registerMedia(a.src, tag === 'img' ? 'image' : 'video', 'docs', this.ctx.slug);
    return a;
  }
  host(tag, props, depth) {
    const c = this.cls(props);
    // ----- recognized server-rendered components
    if (tag === 'script' || tag === 'style' || tag === 'noscript') return null;
    if ((tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') && props.id) {
      const kids = this.children(props, depth).filter((n) => n.type !== 'icon');
      // unwrap the self-anchor <a href="#id">
      const flat = kids.length === 1 && kids[0].type === 'element' && kids[0].tag === 'a' && kids[0].attrs.href === `#${props.id}` ? kids[0].children : kids;
      return { type: 'heading', depth: +tag[1], id: props.id, children: flat };
    }
    if (tag === 'div' && props.role === 'note' && /docs-callout/.test(c)) {
      const label = String(props['aria-label'] || 'Info note');
      const calloutType = label.replace(/\s*note$/i, '').toLowerCase();
      const desc = this.f.findElements((e) => /docs-callout-description/.test(this.cls(this.f.deref(e[3]))), props.children)[0];
      const titleEl = this.f.findElements((e) => /docs-callout-title/.test(this.cls(this.f.deref(e[3]))), props.children)[0];
      return {
        type: 'callout',
        calloutType,
        title: titleEl ? textOf(this.children(this.f.deref(titleEl[3]), depth)) : undefined,
        children: desc ? this.children(this.f.deref(desc[3]), depth) : this.children(props, depth),
      };
    }
    if (tag === 'div' && /\bfd-steps\b/.test(c)) {
      const steps = this.nodes(props.children, depth)
        .filter((n) => n.type === 'step' || (n.type === 'element'))
        .map((n) => (n.type === 'step' ? n : { type: 'step', children: [n] }));
      return { type: 'steps', children: steps };
    }
    if (tag === 'div' && /\bfd-step\b/.test(c)) return { type: 'step', children: this.children(props, depth) };
    if (tag === 'div' && /docs-table-shell/.test(c)) {
      const table = this.f.findElements((e) => this.f.deref(e[1]) === 'table', props.children)[0];
      return table ? this.table(this.f.deref(table[3]), depth) : null;
    }
    if (tag === 'table') return this.table(props, depth);
    if ((tag === 'figure' || tag === 'span') && /docs-asset-shell/.test(c)) {
      const media = this.f.findElements((e) => ['img', 'video'].includes(this.f.deref(e[1])), props.children)[0];
      const sr = this.f.findElements((e) => /sr-only/.test(this.cls(this.f.deref(e[3]))), props.children)[0];
      if (!media) return null;
      const mt = this.f.deref(media[1]);
      const mp = this.f.deref(media[3]);
      const a = this.attrs(mt, mp);
      const imgs = this.f.findElements((e) => this.f.deref(e[1]) === 'img', props.children).map((e) => this.f.deref(e[3]));
      const node = { type: mt === 'img' ? 'image' : 'video', src: a.src, alt: mp.alt || mp['aria-label'] || '', width: mp.width, height: mp.height };
      if (mt === 'video') Object.assign(node, { controls: !!mp.controls, autoPlay: !!mp.autoPlay, muted: !!mp.muted, loop: !!mp.loop, playsInline: !!mp.playsInline });
      if (imgs.length > 1) {
        // light/dark variants
        node.variants = imgs.map((p) => ({ src: this.attrs('img', p).src, theme: /dark/.test(this.cls(p)) ? 'dark' : /light/.test(this.cls(p)) ? 'light' : undefined }));
      }
      if (sr) node.summary = textOf(this.children(this.f.deref(sr[3]), depth)).trim();
      return node;
    }
    if (tag === 'div' && props['data-ntpc'] === 'YouTubeEmbed') {
      const lite = this.f.findElements((e) => this.f.deref(e[1]) === 'lite-youtube', props.children)[0];
      const lp = lite ? this.f.deref(lite[3]) : {};
      const id = lp.videoid || lp.videoId;
      const thumb = id ? registerMedia(`https://i.ytimg.com/vi_webp/${id}/sddefault.webp`, 'image', 'docs', this.ctx.slug) : undefined;
      return { type: 'youtube', videoId: id, title: lp.playlabel || lp.title || '', thumbnail: thumb };
    }
    if (tag === 'lite-youtube') {
      const id = props.videoid;
      return { type: 'youtube', videoId: id, title: props.playlabel || '', thumbnail: id ? registerMedia(`https://i.ytimg.com/vi_webp/${id}/sddefault.webp`, 'image', 'docs', this.ctx.slug) : undefined };
    }
    if (tag === 'span' && /\bdocs-shortcut\b/.test(c)) {
      const sr = this.f.findElements((e) => /sr-only/.test(this.cls(this.f.deref(e[3]))), props.children)[0];
      const keys = this.f.findElements((e) => this.f.deref(e[1]) === 'kbd', props.children).map((e) => textOf(this.children(this.f.deref(e[3]), depth)));
      const seps = this.f.findElements((e) => /docs-shortcut-separator/.test(this.cls(this.f.deref(e[3]))), props.children).map((e) => textOf(this.children(this.f.deref(e[3]), depth)));
      return { type: 'shortcut', label: sr ? textOf(this.children(this.f.deref(sr[3]), depth)) : keys.join(' '), keys, separator: seps[0] || '+' };
    }
    if (tag === 'kbd') return { type: 'kbd', value: textOf(this.children(props, depth)) };
    if (tag === 'div' && /not-prose/.test(c) && /grid/.test(c)) {
      const arts = this.f.findElements((e) => this.f.deref(e[1]) === 'article', props.children);
      if (arts.length) return { type: 'cards', columns: /md:grid-cols-3/.test(c) ? 3 : /md:grid-cols-2/.test(c) ? 2 : 1, children: arts.map((e) => this.card(this.f.deref(e[3]), depth)) };
    }
    if (tag === 'article' && /rounded-3xl/.test(c)) return this.card(props, depth);
    if (tag === 'span' && /sr-only/.test(c)) return null;
    if (tag === 'div' && /docs-youtube-preview/.test(c)) {
      const yt = [];
      const walk = (arr) => arr.forEach((n) => (n.type === 'youtube' ? yt.push(n) : n.children && walk(n.children)));
      walk(this.children(props, depth));
      if (yt[0]) return { ...yt[0], framed: true };
    }
    // ----- generic element
    const node = { type: 'element', tag, attrs: this.attrs(tag, props), children: VOID.has(tag) ? [] : this.children(props, depth) };
    if (tag === 'a' && node.attrs.href && node.attrs.href.startsWith('#') && node.attrs['data-card'] !== undefined) delete node.attrs['data-card'];
    // drop pure-wrapper divs/spans without semantic meaning
    if ((tag === 'div' || tag === 'span') && !Object.keys(node.attrs).length && !/not-prose|grid|flex/.test(c)) return node.children;
    if (tag === 'div' || tag === 'span' || tag === 'section') node.attrs['data-class'] = c || undefined; // keep original utility classes as a hint for custom blocks
    if (node.attrs['data-class'] === undefined) delete node.attrs['data-class'];
    return node;
  }
  card(props, depth) {
    const kids = this.nodes(props.children, depth);
    const linkIdx = kids.findIndex((n) => n.type === 'element' && n.tag === 'a');
    const link = linkIdx >= 0 ? kids[linkIdx] : null;
    const linkKids = link ? link.children : [];
    const icons = [];
    const walk = (arr) => arr.forEach((n) => (n.type === 'icon' || (n.type === 'element' && n.tag === 'svg') ? icons.push(n) : n.children && walk(n.children)));
    walk(linkKids);
    const strip = (arr) => arr.filter((n) => !(n.type === 'icon' || (n.type === 'element' && n.tag === 'svg'))).map((n) => (n.children ? { ...n, children: strip(n.children) } : n));
    const label = strip(linkKids);
    const href = link ? link.attrs.href : undefined;
    const svgOf = (n) => (n ? (n.type === 'icon' ? n.svg : renderNode(n)) : undefined);
    // the Reddit card renders a text badge ("r") instead of an svg icon
    const badge = label.length > 1 && label[0].type === 'element' && textOf(label[0]).trim().length <= 2 ? textOf(label[0]).trim() : undefined;
    const title = textOf(badge ? label.slice(1) : label).trim();
    return { type: 'card', title, href, external: /^https?:/.test(href || '') || undefined, icon: svgOf(icons[0]), iconText: badge, trailingIcon: svgOf(icons[1]), children: kids.filter((_, i) => i !== linkIdx) };
  }
  table(props, depth) {
    const rowsOf = (sectionTag) => {
      const sec = this.f.findElements((e) => this.f.deref(e[1]) === sectionTag, props.children)[0];
      const trs = sec ? this.f.findElements((e) => this.f.deref(e[1]) === 'tr', this.f.deref(sec[3]).children) : [];
      return trs.map((tr) => this.f.findElements((e) => ['th', 'td'].includes(this.f.deref(e[1])), this.f.deref(tr[3]).children).map((cell) => {
        const cp = this.f.deref(cell[3]) || {};
        const align = cp.style && cp.style.textAlign;
        return { children: this.children(cp, depth), ...(align ? { align } : {}) };
      }));
    };
    const caption = this.f.findElements((e) => this.f.deref(e[1]) === 'caption', props.children)[0];
    return { type: 'table', caption: caption ? textOf(this.children(this.f.deref(caption[3]), depth)) : undefined, head: rowsOf('thead')[0] || [], rows: rowsOf('tbody') };
  }
  code(props, depth) {
    // props: title, icon (svg string), children -> Pre -> code -> span.line -> span(style --shiki-light)
    const lines = [];
    const codeEl = this.f.findElements((e) => this.f.deref(e[1]) === 'code', props.children)[0];
    const lineEls = codeEl ? this.f.findElements((e) => this.cls(this.f.deref(e[3])) === 'line' || /\bline\b/.test(this.cls(this.f.deref(e[3]))), this.f.deref(codeEl[3]).children) : [];
    for (const le of lineEls) {
      const lp = this.f.deref(le[3]);
      const toks = [];
      const visit = (v) => {
        v = this.f.deref(v);
        if (v == null) return;
        if (typeof v === 'string') return toks.push({ text: v });
        if (Array.isArray(v) && !this.f.isElement(v)) return v.forEach(visit);
        if (this.f.isElement(v)) {
          const p = this.f.deref(v[3]) || {};
          const style = p.style || {};
          const kids = this.f.deref(p.children);
          if (typeof kids === 'string') toks.push({ text: kids, color: style['--shiki-light'], colorDark: style['--shiki-dark'], fontStyle: style['--shiki-light-font-style'] });
          else visit(kids);
        }
      };
      visit(lp.children);
      lines.push({ tokens: toks.filter((t) => t.text !== ''), ...(lp.className && lp.className !== 'line' ? { className: lp.className } : {}) });
    }
    const code = lines.map((l) => l.tokens.map((t) => t.text).join('')).join('\n');
    // language from the markdown export (fences in document order)
    let lang;
    let mdTitle;
    const fences = this.ctx.mdFences || [];
    for (let k = this.ctx.fenceIdx || 0; k < fences.length; k++) {
      if (fences[k].code.trim() === code.trim() || fences[k].code.replace(/\s+/g, '') === code.replace(/\s+/g, '')) {
        lang = fences[k].lang;
        mdTitle = fences[k].title;
        this.ctx.fenceIdx = k + 1;
        break;
      }
    }
    const title = props.title != null ? textOf(this.nodes(props.title, depth)) : mdTitle;
    return { type: 'code', lang: lang || undefined, title: title || undefined, icon: typeof props.icon === 'string' ? props.icon : undefined, code, lines };
  }
  client(name, props, depth) {
    switch (name) {
      case 'CodeBlock':
        return this.code(props, depth);
      case 'Pre':
        return this.children(props, depth);
      case 'CodeBlockTabs': {
        const triggers = this.f.findElements((e) => (this.f.typeName((e[1])) || {}).client === 'CodeBlockTabsTrigger', props.children);
        const tabs = this.f.findElements((e) => (this.f.typeName((e[1])) || {}).client === 'CodeBlockTab', props.children);
        const labels = new Map(triggers.map((t) => { const p = this.f.deref(t[3]); return [p.value, textOf(this.nodes(p.children, depth))]; }));
        return {
          type: 'codeTabs',
          defaultValue: props.defaultValue,
          tabs: tabs.map((t) => { const p = this.f.deref(t[3]); return { value: p.value, label: labels.get(p.value) || p.value, children: this.nodes(p.children, depth) }; }),
        };
      }
      case 'Tabs':
      case 'Tab': {
        if (name === 'Tab') return { type: 'tab', value: props.value, title: props.title, children: this.children(props, depth) };
        const items = this.f.data(props.items) || [];
        return { type: 'tabs', items, defaultIndex: props.defaultIndex, children: this.children(props, depth) };
      }
      case 'Accordions':
        return { type: 'accordions', accordionType: props.type || 'single', children: this.children(props, depth).filter((n) => n.type === 'accordion') };
      case 'Accordion':
        return { type: 'accordion', title: textOf(this.nodes(props.title, depth)), id: props.id, value: props.value, children: this.children(props, depth) };
      case 'DocsPage':
      case 'DocsBody':
        return this.children(props, depth);
      case 'default': {
        if (props.dataNtpc === 'YouTubeEmbed' || /<lite-youtube/.test(props.html || '')) {
          const id = ((props.html || '').match(/videoid="([^"]+)"/) || [])[1];
          const title = decodeEntities(((props.html || '').match(/playlabel="([^"]*)"/) || [])[1] || '');
          return { type: 'youtube', videoId: id, title, thumbnail: id ? registerMedia(`https://i.ytimg.com/vi_webp/${id}/sddefault.webp`, 'image', 'docs', this.ctx.slug) : undefined };
        }
        if (typeof props.src === 'string' && /\.m?js(\?|$)/.test(props.src)) return null; // next/script
        if (props.iconNode) return { type: 'icon', svg: iconNodeToSvg(this.f.data(props.iconNode), (this.cls(props).match(/lucide-[\w-]+/) || [])[0]) };
        if (props.href !== undefined) return { type: 'element', tag: 'a', attrs: this.attrs('a', props), children: this.children(props, depth) };
        if (props.src !== undefined) return { type: 'element', tag: 'img', attrs: this.attrs('img', props), children: [] };
        return this.children(props, depth);
      }
      default: {
        // site-specific interactive components (ApiKeyTester, ApiAgentPrompt, ConfigureProjectPrompt, KeyboardShortcutsCheatsheetOverlay, CityProbabilityCurve, ...)
        this.components.add(name);
        const data = {};
        for (const [k, v] of Object.entries(props)) {
          if (k === 'children') continue;
          const d = this.f.data(v);
          if (d !== undefined && !(Array.isArray(d) && d[0] === '$')) data[k] = d;
        }
        return { type: 'component', name, props: data, children: this.children(props, depth) };
      }
    }
  }
}

// ---------------------------------------------------------------- html rendering of the clean tree
function renderNodes(nodes) {
  return (nodes || []).map(renderNode).join('');
}
function renderNode(n) {
  if (n == null) return '';
  switch (n.type) {
    case 'text':
      return esc(n.value);
    case 'heading':
      return `<h${n.depth} id="${escAttr(n.id)}"><a href="#${escAttr(n.id)}">${renderNodes(n.children)}</a></h${n.depth}>`;
    case 'icon':
      return n.svg || '';
    case 'callout':
      return `<div role="note" data-callout="${escAttr(n.calloutType)}">${n.title ? `<p data-callout-title>${esc(n.title)}</p>` : ''}${renderNodes(n.children)}</div>`;
    case 'steps':
      return `<div data-steps>${renderNodes(n.children)}</div>`;
    case 'step':
      return `<div data-step>${renderNodes(n.children)}</div>`;
    case 'table': {
      const cell = (tag) => (c) => `<${tag}${c.align ? ` style="text-align:${c.align}"` : ''}>${renderNodes(c.children)}</${tag}>`;
      return `<table>${n.caption ? `<caption>${esc(n.caption)}</caption>` : ''}<thead><tr>${n.head.map(cell('th')).join('')}</tr></thead><tbody>${n.rows.map((r) => `<tr>${r.map(cell('td')).join('')}</tr>`).join('')}</tbody></table>`;
    }
    case 'image':
      return `<figure data-asset="image"><img src="${escAttr(n.src)}" alt="${escAttr(n.alt || '')}"${n.width ? ` width="${n.width}"` : ''}${n.height ? ` height="${n.height}"` : ''} /></figure>`;
    case 'video':
      return `<figure data-asset="video"><video src="${escAttr(n.src)}"${n.alt ? ` aria-label="${escAttr(n.alt)}"` : ''}${n.controls ? ' controls' : ''}${n.autoPlay ? ' autoplay' : ''}${n.muted ? ' muted' : ''}${n.loop ? ' loop' : ''}${n.playsInline ? ' playsinline' : ''}></video>${n.summary ? `<figcaption class="sr-only">${esc(n.summary)}</figcaption>` : ''}</figure>`;
    case 'youtube':
      return `<div data-youtube="${escAttr(n.videoId)}" data-title="${escAttr(n.title)}"${n.thumbnail ? ` data-thumbnail="${escAttr(n.thumbnail)}"` : ''}></div>`;
    case 'shortcut':
      return `<span data-shortcut aria-label="${escAttr(n.label)}">${n.keys.map((k, i) => (i ? `<span data-sep>${esc(n.separator)}</span>` : '') + `<kbd>${esc(k)}</kbd>`).join('')}</span>`;
    case 'kbd':
      return `<kbd>${esc(n.value)}</kbd>`;
    case 'cards':
      return `<div data-cards="${n.columns}">${renderNodes(n.children)}</div>`;
    case 'card':
      return `<article data-card><a href="${escAttr(n.href || '#')}">${n.icon || ''}<span>${esc(n.title)}</span>${n.trailingIcon || ''}</a>${renderNodes(n.children)}</article>`;
    case 'code':
      return `<figure data-code${n.lang ? ` data-lang="${escAttr(n.lang)}"` : ''}${n.title ? ` data-title="${escAttr(n.title)}"` : ''}><pre><code>${n.lines
        .map((l) => `<span class="line">${l.tokens.map((t) => (t.color ? `<span style="color:${t.color}${t.fontStyle ? `;font-style:${t.fontStyle}` : ''}">${esc(t.text)}</span>` : esc(t.text))).join('')}</span>`)
        .join('\n')}</code></pre></figure>`;
    case 'codeTabs':
      return `<div data-code-tabs data-default="${escAttr(n.defaultValue || '')}">${n.tabs.map((t) => `<div data-tab="${escAttr(t.label)}">${renderNodes(t.children)}</div>`).join('')}</div>`;
    case 'tabs':
      return `<div data-tabs>${renderNodes(n.children)}</div>`;
    case 'tab':
      return `<div data-tab="${escAttr(n.title || n.value || '')}">${renderNodes(n.children)}</div>`;
    case 'accordions':
      return `<div data-accordions="${escAttr(n.accordionType)}">${renderNodes(n.children)}</div>`;
    case 'accordion':
      return `<details data-accordion${n.id ? ` id="${escAttr(n.id)}"` : ''}><summary>${esc(n.title)}</summary>${renderNodes(n.children)}</details>`;
    case 'component':
      return `<div data-component="${escAttr(n.name)}" data-props="${escAttr(JSON.stringify(n.props))}">${renderNodes(n.children)}</div>`;
    case 'element': {
      const attrs = Object.entries(n.attrs || {})
        .filter(([, v]) => v !== undefined && v !== false)
        .map(([k, v]) => (v === true || v === '' ? ` ${k === 'playsInline' ? 'playsinline' : k === 'autoPlay' ? 'autoplay' : k}` : ` ${k === 'className' ? 'class' : k}="${escAttr(v)}"`))
        .join('');
      if (VOID.has(n.tag)) return `<${n.tag}${attrs} />`;
      return `<${n.tag}${attrs}>${renderNodes(n.children)}</${n.tag}>`;
    }
    default:
      return '';
  }
}
// strip whitespace-only text nodes between block nodes ("\n" from MDX)
function tidy(nodes) {
  const BLOCK = new Set(['heading', 'callout', 'steps', 'step', 'table', 'image', 'video', 'youtube', 'cards', 'card', 'code', 'codeTabs', 'tabs', 'tab', 'accordions', 'accordion', 'component']);
  const BLOCK_TAGS = new Set(['p', 'ul', 'ol', 'li', 'blockquote', 'figure', 'div', 'section', 'pre', 'hr', 'table', 'thead', 'tbody', 'tr', 'details', 'summary', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
  const isBlock = (n) => BLOCK.has(n.type) || (n.type === 'element' && BLOCK_TAGS.has(n.tag));
  const walk = (arr) => {
    const out = [];
    for (const n of arr) {
      if (n.children && Array.isArray(n.children)) n.children = walk(n.children);
      if (n.type === 'codeTabs') n.tabs.forEach((t) => (t.children = walk(t.children)));
      if (n.type === 'table') {
        n.head.forEach((c) => (c.children = walk(c.children)));
        n.rows.forEach((r) => r.forEach((c) => (c.children = walk(c.children))));
      }
      out.push(n);
    }
    const hasBlock = out.some(isBlock);
    return hasBlock ? out.filter((n) => !(n.type === 'text' && /^\s*$/.test(n.value))) : out;
  };
  return walk(nodes);
}
function collectText(nodes, out = []) {
  for (const n of nodes || []) {
    if (n.type === 'text') out.push(n.value);
    else if (n.type === 'code') out.push(n.code);
    else if (n.type === 'codeTabs') n.tabs.forEach((t) => collectText(t.children, out));
    else if (n.type === 'table') [n.head, ...n.rows].forEach((r) => r.forEach((c) => collectText(c.children, out)));
    else if (n.type === 'card') out.push(n.title), collectText(n.children, out);
    else if (n.type === 'accordion') out.push(n.title), collectText(n.children, out);
    else if (n.type === 'shortcut') out.push(n.keys.join(''));
    else if (n.type === 'kbd') out.push(n.value);
    else if (n.children) collectText(n.children, out);
    if (n.type === 'heading' || (n.type === 'element' && /^(p|li|h\d|tr|pre|blockquote)$/.test(n.tag))) out.push('\n');
  }
  return out;
}

// ---------------------------------------------------------------- markdown helpers
function mdFences(md) {
  const out = [];
  const re = /^(\s*)(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n\1\2[ \t]*$/gm;
  let m;
  while ((m = re.exec(md))) {
    const info = m[3].trim();
    const lang = (info.match(/^([\w+#.-]+)/) || [])[1];
    const title = (info.match(/title=["']([^"']+)["']/) || [])[1];
    const indent = m[1].replace(/\n/g, '');
    const code = m[4].split('\n').map((l) => (indent && l.startsWith(indent) ? l.slice(indent.length) : l)).join('\n');
    out.push({ lang, title, code });
  }
  return out;
}
function stripFrontmatter(md) {
  return md.replace(/^---\n[\s\S]*?\n---\n/, '');
}

// ---------------------------------------------------------------- nav
function cleanTreeNode(f, n) {
  n = f.data(n);
  if (!n || typeof n !== 'object') return null;
  const base = { type: n.type, name: typeof n.name === 'string' ? n.name : textOfData(n.name) };
  if (n.description) base.description = typeof n.description === 'string' ? n.description : textOfData(n.description);
  if (n.type === 'page') {
    base.url = n.url;
    if (n.external) base.external = true;
    if (n.$ref) base.source = n.$ref;
  } else if (n.type === 'folder') {
    if (n.root) base.root = true;
    if (n.defaultOpen !== undefined) base.defaultOpen = n.defaultOpen;
    if (n.collapsible !== undefined) base.collapsible = n.collapsible;
    if (n.index) base.index = cleanTreeNode(f, n.index);
    base.children = (n.children || []).map((c) => cleanTreeNode(f, c)).filter(Boolean);
  }
  return base;
}
function textOfData(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    if (v[0] === '$' && v.length >= 4) return textOfData(v[3] && v[3].children);
    return v.map(textOfData).join('');
  }
  return '';
}
function flattenPages(nodes, out = [], trail = []) {
  let section = null;
  for (const n of nodes) {
    if (n.type === 'separator') section = n.name;
    else if (n.type === 'page') out.push({ url: n.url, name: n.name, group: [...trail, section].filter(Boolean).join(' / ') });
    else if (n.type === 'folder') {
      const t = [...trail, section, n.name].filter(Boolean);
      if (n.index) out.push({ url: n.index.url, name: n.index.name, group: t.join(' / ') });
      flattenPages(n.children, out, t);
    }
  }
  return out;
}

// ---------------------------------------------------------------- docs page
function docSlug(url) {
  const p = new URL(url, ORIGIN).pathname.replace(/\/$/, '');
  const rel = p.replace(/^\/docs\/?/, '');
  return rel === '' ? 'index' : rel;
}
function parseHtmlPrevNext(html) {
  const i = html.indexOf('@container grid gap-4');
  if (i < 0) return {};
  const seg = html.slice(i, html.indexOf('</article>', i) > 0 ? html.indexOf('</article>', i) : i + 4000);
  const links = [...seg.matchAll(/<a class="([^"]*)" href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => {
    const ps = [...m[3].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((x) => decodeEntities(x[1].replace(/<[^>]+>/g, '')));
    return { href: rewriteHref(m[2]), title: ps[0], description: ps[1], isNext: /text-end/.test(m[1]) };
  });
  const out = {};
  for (const l of links) out[l.isNext ? 'next' : 'previous'] = { url: l.href, title: l.title, description: l.description || undefined };
  return out;
}
async function scrapeDoc(url) {
  const { text: html } = await fetchRetry(url);
  let md = '';
  try {
    md = (await fetchRetry(url.replace(/\/$/, '') + '.md')).text;
  } catch {}
  const f = new Flight(html);
  const slug = docSlug(url);
  const page = f.findClient('DocsPage')[0];
  if (!page) throw new Error('DocsPage not found in RSC payload');
  const pp = f.deref(page[3]);
  const titleEl = f.findClient('DocsTitle')[0];
  const descEl = f.findClient('DocsDescription')[0];
  const bodyEl = f.findClient('DocsBody')[0];
  const ctx = { slug, mdFences: mdFences(md), fenceIdx: 0 };
  const conv = new DocsConverter(f, ctx);
  const title = titleEl ? textOf(conv.children(f.deref(titleEl[3]), 0)) : '';
  const description = descEl ? textOf(conv.children(f.deref(descEl[3]), 0)) : '';
  const body = tidy(bodyEl ? conv.children(f.deref(bodyEl[3]), 0) : []);
  const bc = f.findElements((e) => f.deref(e[1]) === 'nav' && (f.deref(e[3]) || {})['aria-label'] === 'Breadcrumb', pp.children)[0];
  const breadcrumb = bc ? f.findElements((e) => f.deref(e[1]) === 'li', f.deref(bc[3]).children).map((li) => {
    const kids = conv.children(f.deref(li[3]), 0);
    const a = kids.find((k) => k.type === 'element' && k.tag === 'a');
    return { name: textOf(kids.filter((k) => k.type !== 'icon')).trim(), url: a ? a.attrs.href : undefined };
  }) : [];
  const toc = (f.data(pp.toc) || []).map((t) => ({ depth: t.depth, url: t.url, title: typeof t.title === 'string' ? t.title : textOfData(t.title) }));
  const meta = {};
  const metaTitle = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (metaTitle) meta.title = decodeEntities(metaTitle);
  const ogImage = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
  if (ogImage) meta.ogImage = ogImage;
  const text = collectText(body).join('').replace(/\n{2,}/g, '\n').trim();
  return {
    slug,
    url: new URL(url).pathname,
    title,
    description,
    meta,
    breadcrumb,
    toc,
    tocStyle: pp.tableOfContent && pp.tableOfContent.style,
    ...parseHtmlPrevNext(html),
    components: [...conv.components],
    body,
    html: renderNodes(body),
    text,
    markdown: md ? stripFrontmatter(md) : undefined,
  };
}

// ---------------------------------------------------------------- changelog
function cfDecode(hex) {
  const key = parseInt(hex.slice(0, 2), 16);
  let s = '';
  for (let i = 2; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  return s;
}
function balancedDiv(html, start) {
  // start points at '<div'; return end index after matching </div>
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return re.lastIndex;
  }
  return html.length;
}
function cleanChangelogHtml(inner, slug) {
  let h = inner;
  // cloudflare email obfuscation
  h = h.replace(/<a href="\/cdn-cgi\/l\/email-protection#([0-9a-f]+)"[^>]*>[\s\S]*?<\/a>/g, (_, hex) => { const e = cfDecode(hex); return `<a href="mailto:${e}">${esc(e)}</a>`; });
  h = h.replace(/<span class="__cf_email__" data-cfemail="([0-9a-f]+)">[^<]*<\/span>/g, (_, hex) => esc(cfDecode(hex)));
  h = h.replace(/<svg[\s\S]*?<\/svg>/g, '');
  h = h.replace(/<!-- -->/g, '');
  // asset shells -> figure
  h = h.replace(/<span class="docs-asset-shell[^"]*"><span class="docs-asset-frame">([\s\S]*?)<\/span><\/span>/g, (_, media) => `<figure data-asset>${media}</figure>`);
  // media
  h = h.replace(/<(img|video|source)\b([^>]*?)\s(src)="([^"]+)"/g, (m0, tag, pre, attr, src) => `<${tag}${pre} ${attr}="${registerMedia(decodeEntities(src), tag === 'img' ? 'image' : 'video', 'changelog', slug)}"`);
  h = h.replace(/\ssrcSet="[^"]*"|\ssrcset="[^"]*"|\sdata-nimg="[^"]*"|\sdecoding="[^"]*"|\sstyle="color:transparent"|\swebkit-playsinline="[^"]*"/g, '');
  // links
  h = h.replace(/\shref="([^"]+)"/g, (_, href) => ` href="${escAttr(rewriteHref(decodeEntities(href)))}"`);
  // strip classes (styles are specified per tag in CLONE_SPEC_DOCS.md)
  h = h.replace(/\sclass="[^"]*"/g, '');
  // a <p> that only wraps a figure -> unwrap
  h = h.replace(/<p>\s*(<figure data-asset>[\s\S]*?<\/figure>)\s*<\/p>/g, '$1');
  h = h.replace(/autoPlay=""/g, 'autoplay').replace(/playsInline=""/g, 'playsinline').replace(/muted=""/g, 'muted').replace(/loop=""/g, 'loop');
  return h.trim();
}
function mdSummary(md) {
  const paras = md
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith('#') && !p.startsWith('!') && !p.startsWith('<') && !/^[-*] /.test(p) && !p.startsWith('```'));
  const p = paras[0] || '';
  return p.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
}
function mdFirstMedia(md) {
  let img = md.match(/!\[([^\]]*)\]\(([^)\s]+)/);
  const htmlImg = md.match(/<img\b[^>]*?\ssrc=["']([^"']+)["'][^>]*>/);
  if (htmlImg && (!img || md.indexOf(htmlImg[0]) < md.indexOf(img[0]))) img = [htmlImg[0], (htmlImg[0].match(/alt=["']([^"']*)["']/) || [])[1] || '', htmlImg[1]];
  const vid = md.match(/<video[^>]*\ssrc="([^"]+)"/) || md.match(/\((https?:[^)\s]+\.(?:mp4|webm|mov))\)/);
  const iImg = img ? md.indexOf(img[0]) : Infinity;
  const iVid = vid ? md.indexOf(vid[0]) : Infinity;
  if (iImg === Infinity && iVid === Infinity) return null;
  return iImg <= iVid ? { type: 'image', src: img[2], alt: img[1] } : { type: 'video', src: vid[1] };
}
async function scrapeChangelogIndexPages() {
  const pages = [`${ORIGIN}/changelog`];
  const first = await fetchRetry(pages[0]);
  const total = +((first.text.match(/Page <!-- -->\d+<!-- --> of <!-- -->(\d+)/) || [])[1] || 1);
  for (let i = 2; i <= total; i++) pages.push(`${ORIGIN}/changelog/page/${i}`);
  const results = await pool(pages, async (u, idx) => {
    const html = idx === 0 ? first.text : (await fetchRetry(u)).text;
    const f = new Flight(html);
    const el = f.findClient('ChangelogContent')[0];
    if (!el) throw new Error('ChangelogContent not found');
    const entries = f.data(f.deref(el[3]).entries) || [];
    return { page: idx + 1, url: new URL(u).pathname, entries: entries.map((e) => ({ ...e, content: typeof e.content === 'string' ? e.content : '' })) };
  });
  return { total, pages: results.filter(Boolean) };
}
async function scrapeChangelogPost(url) {
  const { text: html, finalUrl } = await fetchRetry(url);
  const f = new Flight(html);
  const el = f.findClient('SingleChangelogEntry')[0];
  if (!el) throw new Error('SingleChangelogEntry not found');
  const entry = f.data(f.deref(el[3]).entry);
  const urlSlug = entry.urlSlug || new URL(url).pathname.split('/').pop();
  // SSR body
  const ai = html.indexOf('<article class="relative">');
  let bodyHtml = '';
  if (ai >= 0) {
    const ci = html.indexOf('<div class="min-w-0">', ai);
    const end = balancedDiv(html, ci);
    let inner = html.slice(ci + '<div class="min-w-0">'.length, end - '</div>'.length);
    inner = inner.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/, '');
    bodyHtml = cleanChangelogHtml(inner, urlSlug);
  }
  const description = decodeEntities((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  const ogImage = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
  const md = entry.content || '';
  const hero = mdFirstMedia(md);
  if (hero) hero.src = registerMedia(hero.src, hero.type, 'changelog', urlSlug);
  const headings = [...bodyHtml.matchAll(/<h([2-4])>([\s\S]*?)<\/h\1>/g)].map((m) => ({ depth: +m[1], title: decodeEntities(m[2].replace(/<[^>]+>/g, '')) }));
  return {
    slug: urlSlug,
    version: entry.version,
    versionSlug: entry.slug,
    title: entry.title,
    fullTitle: `${entry.version}: ${entry.title}`,
    date: entry.date,
    dateISO: toISO(entry.date),
    description,
    summary: mdSummary(md),
    hero,
    ogImage,
    authors: [],
    url: `/changelog/${urlSlug}`,
    sourceUrl: finalUrl,
    headings,
    html: bodyHtml,
    markdown: md,
  };
}
function toISO(d) {
  if (!d) return undefined;
  const t = Date.parse(String(d).replace(/(\d+)(st|nd|rd|th)/, '$1') + ' UTC');
  return isNaN(t) ? undefined : new Date(t).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- media download
const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov' };
function sniffType(b) {
  if (b[0] === 0x89 && b[1] === 0x50) return 'image/png';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  if (b.toString('latin1', 4, 8) === 'ftyp') return 'video/mp4';
  return null;
}
async function downloadMedia() {
  const list = [...mediaMap.values()];
  console.log(`media: ${list.length} files`);
  await pool(list, async (rec) => {
    const dest = path.join(PUB, rec.local);
    const variants = path.extname(rec.local) ? [[dest, null]] : [[dest, null], ...Object.entries(EXT).map(([ct, ext]) => [dest + ext, ct])];
    for (let [cand, ct] of variants) {
      if (fs.existsSync(cand) && fs.statSync(cand).size > 0) {
        rec.bytes = fs.statSync(cand).size;
        rec.status = 'cached';
        if (!ct && !path.extname(rec.local)) ct = sniffType(fs.readFileSync(cand).subarray(0, 16));
        if (!ct) rec.contentType = (Object.entries(EXT).find(([, e]) => e === path.extname(cand).toLowerCase().replace('.jpeg', '.jpg')) || [])[0];
        if (ct) {
          rec.contentType = ct;
          if (cand !== dest) fs.renameSync(cand, dest); // post-pass renames it back with the extension
        }
        return;
      }
    }
    const { buf, type } = await fetchRetry(rec.remote, { as: 'buffer' }).catch((e) => {
      rec.status = 'failed: ' + e.message;
      throw new Error(`media ${rec.remote}: ${e.message}`);
    });
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    rec.bytes = buf.length;
    rec.contentType = type;
    rec.status = 'ok';
  });
  // post-pass: give extensionless downloads (github user-attachments) a real extension, keep remote URLs for
  // media that failed to download, and point markdown sources at the local copies too.
  const EXT_UNUSED = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov' };
  const replacements = [];
  for (const rec of list) {
    const oldLocal = rec.local;
    if (rec.status && rec.status.startsWith('failed')) {
      replacements.push([oldLocal, rec.remote]);
      rec.local = null;
      continue;
    }
    if (!path.extname(rec.local) && rec.contentType && EXT[rec.contentType.split(';')[0]]) {
      rec.local = oldLocal + EXT[rec.contentType.split(';')[0]];
      fs.renameSync(path.join(PUB, oldLocal), path.join(PUB, rec.local));
      replacements.push([oldLocal, rec.local]);
    }
    if (rec.kind === 'video' && rec.contentType && rec.contentType.startsWith('image/')) rec.kind = 'image';
    if (rec.kind === 'image' && rec.contentType && rec.contentType.startsWith('video/')) rec.kind = 'video';
  }
  const sameOrigin = list.filter((r) => r.local && r.remote.startsWith(ORIGIN)).map((r) => [r.remote.slice(ORIGIN.length), r.local]);
  const remoteToLocal = list.filter((r) => r.local).map((r) => [r.remote, r.local]);
  const files = [];
  const walkDir = (d) => fs.existsSync(d) && fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walkDir(path.join(d, e.name)) : e.name.endsWith('.json') && files.push(path.join(d, e.name))));
  walkDir(path.join(CONTENT, 'docs'));
  walkDir(path.join(CONTENT, 'changelog'));
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const fix = (v) => {
      if (typeof v === 'string') {
        for (const [a, b] of replacements) if (v.includes(a)) v = v.split(a).join(b);
        return v;
      }
      if (Array.isArray(v)) return v.map(fix);
      if (v && typeof v === 'object') {
        for (const k of Object.keys(v)) v[k] = fix(v[k]);
        return v;
      }
      return v;
    };
    fix(data);
    if (typeof data.markdown === 'string') {
      let md = data.markdown;
      for (const [a, b] of remoteToLocal) md = md.split(a).join(b);
      for (const [a, b] of sameOrigin) md = md.replace(new RegExp(`(\\]\\(|src=["'])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), `$1${b}`);
      data.markdown = md;
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  }
  const manifest = list.map((r) => ({ remote: r.remote, local: r.local, kind: r.kind, bytes: r.bytes, contentType: r.contentType, status: r.status, referencedBy: [...r.referencedBy].sort() }));
  writeJSON(path.join(CONTENT, 'media-manifest.json'), manifest);
  return manifest;
}

// ---------------------------------------------------------------- main
async function main() {
  const t0 = Date.now();
  const { text: sitemap } = await fetchRetry(`${ORIGIN}/sitemap.xml`);
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const docsUrls = locs.filter((u) => /\/docs(\/|$)/.test(new URL(u).pathname));
  const postUrls = locs.filter((u) => /^\/changelog\/(?!page\/)[^/]+$/.test(new URL(u).pathname));
  console.log(`sitemap: ${docsUrls.length} docs, ${postUrls.length} changelog posts`);
  const summary = { scrapedAt: new Date().toISOString(), origin: ORIGIN };

  if (ONLY !== 'changelog') {
    // ---- nav
    const { text: docsHtml } = await fetchRetry(`${ORIGIN}/docs`);
    const f = new Flight(docsHtml);
    const holder = f.findElements((e) => { const p = f.deref(e[3]); return p && typeof p === 'object' && p.tree && f.deref(p.tree) && f.deref(p.tree).type === 'root'; })[0];
    if (!holder) throw new Error('page tree not found');
    const tree = f.deref(f.deref(holder[3]).tree);
    const nav = {
      name: tree.name,
      roots: (f.data(tree.children) || []).map((c) => cleanTreeNode(f, c)).filter(Boolean),
      fallback: tree.fallback ? cleanTreeNode(f, { type: 'folder', name: 'fallback', children: f.data(tree.fallback).children || [] }).children : [],
    };
    nav.order = nav.roots.map((r) => ({ root: r.name, pages: flattenPages(r.index ? [r.index, ...r.children] : r.children) }));
    writeJSON(path.join(CONTENT, 'docs/nav.json'), nav);
    console.log(`nav: ${nav.roots.length} roots`);

    // ---- pages
    const pages = await pool(docsUrls, async (u) => {
      const d = await scrapeDoc(u);
      writeJSON(path.join(CONTENT, 'docs', `${d.slug}.json`), d);
      process.stdout.write('.');
      return { slug: d.slug, url: d.url, title: d.title, description: d.description, components: d.components, headings: d.toc.length };
    });
    process.stdout.write('\n');
    const ok = pages.filter(Boolean);
    writeJSON(path.join(CONTENT, 'docs/_pages.json'), ok.sort((a, b) => a.url.localeCompare(b.url)));
    // search index (the live site uses a server endpoint /api/search; this enables a client-side equivalent)
    const search = [];
    for (const p of ok) {
      const d = JSON.parse(fs.readFileSync(path.join(CONTENT, 'docs', `${p.slug}.json`), 'utf8'));
      search.push({ id: d.url, type: 'page', content: d.title, url: d.url, breadcrumbs: d.breadcrumb.map((b) => b.name).slice(0, -1) });
      for (const h of d.toc) search.push({ id: d.url + h.url, type: 'heading', content: h.title, url: d.url + h.url });
      search.push({ id: d.url + '#text', type: 'text', content: d.text.slice(0, 20000), url: d.url });
    }
    writeJSON(path.join(CONTENT, 'docs/_search-index.json'), search);
    summary.docs = { sitemap: docsUrls.length, extracted: ok.length };
  }

  if (ONLY !== 'docs') {
    const idx = await scrapeChangelogIndexPages();
    const orderMap = new Map();
    let pos = 0;
    for (const pg of idx.pages) for (const e of pg.entries) orderMap.set(e.urlSlug, { position: pos++, page: pg.page });
    const posts = await pool(postUrls, async (u) => {
      const p = await scrapeChangelogPost(u);
      writeJSON(path.join(CONTENT, 'changelog', `${p.slug}.json`), p);
      process.stdout.write('.');
      return p;
    });
    process.stdout.write('\n');
    const okPosts = posts.filter(Boolean);
    const list = okPosts
      .map((p) => ({ slug: p.slug, version: p.version, title: p.title, fullTitle: p.fullTitle, date: p.date, dateISO: p.dateISO, summary: p.summary, hero: p.hero, authors: p.authors, url: p.url, indexPage: orderMap.get(p.slug)?.page ?? null, position: orderMap.get(p.slug)?.position ?? null }))
      .sort((a, b) => (a.position ?? 1e9) - (b.position ?? 1e9) || (b.dateISO || '').localeCompare(a.dateISO || ''));
    writeJSON(path.join(CONTENT, 'changelog/index.json'), {
      totalPages: idx.total,
      pageSize: 10,
      pages: idx.pages.map((pg) => ({ page: pg.page, url: pg.url, slugs: pg.entries.map((e) => e.urlSlug) })),
      posts: list,
      notInIndex: list.filter((p) => p.position === null).map((p) => p.slug),
    });
    summary.changelog = { sitemap: postUrls.length, extracted: okPosts.length, indexPages: idx.total, indexEntries: orderMap.size };
  }

  if (!NO_MEDIA) {
    const manifest = await downloadMedia();
    summary.media = { total: manifest.length, ok: manifest.filter((m) => m.status === 'ok' || m.status === 'cached').length, bytes: manifest.reduce((a, m) => a + (m.bytes || 0), 0) };
  }
  summary.failures = failures;
  summary.seconds = Math.round((Date.now() - t0) / 1000);
  writeJSON(path.join(CONTENT, 'scrape-summary.json'), summary);
  console.log(JSON.stringify(summary, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
