import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import PageShell from '../../components/pages/PageShell.jsx'
import ChangelogEntry from '../../components/changelog/ChangelogEntry.jsx'
import { POSTS_BY_SLUG, hasPost, loadBody } from '../../components/changelog/changelogData.js'
import { useScrollToHashWhenReady } from './useScrollToHashWhenReady.js'

// /changelog/:slug (CLONE_SPEC_DOCS §5.4). Unknown slugs redirect to /changelog (original: 307).
export default function ChangelogPost() {
  const { slug } = useParams()
  if (!hasPost(slug)) return <Navigate to="/changelog" replace />
  return <PostPage key={slug} slug={slug} />
}

function PostPage({ slug }) {
  const post = POSTS_BY_SLUG[slug]
  const [html, setHtml] = useState(null)
  const { hash } = useLocation()

  useEffect(() => {
    let alive = true
    loadBody(slug).then((h) => alive && setHtml(h))
    return () => {
      alive = false
    }
  }, [slug])
  useScrollToHashWhenReady(hash, html !== null)

  return (
    <PageShell
      title={`${post.fullTitle} | Conductor Changelog`}
      description={`Conductor ${post.version} changelog - ${post.title}`}
    >
      <section className="changelog-container pb-24 pt-10 md:py-24">
        <Link
          to="/changelog"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-arrow-left h-4 w-4"
            aria-hidden="true"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Back to changelog
        </Link>
        {html === null ? (
          <div className="min-h-screen" />
        ) : (
          <ChangelogEntry post={post} html={html} variant="post" />
        )}
      </section>
    </PageShell>
  )
}
