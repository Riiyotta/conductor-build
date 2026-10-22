import { useEffect, useRef, useState } from 'react'

// §3 "Trusted by" logo strip + M5 counter
const SPOTIFY_GREEN_FILTER =
  'brightness(0) saturate(100%) invert(58%) sepia(95%) saturate(1063%) hue-rotate(87deg) brightness(92%) contrast(86%)'

function useCounter(ref) {
  const [n, setN] = useState(100)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    let raf
    let first = true
    const io = new IntersectionObserver(
      ([entry]) => {
        // Already in view on the first callback: keep "100k+", do nothing.
        if (first) {
          first = false
          if (entry?.isIntersecting) {
            io.disconnect()
            return
          }
        }
        if (!entry?.isIntersecting) return
        io.disconnect()
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setN(100)
          return
        }
        let start
        const step = (t) => {
          start ??= t
          const p = Math.min((t - start) / 1400, 1)
          setN(Math.round(100 * (1 - (1 - p) ** 3)))
          if (p < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      if (raf !== undefined) cancelAnimationFrame(raf)
    }
  }, [ref])
  return n
}

const Cell = ({ children }) => (
  <div className="flex h-8 items-center justify-center sm:h-10">{children}</div>
)

export default function Logos() {
  const ref = useRef(null)
  const n = useCounter(ref)

  return (
    <section ref={ref} className="px-4 pb-16 pt-6">
      <p className="mb-6 w-full text-center text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        <span className="sr-only">Trusted by 100k+ builders</span>
        <span aria-hidden="true">
          Trusted by <span className="tabular-nums">{n === 0 ? '0' : `${n}k+`}</span> builders
        </span>
      </p>
      <div className="mx-auto grid max-w-2xl grid-cols-4 gap-4 sm:gap-6">
        <Cell>
          <img src="/assets/img/logos/linear.svg" alt="Linear" width="96" height="24" className="h-4 w-auto sm:h-6" />
        </Cell>
        <Cell>
          <img src="/assets/img/logos/vercel-light.svg" alt="Vercel" width="100" height="24" className="h-3.5 w-auto sm:h-5" />
        </Cell>
        <Cell>
          <img src="/assets/img/logos/notion-wordmark.svg" alt="Notion" width="120" height="28" className="h-5 w-auto sm:h-8" />
        </Cell>
        <Cell>
          <img src="/assets/img/logos/ramp-wordmark.svg" alt="Ramp" width="90" height="24" className="h-5 w-auto sm:h-6" />
        </Cell>
        <Cell>
          <img
            src="/assets/img/logos/yc-wordmark-orange.png"
            alt="Y Combinator"
            width="3208"
            height="640"
            className="h-auto w-full max-w-28 mix-blend-multiply sm:max-w-36"
          />
        </Cell>
        <Cell>
          <img src="/assets/img/logos/square-wordmark.svg" alt="Square" width="96" height="24" className="h-4 w-auto sm:h-6" />
        </Cell>
        <Cell>
          <span className="flex items-center gap-1.5">
            <img src="/assets/img/logos/posthog-logomark.svg" alt="" width="52" height="28" className="h-5 w-auto sm:h-6" />
            <img src="/assets/img/logos/posthog-wordmark.svg" alt="PostHog" width="97" height="24" className="h-3.5 w-auto sm:h-4" />
          </span>
        </Cell>
        <Cell>
          <img
            src="/assets/img/logos/spotify-wordmark.png"
            alt="Spotify"
            width="89"
            height="24"
            // Original serves this via next/image at w=96 (96x26), so its rendered ratio is 96/26, not the PNG's.
            className="aspect-[96/26] h-4 w-auto sm:h-6"
            style={{ filter: SPOTIFY_GREEN_FILTER }}
          />
        </Cell>
      </div>
    </section>
  )
}
