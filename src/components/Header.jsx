import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useDownloadDialog } from './DownloadDialog.jsx'

// §1 Header (sticky, no scroll-state change)
const NAV_ITEMS = [
  { label: 'Changelog', href: '/changelog' },
  { label: 'Docs', href: '/docs' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Enterprise', href: '/enterprise' },
  { label: 'Join Us', href: '/join-us' },
  { label: 'Sign in', href: 'https://app.conductor.build' },
]

// Internal links route client-side; external ones (Sign in) stay plain anchors.
function NavAnchor({ href, ...props }) {
  return href.startsWith('/') ? <Link to={href} {...props} /> : <a href={href} {...props} />
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { open: openDownload } = useDownloadDialog()
  // CLONE_SPEC_PAGES §0.1: the current route's link gets aria-current="page" + #2c2826.
  const { pathname } = useLocation()
  // Section match: the live site also marks "Changelog" on /changelog/page/n and posts, "Docs" on /docs/*.
  const isCurrent = (href) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="sticky top-0 z-40 font-sans">
      <div className="border-b border-border bg-background">
        <div className="relative mx-auto grid h-14 w-full max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              to="/"
              aria-label="Conductor home"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground"
            >
              <Icon name="logomark" className="aspect-[115/174] h-7" />
            </Link>
          </div>
          <div />
          <div className="flex min-w-0 items-center justify-end gap-3 md:gap-6">
            <nav
              aria-label="Site"
              className="top-nav-scroll-mask hidden max-w-[calc(100vw-10rem)] items-center gap-6 overflow-x-auto overscroll-x-contain p-1 md:flex"
            >
              {NAV_ITEMS.map((item) => (
                <NavAnchor
                  key={item.href}
                  href={item.href}
                  aria-current={isCurrent(item.href) ? 'page' : undefined}
                  className={`whitespace-nowrap text-sm transition-colors ${
                    isCurrent(item.href) ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  {item.label}
                </NavAnchor>
              ))}
              <button
                type="button"
                onClick={openDownload}
                className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-foreground px-3 py-3 text-sm font-medium text-background hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2"
              >
                Download
              </button>
            </nav>
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted md:hidden"
            >
              <Icon name={menuOpen ? 'x' : 'menu'} className="size-4" />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <nav aria-label="Mobile" className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-3">
              {NAV_ITEMS.map((item) => (
                <NavAnchor
                  key={item.href}
                  href={item.href}
                  aria-current={isCurrent(item.href) ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground ${
                    isCurrent(item.href) ? 'text-foreground' : 'text-foreground/70'
                  }`}
                >
                  {item.label}
                </NavAnchor>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  openDownload()
                }}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <span>Download</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
