import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Lucide from './icons.jsx'
import { searchBreadcrumbs } from './content.js'

// §1.7 search dialog. The live site queries /api/search (Orama); the clone searches the scraped
// local index (src/content/docs/_search-index.json, loaded lazily on first open).
const SearchContext = createContext({ open: () => {} })
export const useSearch = () => useContext(SearchContext)

let indexPromise = null
function loadIndex() {
  if (!indexPromise) indexPromise = import('../../content/docs/_search-index.json').then((m) => buildIndex(m.default))
  return indexPromise
}

// Group records per page: page title, headings and the newline-separated text blocks.
function buildIndex(records) {
  const pages = new Map()
  for (const r of records) {
    const url = r.url.split('#')[0]
    if (!pages.has(url)) pages.set(url, { url, title: '', headings: [], lines: [] })
    const p = pages.get(url)
    if (r.type === 'page') p.title = r.content
    else if (r.type === 'heading') p.headings.push({ content: r.content, url: r.url })
    else if (r.type === 'text') p.text = r.content
  }
  for (const p of pages.values()) {
    // Walk the text in document order; lines that equal a heading become heading rows.
    const headingByText = new Map(p.headings.map((h) => [h.content, h]))
    const used = new Set()
    let currentAnchor = p.url
    for (const raw of (p.text || '').split('\n')) {
      const line = raw.trim()
      if (!line) continue
      const h = headingByText.get(line)
      if (h && !used.has(h.url)) {
        used.add(h.url)
        currentAnchor = h.url
        p.lines.push({ type: 'heading', content: h.content, url: h.url })
      } else {
        p.lines.push({ type: 'text', content: line, url: currentAnchor })
      }
    }
    for (const h of p.headings) if (!used.has(h.url)) p.lines.push({ type: 'heading', content: h.content, url: h.url })
  }
  return [...pages.values()]
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function search(index, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  const matches = (s) => {
    const l = s.toLowerCase()
    return terms.every((t) => l.includes(t))
  }
  const out = []
  for (const p of index) {
    const titleHit = matches(p.title)
    const sub = p.lines.filter((l) => matches(l.content))
    if (!titleHit && !sub.length) continue
    const score = (titleHit ? 100 : 0) + sub.filter((s) => s.type === 'heading').length * 10 + sub.length
    out.push({ page: p, sub, score })
  }
  out.sort((a, b) => b.score - a.score)
  const items = []
  for (const r of out) {
    items.push({ id: r.page.url, type: 'page', content: r.page.title, url: r.page.url, breadcrumbs: searchBreadcrumbs(r.page.url) })
    r.sub.forEach((s, i) => items.push({ id: `${s.url}-${s.type}-${i}`, ...s }))
  }
  return items
}

function Highlight({ text, query }) {
  const terms = query.split(/\s+/).filter(Boolean)
  if (!terms.length) return text
  const re = new RegExp(`(${terms.map(escapeRe).join('|')})`, 'gi')
  return text.split(re).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="text-primary underline">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

function SearchDialog({ state, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(null)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [listHeight, setListHeight] = useState(0)
  const isOpen = state === 'open'

  useEffect(() => {
    loadIndex().then(setIndex)
  }, [])
  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const results = useMemo(() => (index && query.trim() ? search(index, query.trim()) : []), [index, query])
  useEffect(() => setSelected(0), [results])

  // Results wrapper animates its height to the content (max 460px), §1.7.
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    const update = () => setListHeight(results.length ? el.offsetHeight : 0)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [results])

  const go = (item) => {
    if (!item) return
    onClose()
    navigate(item.url)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(results.length - 1, s + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(0, s - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(results[selected])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-sm ${isOpen ? 'animate-fd-fade-in' : 'animate-fd-fade-out'}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Search"
        data-state={isOpen ? 'open' : 'closed'}
        onKeyDown={onKeyDown}
        className={`fixed left-1/2 top-4 z-50 w-[calc(100%-1rem)] max-w-[640px] overflow-hidden rounded-xl border border-border bg-background font-prose text-base text-foreground shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] md:top-[calc(50%-250px)] ${
          isOpen ? 'animate-fd-dialog-in' : 'animate-fd-dialog-out'
        }`}
        style={{ transform: 'translateX(-50%)' }}
      >
        <div className={`flex flex-row items-center gap-2 p-3 ${results.length ? 'border-b border-border' : ''}`}>
          <Lucide name="search" className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-0 flex-1 bg-transparent text-base caret-primary placeholder:text-muted-foreground focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 font-mono text-xs font-medium text-muted-foreground transition-colors duration-100 hover:bg-muted hover:text-foreground"
          >
            ESC
          </button>
        </div>
        <div
          data-empty={results.length ? 'false' : 'true'}
          className="overflow-hidden transition-[height] duration-150"
          style={{ height: listHeight }}
        >
          <div ref={listRef} className="flex max-h-[460px] w-full flex-col overflow-y-auto p-1">
            {results.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-selected={i === selected}
                onMouseMove={() => setSelected(i)}
                onClick={() => go(item)}
                className={`relative shrink-0 select-none overflow-hidden rounded-lg px-2.5 py-2 text-start text-sm ${
                  i === selected ? 'bg-muted text-foreground' : ''
                }`}
              >
                {item.type === 'page' ? (
                  <>
                    <div className="inline-flex items-center text-xs text-muted-foreground">
                      {item.breadcrumbs.map((b, j) => (
                        <span key={j} className="inline-flex items-center">
                          {j > 0 && <Lucide name="chevron-right" className="size-4" />}
                          {b}
                        </span>
                      ))}
                    </div>
                    <div className="min-w-0 font-medium">
                      <p className="min-w-0">
                        <Highlight text={item.content} query={query.trim()} />
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div role="none" className="absolute inset-y-0 start-3 w-px bg-border" />
                    {item.type === 'heading' && (
                      <Lucide name="hash" className="absolute start-6 top-2.5 size-4 text-muted-foreground" />
                    )}
                    <div
                      className={`min-w-0 ${item.type === 'heading' ? 'ps-8 font-medium' : 'ps-4 text-foreground/80'}`}
                    >
                      <p className="min-w-0 truncate">
                        <Highlight text={item.content} query={query.trim()} />
                      </p>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export function SearchProvider({ children }) {
  const [state, setState] = useState('closed') // closed | open | closing
  const open = useCallback(() => setState('open'), [])
  const close = useCallback(() => setState((s) => (s === 'open' ? 'closing' : s)), [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setState((s) => (s === 'open' ? 'closing' : 'open'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (state !== 'closing') return
    const t = setTimeout(() => setState('closed'), 300)
    return () => clearTimeout(t)
  }, [state])

  useEffect(() => {
    if (state !== 'open') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [state])

  const value = useMemo(() => ({ open }), [open])
  return (
    <SearchContext.Provider value={value}>
      {children}
      {state !== 'closed' && <SearchDialog key="search" state={state} onClose={close} />}
    </SearchContext.Provider>
  )
}
