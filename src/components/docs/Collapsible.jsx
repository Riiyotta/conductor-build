import { useLayoutEffect, useRef, useState } from 'react'

// Radix Collapsible/Accordion content equivalent: children are unmounted while closed, and toggling
// plays the fumadocs height keyframes (fd-collapsible-* 150ms cubic-bezier(.45,0,.55,1),
// fd-accordion-* 200ms ease-out). The initial render never animates (matches `animation-name: none`
// on first paint of the original).
export default function Collapsible({
  open,
  children,
  className = '',
  duration = 150,
  easing = 'cubic-bezier(0.45, 0, 0.55, 1)',
  closedOpacity = 0,
  id,
}) {
  const ref = useRef(null)
  const [mounted, setMounted] = useState(open)
  const anim = useRef(null)
  const pending = useRef(null) // 'open' | 'close' – set only by user toggles, never on first render
  const prevOpen = useRef(open)

  useLayoutEffect(() => {
    if (prevOpen.current === open) return
    prevOpen.current = open
    pending.current = open ? 'open' : 'close'
    if (open) setMounted(true)
  }, [open])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !pending.current) return
    const dir = pending.current
    pending.current = null
    anim.current?.cancel()
    const h = el.scrollHeight
    if (dir === 'open') {
      anim.current = el.animate(
        [
          { height: '0px', opacity: closedOpacity },
          { height: `${h}px`, opacity: 1 },
        ],
        { duration, easing },
      )
    } else {
      const a = el.animate(
        [
          { height: `${h}px`, opacity: 1 },
          { height: '0px', opacity: closedOpacity },
        ],
        { duration, easing, fill: 'forwards' },
      )
      anim.current = a
      a.onfinish = () => setMounted(false)
    }
  })

  if (!mounted) return null
  return (
    <div ref={ref} id={id} data-state={open ? 'open' : 'closed'} className={className}>
      {children}
    </div>
  )
}
