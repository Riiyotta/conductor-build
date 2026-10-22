#!/usr/bin/env node
/**
 * Measures the rendered height of every section node of every route at a 1440px viewport and (with --write)
 * records it in extraction/measured-values.json under `sectionHeights.routes`. verify_all.py then runs the
 * whole-page-wrapper gate against that ledger. This script is NOT run by verify_all.py (it needs a browser).
 *
 *   # 1. build and serve the sibling clone:   npx vite build && npx vite preview --port 5473
 *   # 2. from design-repo/:
 *   PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs node extraction/measure_sections.mjs --write
 *
 * Env: BASE_URL (default http://localhost:5473), PLAYWRIGHT (module specifier or file path; default "playwright").
 * Flags: --write (update the ledger), --routes=/a,/b (subset, print only), --write --merge --template=template.x (re-measure one template and merge it into the ledger).
 *
 * Method. Each node owns a range of DOM elements (selectors below, written against the clone's structure at
 * 1440px). Height = border-box extent of the range (top of the first element to bottom of the last, including
 * the owning block's own bottom margin where the next node starts after it). A node whose elements are not
 * contiguous (join-us prose) is the sum of its contiguous extents. A node that repeats on a page (the changelog
 * index entry header/body, ten per page) is recorded as an array, one number per instance. Out-of-flow nodes are
 * omitted: overlays (dialogs, drawers) and anything not rendered at 1440px (mobile menu, docs sub-nav). The
 * sticky/absolute changelog meta column adds no flow height and is part of the header node.
 * pageHeight is document.documentElement.scrollHeight. Media requests are aborted (CSS boxes fix their size).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = path.dirname(ROOT);
const BASE = process.env.BASE_URL || 'http://localhost:5473';
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const MERGE = args.includes('--merge'); // with --write: update only the routes measured, keep the rest of the ledger
const TEMPLATE = (args.find((a) => a.startsWith('--template=')) || '').slice(11);
const SUBSET = (args.find((a) => a.startsWith('--routes=')) || '').slice(9).split(',').filter(Boolean);
if (WRITE && SUBSET.length) throw new Error('--write and --routes are mutually exclusive');
if (WRITE && TEMPLATE && !MERGE) throw new Error('--template with --write needs --merge');

const spec = process.env.PLAYWRIGHT || 'playwright';
const { chromium } = await import(spec.startsWith('/') ? 'file://' + spec : spec);

const J = (p) => JSON.parse(readFileSync(p, 'utf8'));
const templates = J(path.join(ROOT, 'templates/templates.json')).templates;

function enumerateRoutes() {
  const docs = J(path.join(PROJECT, 'src/content/docs/_pages.json')).map((d) => d.url);
  const cl = J(path.join(PROJECT, 'src/content/changelog/index.json'));
  const exact = Object.values(templates).flatMap((t) => t.routes.exact || []);
  const pages = Array.from({ length: cl.totalPages - 1 }, (_, i) => `/changelog/page/${i + 2}`);
  return [...exact, ...docs, '/changelog', ...pages, ...cl.posts.map((p) => p.url)];
}
function templateOf(route) {
  const hits = Object.entries(templates).filter(([, t]) => (t.routes.exact ? t.routes.exact.includes(route) : new RegExp(t.routes.regex).test(route)));
  if (hits.length !== 1) throw new Error(`${route} matches ${hits.length} templates`);
  return hits[0][0];
}

// ---- runs inside the page
function measureInPage(tid) {
  const out = {};
  const T = (el) => el.getBoundingClientRect().top + scrollY;
  const B = (el) => el.getBoundingClientRect().bottom + scrollY;
  const mb = (el) => parseFloat(getComputedStyle(el).marginBottom) || 0;
  const ext = (els) => {
    els = els.filter(Boolean);
    return els.length ? Math.round(Math.max(...els.map(B)) - Math.min(...els.map(T))) : 0;
  };
  const q = (sel, el = document) => el.querySelector(sel);
  const must = (el, what) => {
    if (!el) throw new Error('missing ' + what);
    return el;
  };
  const put = (key, val) => {
    out[key] = val; // 0 is a real measurement (the docs pager renders as an empty 0px block on pages with no neighbours)
  };
  const hdr = must(q('header.sticky'), 'header');
  const ftr = must([...document.querySelectorAll('footer')].pop(), 'footer'); // the site footer is the last <footer>
  put('shell.header/default', ext([hdr]));
  put(`shell.footer-${tid === 'template.home' ? 'sans' : 'mono'}/default`, ext([ftr]));
  const main = q('main.bg-background');
  const sec = main && q(':scope > section', main);
  const kids = (el) => [...el.children];

  if (tid === 'template.home') {
    const root = must(q('#root > div'), 'root');
    const k = kids(root).filter((e) => e !== hdr && e !== ftr && getComputedStyle(e).position !== 'fixed' && e.getBoundingClientRect().height > 0);
    if (k.length !== 6) throw new Error('home expected 6 blocks, got ' + k.length);
    put('hero.home/default', ext([k[0]]));
    put('proof.trusted-logo-strip/default', ext([k[1]]));
    const f = kids(k[2]);
    ['multiplayer', 'cloud-sandbox', 'byok', 'anywhere'].forEach((v, i) => put(`features.feature-shell/${v}`, ext([f[i]])));
    put('proof.testimonials/default', ext([k[3]]));
    put('content.changelog-preview/default', ext([k[4]]));
    put('conversion.be-like-this-guy/default', ext([k[5]]));
  } else if (tid === 'template.pricing') {
    const wrap = must(q(':scope > div', sec), 'pricing wrapper');
    put('hero.pricing-title/default', ext([must(q(':scope > h1', sec), 'h1')]));
    const k = kids(must(wrap.firstElementChild, 'pricing inner wrapper'));
    if (k.length !== 3) throw new Error('pricing expected plans, logo strip and FAQ, got ' + k.length);
    put('content.pricing-plans/default', ext([k[0]]));
    put('proof.trusted-logo-strip/default', ext([k[1]]));
    put('content.pricing-faq/default', ext([k[2]]));
  } else if (tid === 'template.enterprise') {
    const [h, art] = kids(sec);
    put('hero.page-header/max-w-3xl', ext([h]));
    const k = kids(art);
    put('content.prose-article/default', ext([k[0]]));
    put('proof.enterprise-logo-grid/default', ext([k[1]]));
    put('conversion.enterprise-contact-form/default', ext([k[2]]));
  } else if (tid === 'template.team-plan') {
    const [h, art] = kids(sec);
    put('hero.page-header/max-w-2xl', ext([h]));
    put('conversion.team-plan-form-scrollbox/default', ext(kids(art)));
  } else if (tid === 'template.prose-page') {
    const [h, art] = kids(sec);
    put('hero.page-header/max-w-3xl', ext([h]));
    put('content.prose-article/default', ext([art]));
  } else if (tid === 'template.join-us') {
    const [h, art] = kids(sec);
    put('hero.page-header/max-w-3xl', ext([h]));
    const owner = (e) => (e.tagName === 'A' ? 'apply' : e.tagName === 'IMG' ? 'photo' : e.tagName === 'ARTICLE' ? 'cards' : 'prose');
    const runs = { apply: [], photo: [], cards: [], prose: [] };
    let prev = null;
    for (const e of kids(art)) {
      const o = owner(e);
      if (o !== prev) runs[o].push([]);
      runs[o][runs[o].length - 1].push(e);
      prev = o;
    }
    const sum = (rs) => rs.reduce((n, r) => n + ext(r), 0);
    put('content.prose-article/default', sum(runs.prose));
    put('content.join-us-apply-card/default', sum(runs.apply));
    put('content.join-us-team-photo/default', sum(runs.photo));
    put('content.join-us-team-cards/default', sum(runs.cards));
  } else if (tid === 'template.brandkit') {
    const k = kids(sec);
    put('hero.brandkit-header/default', ext([k[0], k[1]]));
    put('content.brandkit-download-card/default', ext([k[2]]));
    put('content.brandkit-asset-cards/default', ext([k[3]]));
    put('content.brandkit-about/default', ext([k[4]]));
  } else if (tid === 'template.legal') {
    const art = must(q('article', main), 'article');
    const k = kids(art);
    const cut = B(k[1]) + mb(k[1]);
    put('content.legal-header/default', Math.round(cut - T(k[0])));
    put('content.legal-body/default', Math.round(B(art) - cut));
  } else if (tid === 'template.docs-page') {
    const lay = must(q('#nd-docs-layout'), 'docs layout');
    put('docs.sidebar/default', ext([q('#nd-sidebar', lay)]));
    const art = must(q('#nd-page', lay), 'docs article');
    put('docs.breadcrumb/default', ext([q('.docs-breadcrumb', art)]));
    const prose = must(q('.docs-prose', art), 'docs prose');
    const titleEls = kids(art).filter((e) => e.matches('h1, p') && T(e) < T(prose));
    put('docs.page-title/default', ext(titleEls));
    put('docs.prose-body/default', ext([prose]));
    put('docs.prev-next/default', ext([must(q('.docs-pager', art), 'docs pager')]));
    put('docs.toc/default', ext([q('#nd-toc', lay)]));
  } else if (tid === 'template.changelog-index') {
    const list = must(q(':scope > div', sec), 'changelog list');
    const arts = kids(list).filter((e) => e.tagName === 'ARTICLE');
    const heads = [];
    const bodies = [];
    for (const a of arts) {
      const mw = must(q(':scope > div.min-w-0', a), 'content column');
      const title = must(q(':scope > a', mw), 'title');
      heads.push(Math.round(B(title) + mb(title) - T(title)));
      bodies.push(Math.round(B(mw) - B(title) - mb(title)));
    }
    put('changelog.entry-header/index', heads);
    put('changelog.entry-body/default', bodies);
    put('changelog.pagination/default', ext([q(':scope > nav', list)]));
  } else if (tid === 'template.changelog-post') {
    put('changelog.back-link/default', ext([q(':scope > a', sec)]));
    const art = must(q(':scope > article', sec), 'article');
    const mw = must(q(':scope > div.min-w-0', art), 'content column');
    const h1 = must(q(':scope > h1', mw), 'h1');
    put('changelog.entry-header/post', Math.round(B(h1) + mb(h1) - T(h1)));
    put('changelog.entry-body/default', Math.round(B(mw) - B(h1) - mb(h1)));
  } else {
    throw new Error('no extractor for ' + tid);
  }
  return { pageHeight: document.documentElement.scrollHeight, sections: out };
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));

const routes = SUBSET.length ? SUBSET : enumerateRoutes().filter((r) => !TEMPLATE || templateOf(r) === TEMPLATE);
const result = {};
for (const route of routes) {
  const tid = templateOf(route);
  await page.goto(BASE + route, { waitUntil: 'load' });
  await page.waitForSelector(tid.startsWith('template.changelog') ? 'article' : 'footer');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(250);
  const m = await page.evaluate(measureInPage, tid);
  result[route] = { template: tid, pageHeight: m.pageHeight, sections: m.sections };
  if (!WRITE) console.log(route, JSON.stringify(m));
}
await browser.close();

if (WRITE) {
  const file = path.join(ROOT, 'extraction/measured-values.json');
  const doc = J(file);
  const prev = doc.sectionHeights || {};
  doc.sectionHeights = {
    ...prev,
    viewport: { width: 1440, height: 900 },
    measuredFrom: 'built clone served by vite preview, Chromium via Playwright, media requests aborted; see the header of extraction/measure_sections.mjs for the method',
    routes: MERGE ? { ...(prev.routes || {}), ...result } : result,
  };
  writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
  console.log(`wrote sectionHeights for ${routes.length} routes`);
}
