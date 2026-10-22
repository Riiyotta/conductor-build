import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import NotFound from '../NotFound.jsx'
import usePageMeta from '../../components/pages/usePageMeta.js'
import Lucide from '../../components/docs/icons.jsx'
import DocsSidebar from '../../components/docs/Sidebar.jsx'
import Toc from '../../components/docs/Toc.jsx'
import { MobileDrawer, MobileSubnav } from '../../components/docs/MobileNav.jsx'
import { SearchProvider } from '../../components/docs/Search.jsx'
import { Nodes, PageContext } from '../../components/docs/Body.jsx'
import { findRoot, hasPage, loadPage, slugFromPath } from '../../components/docs/content.js'
import '../../components/docs/docs.css'

// /docs/* (CLONE_SPEC_DOCS §1): marketing header (md+), fumadocs grid with sidebar / article / TOC,
// mobile subnav + drawer (<md), footer (mono).

function setOgImage(url) {
  const el = document.head.querySelector('meta[property="og:image"]')
  if (el && url) el.setAttribute('content', url)
}

function Breadcrumb({ items }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="docs-breadcrumb font-sans text-sm font-medium tracking-[-0.025em] text-muted-foreground"
    >
      <ol className="flex gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={i} className="flex shrink-0 items-center gap-1.5">
              {i > 0 && <Lucide name="chevron-right" className="size-4 shrink-0" />}
              <span aria-current={last ? 'page' : undefined} className={last ? 'font-medium text-primary' : undefined}>
                {item.name}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function PrevNext({ previous, next }) {
  // Rendered even when empty: the original keeps the (0-height) grid, so the article's 16px gap remains.
  const card =
    'docs-pager-item flex flex-col gap-2 rounded-lg border border-border p-4 text-sm transition-colors hover:bg-muted/80 hover:text-foreground'
  const both = previous && next
  return (
    <div className={`docs-pager grid grid-cols-1 gap-4 ${both ? 'md:grid-cols-2' : ''}`}>
      {previous && (
        <Link to={previous.url} className={card}>
          <div className="inline-flex items-center gap-1.5 font-medium">
            <Lucide name="chevron-left" className="-mx-1 size-4 shrink-0" />
            <p>{previous.title}</p>
          </div>
          <p className="truncate text-muted-foreground">{previous.description}</p>
        </Link>
      )}
      {next && (
        <Link to={next.url} className={`${card} text-end`}>
          <div className="inline-flex flex-row-reverse items-center gap-1.5 font-medium">
            <Lucide name="chevron-right" className="-mx-1 size-4 shrink-0" />
            <p>{next.title}</p>
          </div>
          <p className="truncate text-muted-foreground">{next.description}</p>
        </Link>
      )}
    </div>
  )
}

function Article({ page }) {
  return (
    <article
      id="nd-page"
      className="docs-page mx-auto flex w-full min-w-0 max-w-[900px] flex-col gap-4 px-4 py-6 md:px-6 md:pt-8 xl:px-8 xl:pt-4"
      style={{ gridArea: 'main' }}
    >
      {page && (
        <>
          <Breadcrumb items={page.breadcrumb || []} />
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-foreground md:text-[2.6rem]">
            {page.title}
          </h1>
          {page.description && (
            <p className="mb-0 mt-2 max-w-3xl text-base text-muted-foreground md:text-lg">{page.description}</p>
          )}
          <div className="docs-prose flex-1 pt-1">
            <PageContext.Provider value={{ body: page.body }}>
              <Nodes nodes={page.body} />
            </PageContext.Provider>
          </div>
          <PrevNext previous={page.previous} next={page.next} />
        </>
      )}
    </article>
  )
}

export default function DocsPage() {
  const { pathname, hash } = useLocation()
  const slug = slugFromPath(pathname)
  const exists = hasPage(slug)
  const [page, setPage] = useState(null)
  const [drawer, setDrawer] = useState('closed')

  useEffect(() => {
    if (!exists) return
    let cancelled = false
    loadPage(slug).then((p) => {
      if (!cancelled) setPage(p)
    })
    return () => {
      cancelled = true
    }
  }, [slug, exists])

  // Close the mobile drawer on navigation (fumadocs behaviour).
  useEffect(() => {
    setDrawer((d) => (d === 'open' ? 'closing' : d))
  }, [pathname])

  // Content arrives after the route change: honour #hash once the page body has rendered.
  const loaded = page && page.url === (pathname.replace(/\/+$/, '') || '/docs')
  useEffect(() => {
    if (!loaded) return
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [loaded, hash])

  usePageMeta(
    page?.meta?.title || 'Conductor Docs',
    page?.description || 'Learn what Conductor is and where to start in the docs',
  )
  useEffect(() => {
    if (page?.meta?.ogImage) setOgImage(page.meta.ogImage)
  }, [page])

  if (!exists) return <NotFound />

  const shown = loaded ? page : null
  const activeUrl = pathname.replace(/\/+$/, '') || '/docs'
  const root = findRoot(activeUrl)

  return (
    <SearchProvider>
      <div className="docs-root bg-background font-sans text-foreground">
        <div className="hidden md:contents">
          <Header />
        </div>
        <div id="nd-docs-layout">
          <MobileSubnav onOpenSidebar={() => setDrawer('open')} />
          <DocsSidebar root={root} activeUrl={activeUrl} />
          <Article page={shown} />
          <Toc key={activeUrl} items={shown?.toc || []} />
        </div>
        <Footer mono />
        <MobileDrawer
          state={drawer}
          onClose={() => setDrawer((d) => (d === 'open' ? 'closing' : d))}
          root={root}
          activeUrl={activeUrl}
        />
      </div>
    </SearchProvider>
  )
}
