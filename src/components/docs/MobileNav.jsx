import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { useDownloadDialog } from '../DownloadDialog.jsx'
import Lucide from './icons.jsx'
import { useSearch } from './Search.jsx'
import { RootSwitcher, SidebarTree } from './Sidebar.jsx'

const SITE_LINKS = [
  { label: 'Changelog', href: '/changelog' },
  { label: 'Docs', href: '/docs' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Enterprise', href: '/enterprise' },
  { label: 'Join Us', href: '/join-us' },
  { label: 'Sign in', href: 'https://app.conductor.build' },
]

const ICON_BTN =
  'inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors duration-100 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&_svg]:size-[18px]'

// §1.2 <768 top bar (header#nd-subnav)
export function MobileSubnav({ onOpenSidebar }) {
  const { open } = useSearch()
  return (
    <header
      id="nd-subnav"
      className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/80 pe-2.5 ps-4 backdrop-blur-sm transition-colors md:hidden"
      style={{ gridArea: 'header' }}
    >
      <Link to="/" className="inline-flex items-center gap-2.5 font-semibold">
        <Icon name="logomark" className="aspect-[115/174] h-5" />
        <span>Conductor</span>
      </Link>
      <div className="flex-1" />
      <button type="button" data-search="" aria-label="Open Search" className={ICON_BTN} onClick={open}>
        <Lucide name="search" />
      </button>
      <button type="button" aria-label="Open Sidebar" className={ICON_BTN} onClick={onOpenSidebar}>
        <Lucide name="panel-left" />
      </button>
    </header>
  )
}

// §1.6 drawer (aside#nd-sidebar-mobile), slides in from the right.
export function MobileDrawer({ state, onClose, root, activeUrl }) {
  const { open: openDownload } = useDownloadDialog()
  const [visible, setVisible] = useState(state === 'open')
  useEffect(() => {
    if (state === 'open') setVisible(true)
  }, [state])

  if (!visible) return null
  const isOpen = state === 'open'
  return (
    <>
      <div
        className={`fixed inset-0 z-40 backdrop-blur-sm md:hidden ${isOpen ? 'animate-fd-fade-in' : 'animate-fd-fade-out'}`}
        onClick={onClose}
      />
      <aside
        id="nd-sidebar-mobile"
        data-state={isOpen ? 'open' : 'closed'}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && !isOpen) setVisible(false)
        }}
        className={`fixed inset-y-0 end-0 z-40 flex w-[85%] max-w-[380px] flex-col border-s border-border bg-background text-[0.9375rem] shadow-lg md:hidden ${
          isOpen ? 'animate-fd-sidebar-in' : 'animate-fd-sidebar-out'
        }`}
      >
        <div className="flex flex-col gap-3 p-4 pb-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <div className="flex flex-1" />
            <button type="button" aria-label="Open Sidebar" className={ICON_BTN} onClick={onClose}>
              <Lucide name="panel-left" />
            </button>
          </div>
          {root && <RootSwitcher root={root} mobile />}
          <nav aria-label="Site" className="flex flex-col gap-1 border-b border-border pb-3">
            {SITE_LINKS.map((l) => {
              const current = l.href === '/docs'
              const cls = `rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${
                current ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
              return l.href.startsWith('/') ? (
                <Link key={l.href} to={l.href} aria-current={current ? 'page' : undefined} className={cls}>
                  {l.label}
                </Link>
              ) : (
                <a key={l.href} href={l.href} className={cls}>
                  {l.label}
                </a>
              )
            })}
            <button
              type="button"
              onClick={() => {
                onClose()
                openDownload()
              }}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <span>Download</span>
            </button>
          </nav>
        </div>
        <SidebarTree root={root} activeUrl={activeUrl} />
      </aside>
    </>
  )
}
