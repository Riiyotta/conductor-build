import { useEffect, useRef, useState } from 'react'
import FeatureShell from './FeatureShell.jsx'
import ArrowLink from './ArrowLink.jsx'
import Icon from './Icon.jsx'
import { useInterval, usePrefersReducedMotion } from '../lib/hooks.js'

// §5 "A cloud sandbox for every agent." + M7 / M8

// ---- Cloud loader (M8) ----
const SHIMMER_MS = (1000 / 60) * 55 // 916.667ms
const DOTS = [
  [50, 10, 3.6], [70, 10, 5.4], [30, 30, 3.78], [50, 30, 5.58], [70, 30, 7.38], [90, 30, 9.18],
  [10, 50, 3.96], [30, 50, 5.76], [50, 50, 7.56], [70, 50, 9.36], [90, 50, 11.16], [110, 50, 12.96],
  [30, 70, 7.74], [50, 70, 9.54], [70, 70, 11.34], [90, 70, 13.14], [110, 70, 14.94], [130, 70, 16.74],
]

function CloudLoader({ state, size }) {
  const loading = state === 'loading'
  const live = state === 'live'
  // Phase-align every loader to wall-clock time (set after mount, like the original).
  const [offset, setOffset] = useState('0ms')
  useEffect(() => {
    setOffset(`-${Date.now() % (loading ? SHIMMER_MS : 1)}ms`)
  }, [loading])

  const baseFill = live ? 'fill-positive' : 'fill-muted-foreground'
  const baseOpacity = loading ? 0.26 : state === 'done' ? 0.72 : 1

  return (
    <span
      aria-hidden="true"
      data-state={state}
      className="cloud-loader relative inline-block shrink-0 overflow-visible"
      style={{ width: size, height: size * (80 / 140) }}
    >
      <svg viewBox="0 0 140 80" className="h-full w-full overflow-visible" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {DOTS.map(([x, y]) => (
          <circle key={`b-${x}-${y}`} className={`cloud-loader-dot ${baseFill}`} cx={x} cy={y} r={7.2} style={{ opacity: baseOpacity }} />
        ))}
        {loading &&
          DOTS.map(([x, y, d]) => (
            <circle
              key={`a-${x}-${y}`}
              className="cloud-loader-dot cloud-loader-dot-loading fill-foreground"
              cx={x}
              cy={y}
              r={7.2}
              style={{ animationDelay: `calc(${offset} + ${d * (1000 / 60)}ms)` }}
            />
          ))}
      </svg>
    </span>
  )
}

// ---- Demo state machine (M7) ----
const STAGES = [
  { label: 'Building snapshot', cloudState: 'loading', logs: ['booting Firecracker microVM', 'restoring repository snapshot'] },
  {
    label: 'Preparing workspace',
    cloudState: 'loading',
    logs: ['booting Firecracker microVM', 'restoring repository snapshot', 'fetching latest from origin/main', 'initializing Claude Code'],
  },
  {
    label: 'Done',
    cloudState: 'live',
    logs: ['booting Firecracker microVM', 'restoring repository snapshot', 'fetching latest from origin/main', 'initializing Claude Code', 'sandbox ready'],
  },
]
const PHASE_MS = [350, 1400, 250, 900, 900, 2800]
const LAST = PHASE_MS.length - 1

function SandboxDemo() {
  const ref = useRef(null)
  const timerRef = useRef(null)
  const startRef = useRef(undefined)
  const [phase, setPhase] = useState(0)
  const [visible, setVisible] = useState(false)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        const isIn = entry?.isIntersecting === true
        setVisible(isIn)
        startRef.current = undefined
        if (!isIn) setPhase(0)
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useInterval(
    () => {
      const next = (phase + 1) % PHASE_MS.length
      if (next === 2) startRef.current = performance.now()
      else if (next === 0) {
        startRef.current = undefined
        if (timerRef.current) timerRef.current.textContent = '0ms'
      }
      setPhase(next)
    },
    visible && !reduced ? PHASE_MS[phase] : null,
  )

  // Elapsed timer: every 50ms while phases 2–4 run; frozen at "Done".
  useInterval(
    () => {
      if (timerRef.current && startRef.current !== undefined) {
        timerRef.current.textContent = `${Math.round(performance.now() - startRef.current)}ms`
      }
    },
    visible && !reduced && phase >= 2 && phase < LAST ? 50 : null,
  )

  const h = reduced ? LAST : phase
  const stage = STAGES[Math.max(0, h - 3)]
  const shortcut = h === 1
  const revealed = h >= 2

  return (
    <div
      ref={ref}
      data-sandbox-step={revealed ? stage.label : shortcut ? 'shortcut' : 'empty'}
      className="relative aspect-video overflow-hidden rounded-xl border border-border bg-background"
    >
      <div aria-hidden="true" className="flex size-full overflow-hidden bg-background">
        <aside className="flex w-36 shrink-0 flex-col border-r border-border bg-muted sm:w-44">
          <div className="flex h-8 shrink-0 items-center justify-between px-2.5 sm:px-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-traffic-red shadow-traffic" />
              <span className="size-2.5 rounded-full bg-traffic-amber shadow-traffic" />
              <span className="size-2.5 rounded-full bg-traffic-green shadow-traffic" />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="panel-left" className="size-3.5" />
              <Icon name="arrow-left" className="hidden size-3 sm:block" />
              {/* arrow-right at stroke 1.5 = the stroke-1.5 arrow-left asset mirrored (identical geometry) */}
              <Icon name="arrow-left" className="hidden size-3 -scale-x-100 sm:block" />
            </div>
          </div>
          <div className="flex h-8 items-center gap-2 px-2.5 text-foreground sm:px-3">
            <img src="/assets/img/demos/conductor-app-icon.png" alt="" width="20" height="20" className="size-5 shrink-0 rounded-md" />
            <span className="truncate text-[11px] font-medium sm:text-xs">Conductor</span>
          </div>
          <div className="space-y-0.5 px-1.5 py-0.5 sm:px-2">
            <div className="flex h-7 items-center gap-2 rounded-md px-2 text-muted-foreground">
              <Icon name="house" className="size-3.5" />
              <span className="text-[10px] sm:text-xs">Home</span>
              <div className="ml-auto hidden -space-x-1 sm:flex">
                {['/assets/img/demos/charlie.jpg', '/assets/img/demos/jackson.jpg', '/assets/img/demos/clara-schumann.jpg'].map((src) => (
                  <img key={src} src={src} alt="" width="16" height="16" className="size-4 rounded-full border border-muted object-cover" />
                ))}
              </div>
            </div>
            <div className="flex h-7 items-center gap-2 rounded-md px-2 text-muted-foreground">
              <Icon name="plus" className="size-3.5" />
              <span className="text-[10px] sm:text-xs">Create</span>
            </div>
          </div>
          <div className="mt-1 px-1 pt-1">
            <div className="mb-1 px-1.5 text-[9px] text-muted-foreground sm:text-[10px]">My workspaces</div>
            <div className="flex h-7 items-center gap-2 px-1.5 text-muted-foreground">
              <img src="/assets/img/meta/icon.png" alt="" width="16" height="16" className="size-4 shrink-0 rounded-lg" />
              <span className="min-w-0 flex-1 truncate text-[10px] sm:text-xs">Discussing favorite conductor</span>
              <span className="text-[8px] tabular-nums sm:text-[10px]">9m</span>
            </div>
            <div
              className={`flex h-7 items-center gap-2 px-1.5 text-foreground transition-[opacity,filter,translate] duration-500 ease-out motion-reduce:transition-none ${
                revealed ? 'opacity-100 blur-none [translate:0_0]' : 'opacity-0 blur-[4px] [translate:0_0.25rem]'
              }`}
            >
              <img src="/assets/img/meta/icon.png" alt="" width="16" height="16" className="size-4 shrink-0 rounded-lg" />
              <span className="min-w-0 flex-1 truncate text-[10px] font-medium sm:text-xs">New cloud workspace</span>
              <span className="text-[8px] tabular-nums text-muted-foreground sm:text-[10px]">now</span>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="flex h-8 shrink-0 items-center border-b border-border px-2 sm:h-10 sm:px-3">
            <div
              className={`flex min-w-0 items-center gap-2 transition-[opacity,filter] duration-500 ease-out motion-reduce:transition-none ${
                revealed ? 'opacity-100 blur-none' : 'opacity-0 blur-[4px]'
              }`}
            >
              <CloudLoader state={stage.cloudState} size={14} />
              <span className="truncate text-[9px] font-medium text-foreground sm:text-xs">New cloud workspace</span>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-start justify-center overflow-hidden px-3 pt-8 sm:px-6 sm:pt-10">
            <div className="w-full max-w-md">
              <div
                className={`transition-[opacity,filter,translate] duration-500 ease-emphasized motion-reduce:transition-none ${
                  revealed ? 'opacity-100 blur-none [translate:0_0]' : 'opacity-0 blur-[4px] [translate:0_0.5rem]'
                }`}
              >
                <div className="w-fit max-w-full rounded-lg bg-muted p-2 sm:p-3">
                  <div className="flex items-center gap-2 text-[10px] font-medium text-foreground sm:text-sm">
                    <CloudLoader state={stage.cloudState} size={24} />
                    <span key={stage.label} className="duration-300">
                      {stage.label}
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-20 overflow-hidden px-1 font-mono text-[8px] leading-[0.8rem] tabular-nums text-muted-foreground sm:mt-3 sm:h-28 sm:px-2 sm:text-xs sm:leading-[1.15rem]">
                  <div className="h-[0.8rem] text-right sm:h-[1.15rem]">
                    <span ref={timerRef}>{reduced ? '3150ms' : '0ms'}</span>
                  </div>
                  {stage.logs.map((line, i) => {
                    const ready = stage.cloudState === 'live' && i === stage.logs.length - 1
                    return (
                      <div key={`${stage.label}-${line}`} className={`whitespace-nowrap duration-300 ${ready ? 'text-positive' : 'text-muted-foreground'}`}>
                        <span className="mr-2">{ready ? '✓' : '›'}</span>
                        {line}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Shortcut video layer: mounted for phases 1–2 so the clip restarts every cycle */}
      {(h === 1 || h === 2) && (
        <div
          className={`absolute inset-0 z-20 overflow-hidden transition-opacity duration-250 ease-out motion-reduce:transition-none ${
            shortcut ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <video aria-hidden="true" autoPlay muted playsInline disablePictureInPicture preload="auto" className="size-full object-cover">
            <source src="/assets/video/cmdn.mp4" type="video/mp4" />
          </video>
        </div>
      )}
    </div>
  )
}

export default function Sandbox() {
  return (
    <FeatureShell
      title="A cloud sandbox for every agent."
      body="Conductor Cloud runs on isolated microVMs with your repos and dependencies pre-installed. Sandboxes spin up in seconds so your agents can run for hours."
      demo={<SandboxDemo />}
    >
      <ArrowLink href="/docs/cloud/faq">Learn more about Cloud</ArrowLink>
    </FeatureShell>
  )
}
