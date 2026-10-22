import { useEffect, useRef, useState } from 'react'
import FeatureShell from './FeatureShell.jsx'
import Icon from './Icon.jsx'
import { useInterval, usePrefersReducedMotion } from '../lib/hooks.js'

// §6 "Bring your own subscriptions and keys." + M9
const STEPS = [
  {
    model: 'GPT-5.6 Sol',
    workingPhase: 2,
    workingMessage: 'Reviewing the proposed fix for risks…',
    message: 'Found the retry dependency and outlined a safer fix.',
    icon: 'openai',
    iconClass: 'text-foreground',
  },
  {
    model: 'Fable 5',
    workingPhase: 5,
    workingMessage: 'Starting a new session to rethink the fix…',
    message: 'Fix ready without retries. Opening the pull request.',
    icon: 'fable',
    iconClass: 'text-fable',
  },
]

// Items not yet reached are `visibility:hidden` so the card never resizes.
// The original's `animate-in fade-in slide-in-from-bottom-1` classes are inert, but the `duration-*`
// that comes with them leaves `transition: all <d> ease` on shown items (and none on hidden ones),
// which governs how `visibility` flips. Mirror that exactly. Tailwind v4's `duration-*` also sets the
// inherited `--tw-duration` custom property; that inherited change makes Chrome start the child
// message span's own visibility transition in the same frame as the step's (measured), so set it too.
const SHOWN = { 500: 'duration-500 [--tw-duration:500ms]', 300: 'duration-300 [--tw-duration:300ms]' }
const shown = (cond, ms = 500) => (cond ? SHOWN[ms] : 'invisible')

const BUBBLE =
  'ml-auto max-w-[92%] rounded-lg bg-highlight px-3 py-2 text-[11px] leading-snug text-highlight-foreground sm:max-w-[82%] sm:text-sm sm:leading-snug'

function OrchestrationDemo() {
  const ref = useRef(null)
  const [started, setStarted] = useState(false)
  const [phase, setPhase] = useState(0)
  const reduced = usePrefersReducedMotion()

  // Starts once at threshold .3 and never resets.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true)
          setPhase(1)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useInterval(
    () => setPhase((u) => (u === 7 ? 0 : u + 1)),
    started && !reduced ? (phase === 7 ? 2800 : phase === 0 ? 450 : 500) : null,
  )

  const u = started && reduced ? 7 : phase

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-orchestration-phase={u}
      className="aspect-video overflow-hidden rounded-xl border border-border bg-background sm:aspect-[8/5]"
    >
      <div className="size-full overflow-y-auto overscroll-contain p-4 sm:flex sm:items-center sm:justify-center sm:overflow-hidden sm:p-6">
        <div className="w-full max-w-lg">
          <div className={`${shown(u >= 1)} ${BUBBLE}`}>
            get a review from gpt 5.6 sol to see if you can come up with any risks that this might incur or ways we could make
            it better, and then put up a PR
          </div>
          <div className="mt-7 space-y-7 sm:mt-8 sm:space-y-8">
            {STEPS.map((step, i) => {
              const complete = u >= step.workingPhase + 1
              return (
                <div key={step.model} className="space-y-7 sm:space-y-8">
                  {i === 1 && (
                    <div className={`${shown(u >= 4)} ${BUBBLE}`}>
                      start a new session with fable and ask: is there a way to fix this that doesn't depend on retries? can we
                      ensure the process just works correctly the first time?
                    </div>
                  )}
                  <div className={`${shown(u >= step.workingPhase)} flex min-w-0 items-start gap-2`}>
                    <Icon name={step.icon} className={`mt-0.5 size-4 ${step.iconClass}`} />
                    <div className="min-w-0 flex-1">
                      <div className="leading-none">
                        <span className="text-[11px] font-medium text-foreground sm:text-xs">{step.model}</span>
                      </div>
                      <div className="mt-1 flex min-w-0 items-start gap-1.5 text-[11px] leading-snug text-muted-foreground sm:text-xs sm:leading-snug">
                        {!complete && <Icon name="working" className="mt-0.5 size-3 text-muted-foreground" />}
                        {/* Keyed by text like the original, so the span remounts (no inherited-visibility linger from duration-300). */}
                        <span key={complete ? 'done' : 'working'} className="min-w-0 whitespace-normal break-words duration-300">
                          {complete ? step.message : step.workingMessage}
                        </span>
                      </div>
                      {i === 0 && (
                        <div
                          className={`${shown(u >= 3, 300)} mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-foreground sm:text-xs`}
                        >
                          <Icon name="file-text" className="size-3.5 text-muted-foreground" />
                          <span>Conductor API</span>
                          <span className="font-mono text-[9px] text-muted-foreground sm:text-[10px]">create_session</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className={`${shown(u >= 7)} mt-7 flex items-center gap-2 text-[11px] text-positive sm:mt-8 sm:text-xs`}>
            <Icon name="git-pull-request-arrow" className="size-3.5" />
            <span className="font-medium">PR #482 ready for review</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Orchestration() {
  return (
    <FeatureShell
      title="Bring your own subscriptions and keys."
      body="Conductor runs the first-party Claude Code, Codex, Cursor, and OpenCode agents under the hood."
      demo={<OrchestrationDemo />}
    />
  )
}
