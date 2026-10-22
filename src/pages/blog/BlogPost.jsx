import { useEffect, useState } from 'react'
import PageShell from '../../components/pages/PageShell.jsx'
import BlogPostBody from '../../components/blog/BlogPostBody.jsx'
import { loadPost } from '../../components/blog/BlogData.js'

// /blog/:slug. Title "<title> | Conductor Blog"; og:title is the title alone only for posts that set one (series-a).
export default function BlogPost({ slug, meta }) {
  const [post, setPost] = useState(null)
  useEffect(() => {
    let alive = true
    loadPost(slug).then((p) => alive && setPost(p))
    return () => {
      alive = false
    }
  }, [slug])

  return (
    <PageShell title={`${meta.title} | Conductor Blog`} description={meta.description}>
      <section className="mx-auto max-w-2xl px-8 py-24">
        <article>
          <div className="mb-3">
            <span className="text-sm text-muted-foreground">{meta.date}</span>
          </div>
          <h1 className="mb-8 text-3xl font-semibold text-foreground">{meta.title}</h1>
          {post ? (
            <>
              {post.hero && (
                <img
                  src={post.hero}
                  alt={post.title}
                  width={post.heroSize[0]}
                  height={post.heroSize[1]}
                  decoding="async"
                  className="mb-8 h-auto w-full rounded-lg"
                />
              )}
              <BlogPostBody blocks={post.blocks} />
            </>
          ) : (
            <div className="min-h-screen" />
          )}
        </article>
      </section>
    </PageShell>
  )
}
