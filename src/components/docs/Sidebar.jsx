import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Lucide from './icons.jsx'
import Collapsible from './Collapsible.jsx'
import { ROOTS, folderContains } from './content.js'
import { useSearch } from './Search.jsx'

const ITEM =
  'docs-side-item relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-muted-foreground [overflow-wrap:anywhere] [&_svg]:size-4 [&_svg]:shrink-0 w-full'

// ---------- tree (§1.3) ----------
function PageItem({ node, depth, activeUrl, onNavigate }) {
  const active = node.url === activeUrl
  return (
    <Link
      to={node.url}
      data-active={active ? 'true' : 'false'}
      data-nested={depth > 0 ? 'true' : 'false'}
      className={ITEM}
      style={{ paddingInlineStart: depth > 0 ? 20 : 8 }}
      onClick={onNavigate}
    >
      {node.name}
    </Link>
  )
}

function FolderItem({ node, depth, activeUrl, onNavigate }) {
  const containsActive = folderContains(node, activeUrl)
  const [open, setOpen] = useState(containsActive || node.defaultOpen === true)
  useEffect(() => {
    if (containsActive) setOpen(true)
  }, [containsActive])

  const chevron = (
    <Lucide
      name="chevron-down"
      data-icon=""
      className={`ms-auto transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
    />
  )
  const style = { paddingInlineStart: depth > 0 ? 20 : 8 }

  return (
    <div data-state={open ? 'open' : 'closed'}>
      {node.index ? (
        <Link
          to={node.index.url}
          data-active={node.index.url === activeUrl ? 'true' : 'false'}
          data-nested={depth > 0 ? 'true' : 'false'}
          className={ITEM}
          style={style}
          onClick={(e) => {
            if (e.target instanceof Element && e.target.closest('[data-icon]')) {
              e.preventDefault()
              setOpen((v) => !v)
            } else {
              setOpen(true)
              onNavigate?.()
            }
          }}
        >
          {node.name}
          {chevron}
        </Link>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          data-state={open ? 'open' : 'closed'}
          className={ITEM}
          style={style}
          onClick={() => setOpen((v) => !v)}
        >
          {node.name}
          {chevron}
        </button>
      )}
      <Collapsible open={open} className="docs-folder-content">
        <div className="flex flex-col gap-0.5 pt-0.5">
          <TreeNodes nodes={node.children} depth={depth + 1} activeUrl={activeUrl} onNavigate={onNavigate} />
        </div>
      </Collapsible>
    </div>
  )
}

function TreeNodes({ nodes, depth, activeUrl, onNavigate }) {
  return nodes.map((node, i) => {
    if (node.type === 'separator')
      return (
        <p
          key={`sep-${i}`}
          className={`mb-1 inline-flex items-center gap-2 px-2 text-sm text-foreground ${i === 0 ? 'mt-0' : 'mt-6'}`}
        >
          {node.name}
        </p>
      )
    if (node.type === 'folder')
      return <FolderItem key={`f-${node.name}-${i}`} node={node} depth={depth} activeUrl={activeUrl} onNavigate={onNavigate} />
    return <PageItem key={`p-${node.url}-${i}`} node={node} depth={depth} activeUrl={activeUrl} onNavigate={onNavigate} />
  })
}

// Scrollable tree viewport (Radix ScrollArea: hidden scrollbar, 12px edge fades). The active link is
// brought into view on mount (centred when it is outside the viewport).
export function SidebarTree({ root, activeUrl, onNavigate }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const vp = ref.current
    const active = vp?.querySelector('[data-active="true"]')
    if (!vp || !active) return
    const vr = vp.getBoundingClientRect()
    const ar = active.getBoundingClientRect()
    if (ar.top < vr.top || ar.bottom > vr.bottom) {
      vp.scrollTop += ar.top - vr.top - (vr.height - ar.height) / 2
    }
  }, [activeUrl])

  // Fallback-only pages (§1.3): both roots shown as collapsed top-level folders.
  const nodes = root ? root.children : ROOTS.map((r) => ({ ...r, root: undefined }))
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div
        ref={ref}
        className="docs-scroll-fade-12 docs-no-scrollbar size-full overflow-y-auto overscroll-contain p-4"
      >
        <div className="flex flex-col gap-0.5">
          <TreeNodes nodes={nodes} depth={0} activeUrl={activeUrl} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  )
}

// ---------- search button (§1.3 item 2) ----------
export function SidebarSearchButton() {
  const { open } = useSearch()
  return (
    <button
      type="button"
      data-search-full=""
      onClick={open}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-1.5 ps-2 font-prose text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Lucide name="search" className="size-4" />
      Search
      <div className="ms-auto inline-flex gap-0.5">
        <kbd className="rounded-md border border-border bg-background px-1.5 font-mono">⌘</kbd>
        <kbd className="rounded-md border border-border bg-background px-1.5 font-mono">K</kbd>
      </div>
    </button>
  )
}

// ---------- root switcher (§1.3 item 3) ----------
export function RootSwitcher({ root, mobile = false }) {
  const [state, setState] = useState('closed') // closed | open | closing
  const triggerRef = useRef(null)
  const popRef = useRef(null)
  const [pos, setPos] = useState(null)
  const navigate = useNavigate()
  const isOpen = state === 'open'

  const close = () => setState((s) => (s === 'open' ? 'closing' : s))

  useLayoutEffect(() => {
    if (state === 'closed') return
    const r = triggerRef.current.getBoundingClientRect()
    const width = Math.max(240, r.width)
    setPos({ left: r.left + r.width / 2 - width / 2, top: r.bottom + 4, width })
  }, [state])

  useEffect(() => {
    if (!isOpen) return
    const onDown = (e) => {
      if (popRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return
      close()
    }
    const onKey = (e) => e.key === 'Escape' && close()
    const onScroll = () => close()
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onScroll)
    }
  }, [isOpen])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        data-state={isOpen ? 'open' : 'closed'}
        onClick={() => setState((s) => (s === 'open' ? 'closing' : 'open'))}
        className={`flex items-center gap-2 rounded-lg border border-border p-2 text-start font-prose text-foreground transition-colors hover:bg-muted ${
          isOpen ? 'bg-muted' : 'bg-muted/50'
        }`}
      >
        <div>
          <p className="text-sm font-medium">{root.name}</p>
          {mobile && <p className="text-sm text-muted-foreground">{root.description}</p>}
        </div>
        <Lucide name="chevrons-up-down" className="ms-auto size-4 shrink-0 text-muted-foreground" />
      </button>
      {state !== 'closed' && pos && (
        <div style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 50, minWidth: pos.width }}>
          <div
            ref={popRef}
            role="dialog"
            data-side="bottom"
            data-state={isOpen ? 'open' : 'closed'}
            onAnimationEnd={() => state === 'closing' && setState('closed')}
            style={{ width: pos.width, transformOrigin: 'center top' }}
            className={`flex max-w-[98vw] flex-col gap-1 overflow-y-auto rounded-xl border border-border bg-background/60 p-1 font-prose text-sm text-foreground shadow-lg backdrop-blur-lg focus-visible:outline-none ${
              isOpen ? 'animate-fd-popover-in' : 'animate-fd-popover-out'
            }`}
          >
            {ROOTS.map((r) => {
              const current = r.name === root.name
              return (
                <Link
                  key={r.name}
                  to={r.index.url}
                  onClick={(e) => {
                    e.preventDefault()
                    close()
                    navigate(r.index.url)
                  }}
                  className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted hover:text-foreground"
                >
                  <div>
                    <p className="text-sm font-medium leading-none">{r.name}</p>
                    <p className="mt-1 text-[0.8125rem] text-muted-foreground">{r.description}</p>
                  </div>
                  <Lucide
                    name="check"
                    className={`ms-auto size-3.5 shrink-0 text-primary ${current ? '' : 'invisible'}`}
                  />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

// ---------- desktop sidebar (§1.3) ----------
export default function DocsSidebar({ root, activeUrl }) {
  return (
    <div className="docs-sidebar-wrap pointer-events-none z-20 max-md:hidden [&>*]:pointer-events-auto">
      <aside
        id="nd-sidebar"
        className="absolute inset-y-0 start-0 flex w-full flex-col items-end bg-background text-sm text-foreground [&>*]:w-[268px]"
      >
        <div className="flex flex-col gap-3 p-4 pb-2">
          <SidebarSearchButton />
          {root && <RootSwitcher root={root} />}
        </div>
        <SidebarTree root={root} activeUrl={activeUrl} />
      </aside>
    </div>
  )
}
