import { useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import PageShell from '../../components/pages/PageShell.jsx'
import ChangelogEntry from '../../components/changelog/ChangelogEntry.jsx'
import ChangelogPager from '../../components/changelog/ChangelogPager.jsx'
import { LATEST, PAGES, POSTS_BY_SLUG, TOTAL_PAGES, loadBody } from '../../components/changelog/changelogData.js'
import { useScrollToHashWhenReady } from './useScrollToHashWhenReady.js'

// /changelog and /changelog/page/:n (CLONE_SPEC_DOCS §5.1–5.3). Invalid page numbers (incl. /page/1)
// redirect to /changelog, as the original's 307 does.
export default function ChangelogIndex() {
  const { n } = useParams()
  const page = n === undefined ? 1 : /^\d+$/.test(n) ? Number(n) : NaN
  const valid = Number.isInteger(page) && page >= 1 && page <= TOTAL_PAGES && !(n !== undefined && page === 1)
  if (!valid) return <Navigate to="/changelog" replace />
  return <IndexPage key={page} page={page} />
}

function IndexPage({ page }) {
  const slugs = PAGES[page - 1].slugs
  const [bodies, setBodies] = useState(null)
  const { hash } = useLocation()

  useEffect(() => {
    let alive = true
    Promise.all(slugs.map(loadBody)).then((html) => alive && setBodies(html))
    return () => {
      alive = false
    }
  }, [slugs])
  useScrollToHashWhenReady(hash, bodies !== null)

  return (
    <PageShell
      title={page === 1 ? 'Conductor Changelog' : `Conductor Changelog, page ${page}`}
      description={`Latest: v${LATEST.version} · ${LATEST.date}`}
    >
      <section className="changelog-container pb-24 pt-10 md:py-24">
        {bodies ? (
          <div>
            {slugs.map((slug, i) => (
              <ChangelogEntry key={slug} post={POSTS_BY_SLUG[slug]} html={bodies[i]} variant="index" />
            ))}
            <ChangelogPager page={page} />
          </div>
        ) : (
          <div className="min-h-screen" />
        )}
      </section>
    </PageShell>
  )
}
