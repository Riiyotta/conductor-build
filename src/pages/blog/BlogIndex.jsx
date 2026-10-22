import { Link } from 'react-router-dom'
import PageShell from '../../components/pages/PageShell.jsx'
import { POSTS } from '../../components/blog/BlogData.js'
import '../../components/blog/blog.css'

// /blog. The original keeps the homepage <title>/description here (no per-page metadata).
export default function BlogIndex() {
  return (
    <PageShell
      title="Conductor - Run a team of coding agents in the cloud"
      description="Run coding agents in isolated cloud sandboxes with Conductor Cloud."
    >
      <div className="blog-index bg-background">
        <section>
          <div className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-8">
            <h1 className="mb-12 font-mono text-3xl font-semibold text-foreground">Blog</h1>
            <div className="space-y-12">
              {POSTS.map((p) => (
                <article key={p.slug}>
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">{p.date}</span>
                  </div>
                  <Link
                    to={`/blog/${p.slug}`}
                    className="mb-3 block text-xl font-semibold text-foreground hover:underline sm:text-2xl"
                  >
                    {p.title}
                  </Link>
                  <p className="mb-3 text-sm text-muted-foreground">{p.description}</p>
                  <p className="text-sm text-muted-foreground">By {p.authors.join(', ')}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
