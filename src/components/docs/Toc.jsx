import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Lucide from './icons.jsx'

// §1.5 right TOC, Fumadocs "clerk" style. Rails at 8px (depth 2) / 16px (depth 3), connector curves
// where depth changes, an SVG track clipped to the active range and a 4px thumb dot on the same path.
const lineOffset = (depth) => (depth >= 3 ? 16 : 8)
const itemPadding = (depth) => (depth >= 3 ? 32 : 20)

// Scroll-spy: every heading fully inside the viewport is active; if none are, keep the last set.
function useActiveAnchors(ids) {
  const [active, setActive] = useState(() => (ids.length ? [ids[0]] : []))
  useEffect(() => {
    setActive(ids.length ? [ids[0]] : [])
    if (!ids.length) return
    let raf = 0
    const compute = () => {
      raf = 0
      const vh = window.innerHeight
      const visible = []
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        const r = el.getBoundingClientRect()
        const h = r.height || 1
        const shown = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0))
        if (shown / h >= 0.98) visible.push(id)
      }
      if (visible.length) setActive((prev) => (prev.join() === visible.join() ? prev : visible))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute)
    }
    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ids])
  return active
}

export default function Toc({ items }) {
  const ids = useMemo(() => items.map((i) => i.url.slice(1)), [items])
  const active = useActiveAnchors(ids)
  const listRef = useRef(null)
  const [geo, setGeo] = useState(null)

  // Build the track path from the rendered item boxes (offsetTop + padding), as fumadocs does.
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list || !items.length) return
    const measure = () => {
      const anchors = [...list.querySelectorAll('a[data-toc-item]')]
      let d = ''
      let w = 0
      let h = 0
      const boxes = []
      let prev = null
      anchors.forEach((el, i) => {
        const cs = getComputedStyle(el)
        const x = lineOffset(items[i].depth) + 0.5
        const top = el.offsetTop + parseFloat(cs.paddingTop)
        const bottom = el.offsetTop + el.clientHeight - parseFloat(cs.paddingBottom)
        w = Math.max(w, x + 8)
        h = Math.max(h, bottom)
        if (i === 0) d += ` M${x} ${top} L${x} ${bottom}`
        else d += ` C ${prev.x} ${top - 4} ${x} ${top - 8} ${x} ${top} L${x} ${bottom}`
        boxes.push({ top, bottom, d: d.trim() })
        prev = { x, bottom }
      })
      setGeo({ d: d.trim(), w, h, boxes })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [items])

  const track = useMemo(() => {
    if (!geo || !active.length) return null
    const idx = active.map((id) => ids.indexOf(id)).filter((i) => i >= 0)
    if (!idx.length) return null
    const first = Math.min(...idx)
    const last = Math.max(...idx)
    const svgNS = 'http://www.w3.org/2000/svg'
    const p = document.createElementNS(svgNS, 'path')
    p.setAttribute('d', geo.boxes[last].d)
    let dist = 0
    try {
      dist = p.getTotalLength()
    } catch {
      dist = geo.boxes[last].bottom
    }
    return { top: geo.boxes[first].top, bottom: geo.boxes[last].bottom, dist }
  }, [geo, active, ids])

  // Keep the active item visible inside the TOC viewport.
  const viewportRef = useRef(null)
  useEffect(() => {
    const vp = viewportRef.current
    const el = vp?.querySelector('a[data-active="true"]')
    if (!vp || !el) return
    const vr = vp.getBoundingClientRect()
    const er = el.getBoundingClientRect()
    if (er.top < vr.top || er.bottom > vr.bottom) vp.scrollTop += er.top - vr.top - vr.height / 2
  }, [active])

  return (
    <div
      id="nd-toc"
      className="docs-toc-wrap flex w-[268px] flex-col pb-2 pe-4 pt-4 max-xl:hidden"
    >
      {items.length > 0 && (
        <>
          <h3 id="toc-title" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lucide name="text-align-start" className="size-4" />
            On this page
          </h3>
          <div
            ref={viewportRef}
            className="docs-scroll-fade-16 docs-no-scrollbar relative ms-px min-h-0 overflow-auto py-3 text-sm"
          >
            <div className="relative" ref={listRef}>
              {geo && (
                <div
                  className="absolute start-0 top-0"
                  style={{
                    width: geo.w,
                    height: geo.h,
                    '--track-top': `${track ? track.top : 0}px`,
                    '--track-bottom': `${track ? track.bottom : 0}px`,
                    '--offset-distance': `${track ? track.dist : 0}px`,
                    '--opacity': track ? 1 : 0,
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox={`0 0 ${geo.w} ${geo.h}`}
                    className="absolute transition-[clip-path] duration-150"
                    style={{
                      width: geo.w,
                      height: geo.h,
                      clipPath:
                        'polygon(0 var(--track-top,0), 100% var(--track-top,0), 100% var(--track-bottom,0), 0 var(--track-bottom,0))',
                    }}
                  >
                    <path d={geo.d} className="stroke-primary" strokeWidth="1" fill="none" />
                  </svg>
                  <div
                    className="absolute size-1 rounded-full bg-primary"
                    style={{
                      offsetPath: `path("${geo.d}")`,
                      offsetDistance: 'var(--offset-distance, 0)',
                      opacity: 'var(--opacity, 0)',
                      transition:
                        'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1), offset-distance 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              )}
              <div className="flex flex-col">
                {items.map((item, i) => {
                  const offset = lineOffset(item.depth)
                  const upper = i > 0 ? lineOffset(items[i - 1].depth) : offset
                  const lower = i < items.length - 1 ? lineOffset(items[i + 1].depth) : offset
                  const isActive = active.includes(ids[i])
                  return (
                    <a
                      key={item.url}
                      href={item.url}
                      data-toc-item=""
                      data-active={isActive ? 'true' : 'false'}
                      onClick={(e) => {
                        e.preventDefault()
                        const el = document.getElementById(ids[i])
                        if (el) {
                          el.scrollIntoView()
                          history.replaceState(history.state, '', item.url)
                        }
                      }}
                      className={`relative py-1.5 font-prose text-sm text-muted-foreground transition-colors [overflow-wrap:anywhere] first:pt-0 last:pb-0 hover:text-foreground data-[active=true]:text-primary`}
                      style={{ paddingInlineStart: itemPadding(item.depth) }}
                    >
                      {offset !== upper && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="8 0 8 12"
                          className="absolute -top-1.5 -z-[1]"
                          style={{ width: 9, height: 12, insetInlineStart: 8 }}
                        >
                          <path
                            d={offset > upper ? 'M 8 0 C 8 8 16 4 16 12' : 'M 16 0 C 16 8 8 4 8 12'}
                            stroke="rgba(44,40,38,0.1)"
                            strokeWidth="1"
                            fill="none"
                          />
                        </svg>
                      )}
                      <div
                        className={`absolute w-px bg-foreground/10 ${offset !== upper ? 'top-1.5' : 'top-0'} ${
                          offset !== lower ? 'bottom-1.5' : 'bottom-0'
                        }`}
                        style={{ insetInlineStart: offset }}
                      />
                      {item.title}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
