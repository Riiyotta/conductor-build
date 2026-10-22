import { Link } from 'react-router-dom'
import './changelog.css'

// CLONE_SPEC_DOCS §5.2. One entry: meta column (version badge + date; absolute at left −12rem and
// sticky at top 96px from md) and the content column (title + markdown body).
// `variant`: 'index' (article with separator, linked badge/title) or 'post' (h1, no border).

const BADGE =
  'inline-flex items-center text-xs font-mono tracking-wider uppercase bg-tip-secondary border border-tip-secondary-border text-tip-muted rounded-xs px-1 py-0.5'

export default function ChangelogEntry({ post, html, variant = 'index' }) {
  const isIndex = variant === 'index'
  return (
    <article
      id={isIndex ? post.version.replace(/\./g, '-') : undefined}
      className={
        isIndex
          ? 'relative mb-14 scroll-mt-8 border-b border-border/40 pb-14 last:mb-0 last:border-b-0 last:pb-0'
          : 'relative'
      }
    >
      <div className="mb-5 flex flex-col items-start gap-3 text-left md:absolute md:inset-y-0 md:left-[-12rem] md:mb-0 md:w-40 md:pt-1">
        <div className="flex flex-col items-start gap-3 md:sticky md:top-24">
          {isIndex ? (
            <Link to={post.url}>
              <div className={`${BADGE} transition-colors hover:text-foreground`}>{post.version}</div>
            </Link>
          ) : (
            <div className={BADGE}>{post.version}</div>
          )}
          <span className="text-sm text-muted-foreground">{post.date}</span>
        </div>
      </div>
      <div className="min-w-0">
        {isIndex ? (
          <Link
            to={post.url}
            className="mb-6 block text-2xl font-semibold text-foreground hover:underline sm:text-3xl"
          >
            {post.title}
          </Link>
        ) : (
          <h1 className="mb-6 text-3xl font-semibold text-foreground">{post.title}</h1>
        )}
        {/* display:contents keeps the body's p/ul/h3… as direct flow children of div.min-w-0, as on the original */}
        <div className="contents" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </article>
  )
}
