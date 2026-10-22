// Docs content access (CLONE_SPEC_DOCS §6). Every page JSON is its own lazy chunk (import.meta.glob),
// so nothing here reaches the homepage bundle.
import nav from '../../content/docs/nav.json'

const PAGE_GLOB = import.meta.glob(['../../content/docs/**/*.json', '!**/_*.json', '!**/nav.json'], {
  import: 'default',
})

const FIELDS = ['slug', 'url', 'title', 'description', 'meta', 'breadcrumb', 'toc', 'previous', 'next', 'body']

function keyFor(slug) {
  return `../../content/docs/${slug}.json`
}

export function slugFromPath(pathname) {
  const rest = pathname.replace(/^\/docs\/?/, '').replace(/\/+$/, '')
  return rest === '' ? 'index' : rest
}

export function hasPage(slug) {
  return Boolean(PAGE_GLOB[keyFor(slug)])
}

export async function loadPage(slug) {
  const loader = PAGE_GLOB[keyFor(slug)]
  if (!loader) return null
  const data = await loader()
  const page = {}
  for (const f of FIELDS) page[f] = data[f]
  return page
}

export function allSlugs() {
  return Object.keys(PAGE_GLOB).map((k) => k.replace('../../content/docs/', '').replace(/\.json$/, ''))
}

// ---- page tree helpers ----
export const ROOTS = nav.roots

function containsUrl(node, url) {
  if (node.type === 'page') return node.url === url
  if (node.index && node.index.url === url) return true
  return (node.children || []).some((c) => containsUrl(c, url))
}

// The root (sidebar tab) the current page belongs to, or null for fallback-only pages (§1.3).
export function findRoot(url) {
  return ROOTS.find((r) => containsUrl(r, url)) || null
}

export function folderContains(folder, url) {
  return containsUrl(folder, url)
}

// Search-result breadcrumb trail ("Conductor › Reference › Settings"), derived from the URL's
// folder segments (the live endpoint returns the page-tree path; not in the scraped index).
const SEGMENT_TITLES = {
  reference: 'Reference',
  settings: 'Settings',
  harnesses: 'Harnesses',
  scripts: 'Scripts',
  cloud: 'Cloud',
  concepts: 'Concepts',
  guides: 'Guides',
  api: 'API',
  'git-worktrees': 'Git Worktrees',
  'parallel-agents': 'Parallel agents',
  repositories: 'Repositories',
  troubleshooting: 'Troubleshooting',
}
export function searchBreadcrumbs(url) {
  const segs = url.replace(/^\/docs\/?/, '').split('/').filter(Boolean)
  segs.pop()
  return [nav.name, ...segs.map((s) => SEGMENT_TITLES[s] || s.charAt(0).toUpperCase() + s.slice(1))]
}
