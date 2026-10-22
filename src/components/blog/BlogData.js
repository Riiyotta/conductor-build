import index from '../../content/blog/index.json'

// Index metadata is tiny and bundled with the (lazy) blog chunk; post bodies are loaded per slug.
export const POSTS = index
export const hasPost = (slug) => POSTS.some((p) => p.slug === slug)

const loaders = import.meta.glob(['../../content/blog/*.json', '!../../content/blog/index.json'])
export async function loadPost(slug) {
  const load = loaders[`../../content/blog/${slug}.json`]
  return load ? (await load()).default : null
}
