// Changelog data layer (CLONE_SPEC_DOCS §5, §6.1).
// index.json (display order, page slugs, per-post meta) is bundled with the changelog chunk;
// per-post bodies are code-split: one lazy chunk per post, importing only its `html` field.
import index from '../../content/changelog/index.json'

export const TOTAL_PAGES = index.totalPages
export const PAGES = index.pages
export const POSTS_BY_SLUG = Object.fromEntries(index.posts.map((p) => [p.slug, p]))
export const LATEST = index.posts[0]

const bodyLoaders = import.meta.glob(
  ['../../content/changelog/*.json', '!../../content/changelog/index.json'],
  { import: 'html' },
)
const loaderBySlug = Object.fromEntries(
  Object.entries(bodyLoaders).map(([path, load]) => [path.slice(path.lastIndexOf('/') + 1, -5), load]),
)

// Page numbers shown in the pager (§5.3): first, last, current ±1; "..." before any number that
// follows a gap. Returns [{ page, ellipsis }].
export function pagerItems(current, total = TOTAL_PAGES) {
  const shown = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b)
  return shown.map((page, i) => ({ page, ellipsis: i > 0 && page - shown[i - 1] > 1 }))
}

export const pageUrl = (n) => (n === 1 ? '/changelog' : `/changelog/page/${n}`)

// ---------------------------------------------------------------------------------------------
// Body decoration. The scraped `html` has its classes stripped (§6.1); re-apply the original
// per-tag classes (§5.2, verified against the live SSR markup) and rebuild the asset shells and
// info callouts exactly as the original renders them.
// ---------------------------------------------------------------------------------------------
const TAG_CLASSES = {
  p: 'text-base text-foreground mb-4',
  a: 'text-foreground underline hover:no-underline',
  h2: 'text-xl font-semibold text-foreground mt-8 mb-3',
  h3: 'text-lg font-semibold text-foreground mt-6 mb-2',
  h4: 'text-base font-semibold text-foreground mt-4 mb-2',
  ul: 'list-disc list-outside ml-8 pl-2 space-y-2 mb-4',
  li: 'text-base text-foreground',
  strong: 'font-semibold text-foreground',
  em: 'italic',
  // Original `rounded` is Tailwind v4 → var(--radius) = 8px (§5.2); here that is `rounded-lg`.
  code: 'bg-muted px-1.5 py-0.5 rounded-lg text-sm',
  pre: 'mb-6 overflow-x-auto',
}

const SHELL_OPEN = '<span class="docs-asset-shell not-prose my-10 block"><span class="docs-asset-frame">'
const SHELL_CLOSE = '</span></span>'

const INFO_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info size-5" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>'

// Cloudflare email obfuscation: the live page's email-decode script replaces `a.__cf_email__`
// with a plain text node holding the decoded address.
function cfDecode(hex) {
  const key = parseInt(hex.slice(0, 2), 16)
  let out = ''
  for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key)
  return out
}

// The scraper's Cloudflare-email decode replaced two markdown link labels with the address; restore
// them from each post's `markdown` (verified live).
const MAILTO_LABELS = {
  '0.1.0-mcps-message-queues': 'please let us know',
  '0.28.2-bug-fixes-legendary-cities-an-experiment': "Let us know if you'd like to try it out",
}

export function decorateBody(html, slug) {
  // <figure> can't live inside <p>/<li> in parsed HTML, so swap it for the original span shell first.
  const src = html.replace(/<figure data-asset>([\s\S]*?)<\/figure>/g, `${SHELL_OPEN}$1${SHELL_CLOSE}`)
  const tpl = document.createElement('template')
  tpl.innerHTML = src
  const root = tpl.content

  root.querySelectorAll('a[data-cfemail]').forEach((a) => {
    a.replaceWith(document.createTextNode(cfDecode(a.getAttribute('data-cfemail'))))
  })

  // Info callouts (11, all empty except 0.77.0's), rebuilt from the live markup.
  // Live: every body link (mailto included) is target=_blank rel="noopener noreferrer".
  root.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
    if (MAILTO_LABELS[slug]) a.textContent = MAILTO_LABELS[slug]
  })

  root.querySelectorAll('div[role="note"]').forEach((note) => {
    note.className =
      'not-prose my-6 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1.5 rounded-[1rem] border px-3.5 py-2.5 sm:px-4 sm:py-3 bg-muted [&_p]:mb-0'
    const [icon, body] = note.children
    if (icon) {
      icon.className = 'mt-0.5 flex size-7 items-center justify-center rounded-full border'
      icon.innerHTML = INFO_ICON
    }
    if (body) {
      body.className = 'min-w-0'
      const label = body.querySelector(':scope > span')
      if (label) label.className = 'sr-only'
      const desc = body.querySelector(':scope > div')
      if (desc) desc.className = 'empty:hidden text-[0.95rem] text-muted-foreground'
    }
  })

  for (const [tag, cls] of Object.entries(TAG_CLASSES)) {
    root.querySelectorAll(tag).forEach((el) => el.setAttribute('class', cls))
  }

  // Media inside the shells.
  root.querySelectorAll('.docs-asset-frame > img').forEach((img) => {
    img.setAttribute('decoding', 'async')
    img.setAttribute('class', 'docs-asset-media docs-asset-image')
    img.setAttribute('style', 'color:transparent')
  })
  root.querySelectorAll('.docs-asset-frame > video').forEach((video) => {
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('class', 'docs-asset-media docs-asset-video bg-black')
  })

  // A standalone image/video paragraph: the scraper unwrapped `<p><shell/></p>`; put the p back.
  Array.from(root.children).forEach((el) => {
    if (el.classList.contains('docs-asset-shell')) {
      const p = document.createElement('p')
      p.className = TAG_CLASSES.p
      el.replaceWith(p)
      p.appendChild(el)
    }
  })

  return tpl.innerHTML
}

const cache = new Map()

export function loadBody(slug) {
  if (!cache.has(slug)) {
    const load = loaderBySlug[slug]
    cache.set(slug, load ? load().then((html) => decorateBody(html, slug)) : Promise.reject(new Error(`Unknown changelog post ${slug}`)))
  }
  return cache.get(slug)
}

export const hasPost = (slug) => slug in loaderBySlug && slug in POSTS_BY_SLUG
