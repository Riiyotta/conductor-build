import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { LATEST_VERSION } from './Changelog.jsx'

// §11b Download dialog (original: Base UI Dialog). Opened by header "Download",
// the "macOS" button and "Download now".
// Verified live (pixel-audit): the primary button navigates to APPLE_SILICON_URL
// (302 -> crabnebula asset, Conductor_<ver>_aarch64.dmg), closes the dialog and shows
// the full-screen DownloadingScreen. The Intel link also shows that screen.
const APPLE_SILICON_URL = 'https://cdn.crabnebula.app/download/melty/conductor/latest/platform/dmg-aarch64'
const INTEL_URL = 'https://cdn.crabnebula.app/download/melty/conductor/latest/platform/dmg-x86_64'

const DownloadDialogContext = createContext({ open: () => {} })
export const useDownloadDialog = () => useContext(DownloadDialogContext)

// M12 (measured live + shipped source): the original renders `{state === 'open' && <DownloadDialogContent/>}`
// with Base UI `<Dialog.Root open>`. Because the Root mounts already open, Base UI never applies
// `data-starting-style`, and closing sets state 'closed' which unmounts it in the same commit, so
// `data-ending-style` never applies either. Net effect: the dialog appears and disappears instantly
// (sampled every frame: opacity 1 on the first frame, gone on the next frame after close). The
// opacity/scale 200ms transition declarations are kept for computed-style parity only.
//
// First-reveal latency (measured live, shipped source): DownloadDialogContent and DownloadingScreen are
// separate `next/dynamic` (React.lazy + Suspense, ssr:false) wrappers over one lazy chunk. The chunk
// fetch finishes in ~60-80ms, but React 19 (19.3 canary) throttles the Suspense reveal to 300ms after the
// fallback commit (FALLBACK_THROTTLE_MS), so the first dialog open mounts ~310ms after the click and the
// first DownloadingScreen ~310ms after "Download for Mac" (the dialog is gone on the next frame, leaving
// an empty gap). Once a lazy wrapper has resolved, later opens in the same page load are instant
// (~10-16ms). React 18 here does not throttle reveals, so this is replicated with a one-time timer per
// component per page load.
const FIRST_REVEAL_DELAY = 300
const revealed = new Set()
function FirstRevealDelay({ id, children }) {
  const [ready, setReady] = useState(() => revealed.has(id))
  useEffect(() => {
    if (ready) return
    const t = setTimeout(() => {
      revealed.add(id)
      setReady(true)
    }, FIRST_REVEAL_DELAY)
    return () => clearTimeout(t)
  }, [id, ready])
  return ready ? children : null
}

export function DownloadDialogProvider({ children }) {
  const [state, setState] = useState('closed') // 'closed' | 'open' | 'downloading'
  const stateRef = useRef(state)
  stateRef.current = state
  const returnFocusRef = useRef(null)

  const open = useCallback(() => {
    if (stateRef.current !== 'closed') return
    returnFocusRef.current = document.activeElement
    setState('open')
  }, [])

  const close = useCallback(() => {
    const wasOpen = stateRef.current === 'open'
    setState('closed')
    if (wasOpen) returnFocusRef.current?.focus?.()
  }, [])

  // Original: onDownload swaps the dialog for the DownloadingScreen in one state change.
  const onDownload = useCallback(() => setState('downloading'), [])

  return (
    <DownloadDialogContext.Provider value={{ open, close }}>
      {children}
      {state === 'open' && (
        <FirstRevealDelay id="dialog">
          <DownloadDialog onClose={close} onDownload={onDownload} />
        </FirstRevealDelay>
      )}
      {state === 'downloading' && (
        <FirstRevealDelay id="downloading">
          <DownloadingScreen version={LATEST_VERSION} onClose={close} />
        </FirstRevealDelay>
      )}
    </DownloadDialogContext.Provider>
  )
}

function DownloadDialog({ onClose, onDownload }) {
  const popupRef = useRef(null)
  const primaryRef = useRef(null)

  const startDownload = useCallback(() => {
    onDownload()
    window.location.href = APPLE_SILICON_URL
  }, [onDownload])

  // Original: a window-level Enter (not on a link/button) triggers the Apple-silicon download.
  useEffect(() => {
    const onEnter = (e) => {
      if (e.key !== 'Enter') return
      if (e.target instanceof HTMLElement && e.target.closest('a,button')) return
      startDownload()
    }
    window.addEventListener('keydown', onEnter)
    return () => window.removeEventListener('keydown', onEnter)
  }, [startDownload])

  useEffect(() => {
    // Original focuses the primary download button on open (it is [active] in the a11y snapshot).
    primaryRef.current?.focus()
    // Modal scroll lock: measured on the original as inline `overflow: hidden` on <body>.
    const body = document.body
    const prev = body.style.overflow
    body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && popupRef.current) {
        const f = popupRef.current.querySelectorAll('a[href], button')
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={popupRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-dialog-title"
        aria-describedby="download-dialog-desc"
        className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 font-sans text-foreground shadow-lg outline-none transition-[opacity,scale] duration-200"
      >
        <div className="mb-4 flex flex-col gap-1.5 pr-8">
          <h2 id="download-dialog-title" className="text-base font-semibold text-foreground">
            Download Conductor
          </h2>
          <p id="download-dialog-desc" className="text-sm text-muted-foreground">
            Choose the build for your Mac.
          </p>
        </div>

        {/* Measured: py-6 (48px tall), one flex row gap-2 holding logo + both labels (8px gaps). */}
        <button
          ref={primaryRef}
          type="button"
          onClick={startDownload}
          className="mb-4 inline-flex h-12 w-full cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-md bg-foreground px-3 py-6 text-sm font-medium text-background hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2"
        >
          <span className="flex items-center gap-2">
            <Icon name="apple" className="size-5" />
            <span>Download for Mac</span>
            <span className="text-sm opacity-70">Apple silicon</span>
          </span>
          <kbd
            aria-label="Enter"
            className="inline-flex size-6 items-center justify-center rounded-md border border-white/20 bg-background/20 font-mono text-xs font-medium"
          >
            <Icon name="corner-down-left" className="size-3.5" />
          </kbd>
        </button>

        <a
          href="https://docs.google.com/forms/d/1jPQsC8oLNIyjHW3WOsUxK2XNm0Z-BAzdooZuMs9cbFM/edit"
          target="_blank"
          rel="noreferrer"
          className="mb-6 inline-flex h-[50px] w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-border bg-background/50 px-3 py-6 text-sm font-medium backdrop-blur-md hover:bg-muted hover:text-foreground"
        >
          <span>Join Windows/Linux waitlist</span>
          <Icon name="arrow-right" className="size-4" />
        </a>

        <div className="text-sm text-muted-foreground">
          <span>Mac older than November 2020? </span>
          <a href={INTEL_URL} onClick={onDownload} className="text-foreground hover:underline">
            Download for Intel-based Macs
          </a>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon name="x" className="size-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </>
  )
}

// Post-download full-screen "terminal" (original DownloadingScreen, not in CLONE_SPEC; captured
// live + from the shipped chunk). Typewriter: 4-10ms per char, 25ms between lines, cursor blinks
// every 530ms. Click or any key closes; [1] docs, [2] Discord, [3] X open in a new tab.
// The logo slot renders 0px wide in the original (w-full inside a shrink-wrapped flex item), so it
// is invisible there too and only contributes its 80px + 16px of height.
const TERMINAL_RULE = '═'.repeat(62)

function DownloadingScreen({ version, onClose }) {
  const lines = useMemo(
    () => [
      '',
      `CONDUCTOR v${version}`,
      'Copyright (c) 2026 Melty Labs, Inc.',
      '',
      'Downloading conductor.dmg...',
      '',
      'DOWNLOAD STARTED',
      '',
      'Congrats! Your download should begin shortly.',
      '',
      'Press [1] docs, [2] Discord, [3] Twitter, any key to close.',
    ],
    [version],
  )
  const [typed, setTyped] = useState([])
  const [line, setLine] = useState(0)
  const [col, setCol] = useState(0)
  const [cursorOn, setCursorOn] = useState(true)

  useEffect(() => {
    if (line >= lines.length) return
    const text = lines[line]
    if (col < text.length) {
      const t = setTimeout(() => {
        setTyped((prev) => {
          const next = [...prev]
          next[line] = (next[line] || '') + text[col]
          return next
        })
        setCol((c) => c + 1)
      }, 4 + 6 * Math.random())
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setLine((l) => l + 1)
      setCol(0)
      setTyped((prev) => [...prev, ''])
    }, 25)
    return () => clearTimeout(t)
  }, [line, col, lines])

  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 530)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '1') window.open('/docs', '_blank')
      else if (e.key === '2') window.open('https://discord.gg/RSrYmstWzy', '_blank')
      else if (e.key === '3') window.open('https://x.com/conductor_build', '_blank')
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const done = line >= lines.length
  const cursor = <span className={cursorOn ? 'opacity-100' : 'opacity-0'}>{'█'}</span>

  return (
    <div className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black" onClick={onClose}>
      <div className="terminal-scanlines pointer-events-none fixed inset-0 z-10" />
      <div className="flex flex-col items-center p-8 font-mono text-sm sm:text-base">
        <div className="mb-4 h-20">
          <Icon
            src="/assets/img/animations/conductor-logo.webp"
            className="h-full w-full text-white"
            style={{ WebkitMaskPosition: 'left center', maskPosition: 'left center' }}
          />
        </div>
        <div className="text-white">
          <div>{`╔${TERMINAL_RULE}╗`}</div>
          <div style={{ height: `${1.5 * lines.length}em` }}>
            {typed.map((t, i) => (
              <div key={i} className="h-[1.5em]">
                {t}
                {i === line && !done && cursor}
              </div>
            ))}
            {done && cursor}
          </div>
          <div>{`╚${TERMINAL_RULE}╝`}</div>
        </div>
      </div>
    </div>
  )
}
