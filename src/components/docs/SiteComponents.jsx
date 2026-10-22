import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Lucide from './icons.jsx'
import { CodeFigure } from './CodeFigure.jsx'
import { Nodes, usePageBody } from './Body.jsx'

// §3.11 site-specific components. Markup follows the SSR captures in recon/docs/components/*.ssr.html.

const DARK_BTN =
  'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-foreground px-3 py-4 text-sm font-medium text-background ring-offset-background hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0'

// /docs/api. Static UI only: the original runs live requests against api.conductor.build; the clone's
// "Run test" button intentionally does nothing (no network calls).
function ApiKeyTester() {
  const [value, setValue] = useState('')
  return (
    <div className="not-prose my-6 rounded-lg border border-border/80 bg-muted/20 p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          placeholder="Conductor API key"
          autoComplete="off"
          spellCheck="false"
          aria-label="Conductor API key"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
        />
        <button type="button" className={`${DARK_BTN} shrink-0`}>
          Run test
        </button>
      </div>
    </div>
  )
}

// /docs/api, /docs/api/mcp: an untitled code block holding the prompt (no language, no line spans).
function ApiAgentPrompt({ prompt }) {
  return (
    <CodeFigure copyText={prompt}>
      <pre className="px-4">
        <code>{prompt}</code>
      </pre>
    </CodeFigure>
  )
}

// Prompt text verbatim from the SSR <pre>; the deep link is conductor://prompt=<encodeURIComponent(prompt)>.
const CONFIGURE_PROMPT =
  "Use the bundled Conductor skill.\n\nRead the relevant docs:\n- https://www.conductor.build/docs/reference/settings\n- https://www.conductor.build/docs/reference/scripts\n\nInspect this repo and create or update the `.conductor/settings.local.toml` file in the repo root with the best local Conductor config for this repository.\n\nRequirements:\n- If `.conductor/settings.local.toml` already exists, preserve its existing settings unless clearly wrong.\n- Inspect `.conductor/settings.toml` if it exists, but treat it as inherited shared defaults. Do not edit or duplicate shared settings unless a local override is needed.\n- Stamp the schema at the top for validation: `\"$schema\" = \"https://conductor.build/schemas/settings.repo.schema.json\"`.\n- Configure the `[scripts]` table as fully as makes sense; baseline is a setup script with `scripts.setup`, plus `scripts.run` and `scripts.archive`.\n- Follow the repo's existing package manager, scripts, and setup conventions.\n- Keep commands simple, non-interactive, non-destructive, and workspace-safe.\n- Use `CONDUCTOR_PORT` for actions (`scripts.run`) when the project supports configurable ports.\n- Set `scripts.run_mode` if concurrency behavior is clear.\n- Use the `[scripts]` table in `.conductor/settings.local.toml`; do not create a legacy `conductor.json` file.\n- Recommend `.conductor/settings.toml` only when the user explicitly wants a shared, committed team default.\n\nInspect the usual sources: package files, lockfiles, README/contributing docs, Makefile/justfile/taskfile, Docker/Procfile config, and existing `scripts/` or `bin/`.\n\nAfter editing, validate the TOML and summarize what you configured, why, what remains inherited from shared settings, and one quick Conductor test I can run."
// /docs/configure-your-project
function ConfigureProjectPrompt() {
  return (
    <section className="not-prose my-6 rounded-lg border border-border/80 bg-muted/20 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="m-0 text-sm font-medium text-foreground">Configure with Conductor</h2>
          <p className="m-0 mt-1 text-sm leading-6 text-muted-foreground">
            Open Conductor with the shared settings.toml setup prompt pre-filled, or copy it into an existing workspace.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <a href={`conductor://prompt=${encodeURIComponent(CONFIGURE_PROMPT)}`} className={DARK_BTN}>
            Open Conductor
            <Lucide name="external-link" className="size-3.5" />
          </a>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(CONFIGURE_PROMPT).catch(() => {})}
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border bg-background/50 px-3 py-4 text-sm font-medium ring-offset-background backdrop-blur-md hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:shrink-0"
          >
            <Lucide name="copy" className="size-3.5" />
            Copy prompt
          </button>
        </div>
      </div>
      <details className="mt-4 rounded-md border border-border/70 bg-background">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          View prompt
        </summary>
        <pre className="m-0 max-h-80 overflow-auto whitespace-pre-wrap border-t border-border/70 p-3 font-mono text-xs leading-5 text-foreground">
          {CONFIGURE_PROMPT}
        </pre>
      </details>
    </section>
  )
}

// /docs/reference/keyboard-shortcuts. The trigger is from the SSR capture; the overlay itself is not
// server-rendered and was not captured, so it lists the page's own shortcut tables (approximation).
function KeyboardShortcutsCheatsheetOverlay() {
  const [open, setOpen] = useState(false)
  const body = usePageBody()
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  const sections = []
  for (const n of body) {
    if (n.type === 'element' && n.tag === 'h2') sections.push({ title: n.children, rows: [] })
    else if (n.type === 'table' && sections.length) sections[sections.length - 1].rows.push(...n.rows)
  }

  return (
    <div className="keyboard-shortcuts-cheatsheet-overlay not-prose my-8">
      <button type="button" className="keyboard-shortcuts-cheatsheet-overlay-link" onClick={() => setOpen(true)}>
        <Lucide name="maximize-2" className="size-4" />
        Open keyboard shortcuts cheatsheet
      </button>
      {open &&
        createPortal(
          <div className="docs-root fixed inset-0 z-50 font-prose text-foreground">
            <div className="animate-fd-fade-in absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div
              role="dialog"
              aria-label="Keyboard shortcuts cheatsheet"
              className="absolute inset-4 overflow-auto rounded-xl border border-border bg-background p-6 shadow-lg md:inset-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Keyboard shortcuts</h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Lucide name="x" className="size-4" />
                </button>
              </div>
              <div className="columns-1 gap-8 md:columns-2 xl:columns-3">
                {sections.map((s, i) => (
                  <section key={i} className="mb-6 break-inside-avoid">
                    <h3 className="mb-2 text-sm font-semibold">
                      <Nodes nodes={s.title} />
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-sm">
                      {s.rows.map((row, j) => (
                        <li key={j} className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            <Nodes nodes={row[1]?.children} />
                          </span>
                          <span className="shrink-0">
                            <Nodes nodes={row[0]?.children} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

// /docs/reference/cities. Data points and geometry from the SSR chart (viewBox 920x430, plot x 88–892,
// y 28–360, 5k–30k spawns). Hovering/focusing a point moves the readout (default: 20,000 spawns).
const CITY_POINTS = [
  [5000, 0.29], [6000, 1.68], [7000, 5.34], [8000, 11.81], [9000, 20.69], [10000, 30.99], [11000, 41.65],
  [12000, 51.83], [13000, 60.98], [14000, 68.87], [15000, 75.47], [16000, 80.84], [18000, 88.55],
  [20000, 93.27], [22000, 96.08], [24000, 97.74], [26000, 98.7], [28000, 99.25], [30000, 99.57],
]
const QUANTILES = [
  { pct: 50, spawns: 11815, label: '~12k' },
  { pct: 75, spawns: 14923, label: '~15k' },
  { pct: 90, spawns: 18516, label: '~18.5k' },
  { pct: 95, spawns: 21101, label: '~21k' },
  { pct: 99, spawns: 26964, label: '~27k' },
]
const C_BORDER = '#eae8e6'
const C_FG = '#2c2826'
const C_MUTED = '#756f6c'
const C_BG = '#ffffff'
const cx = (s) => 88 + ((s - 5000) / 25000) * 804
const cy = (p) => 360 - (p / 100) * 332

function CityProbabilityCurve() {
  const [sel, setSel] = useState(13)
  const pts = CITY_POINTS.map(([s, p]) => ({ s, p, x: cx(s), y: cy(p) }))
  const line = pts.map((pt, i) => `${i ? 'L' : 'M'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ')
  const area = `${line} L 892.0 360.0 L 88.0 360.0 Z`
  const bounds = pts.map((pt, i) => {
    const left = i === 0 ? 88 : (pts[i - 1].x + pt.x) / 2
    const right = i === pts.length - 1 ? 892 : (pt.x + pts[i + 1].x) / 2
    return { left, width: right - left }
  })
  const cur = pts[sel]
  const tipX = Math.min(Math.max(cur.x - 95, 88), 892 - 190)
  const tipY = Math.min(Math.max(cur.y - 76, 36), 290)
  const fmt = (n) => n.toLocaleString('en-US')
  const pctText = `${cur.p.toFixed(2)}%`

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-[0.9rem] border border-border/80 bg-muted/35">
      <div className="border-b border-border/80 px-4 py-4 sm:px-5">
        <h2 className="text-lg font-semibold tracking-normal text-foreground">Probability of finding all 295 cities</h2>
        <p className="mt-1 text-sm text-muted-foreground">Workspace spawns vs. chance of complete discovery.</p>
      </div>
      <div className="grid grid-cols-2 gap-px border-b border-border/80 bg-border/80 sm:grid-cols-5">
        {QUANTILES.map((q) => (
          <button
            key={q.pct}
            type="button"
            aria-label={`${q.pct}% chance after about ${fmt(q.spawns)} workspace spawns`}
            className="bg-background px-4 py-3 text-left transition-colors hover:bg-muted/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/35"
          >
            <div className="text-xs font-medium text-muted-foreground">{q.pct}% chance</div>
            <div className="mt-1 text-xl font-semibold leading-none text-foreground">{q.label}</div>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 pt-4 text-xs text-muted-foreground sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-0.5 w-6 rounded-full bg-foreground" />
          <span>Probability curve</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-px w-6 border-t border-dashed border-muted-foreground" />
          <span>Quantile thresholds</span>
        </div>
      </div>
      <div className="overflow-x-auto px-2 pb-2 pt-1 sm:px-4">
        <svg
          role="img"
          aria-labelledby="city-probability-title city-probability-description"
          viewBox="0 0 920 430"
          className="min-w-[40rem] max-w-full"
        >
          <title id="city-probability-title">Probability of finding all 295 cities</title>
          <desc id="city-probability-description">
            A line chart showing the chance of seeing all 295 cities after between 5,000 and 30,000 workspace spawns.
          </desc>
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1="88" x2="892" y1={cy(v)} y2={cy(v)} stroke={C_BORDER} strokeOpacity={v === 0 ? 1 : 0.8} />
              <text x="73" y={cy(v) + 6} textAnchor="end" className="fill-muted-foreground text-[15px]">
                {v}%
              </text>
            </g>
          ))}
          {[5, 10, 15, 20, 25, 30].map((k) => (
            <g key={k}>
              <line x1={cx(k * 1000)} x2={cx(k * 1000)} y1="28" y2="360" stroke={C_BORDER} strokeOpacity="0.45" />
              <text x={cx(k * 1000)} y="390" textAnchor="middle" className="fill-muted-foreground text-[15px]">
                {k}k
              </text>
            </g>
          ))}
          <path d={area} fill={C_FG} opacity="0.06" />
          {QUANTILES.map((q) => (
            <g key={q.pct}>
              <line
                x1={cx(q.spawns)}
                x2={cx(q.spawns)}
                y1="28"
                y2="360"
                stroke={C_MUTED}
                strokeDasharray="7 8"
                strokeOpacity="0.45"
                strokeWidth="1"
              />
              <text x={cx(q.spawns)} y="44" textAnchor="middle" className="fill-muted-foreground text-[14px] font-medium">
                {q.pct}%
              </text>
            </g>
          ))}
          <path d={line} fill="none" stroke={C_FG} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          {bounds.map((b, i) => (
            <rect
              key={i}
              x={b.left}
              y="28"
              width={b.width}
              height="332"
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setSel(i)}
            />
          ))}
          {pts.map((pt, i) => (
            <g key={pt.s}>
              <circle cx={pt.x} cy={pt.y} r={i === sel ? 6 : 4} fill={C_FG} stroke={C_BG} strokeWidth="2" />
              <circle
                tabIndex={0}
                role="button"
                aria-label={`${fmt(pt.s)} workspace spawns gives a ${pt.p.toFixed(2)}% chance of seeing all cities`}
                cx={pt.x}
                cy={pt.y}
                r="14"
                fill="transparent"
                className="cursor-pointer outline-none focus:stroke-foreground"
                stroke="transparent"
                strokeWidth="2"
                onMouseEnter={() => setSel(i)}
                onFocus={() => setSel(i)}
              />
            </g>
          ))}
          <line x1="88" x2="88" y1="28" y2="360" stroke={C_BORDER} strokeWidth="1.5" />
          <line x1="88" x2="892" y1="360" y2="360" stroke={C_BORDER} strokeWidth="1.5" />
          <text x="490" y="418" textAnchor="middle" className="fill-muted-foreground text-[16px] font-medium">
            Workspaces spawned
          </text>
          <text
            x="18"
            y="194"
            textAnchor="middle"
            transform="rotate(-90 18 194)"
            className="fill-muted-foreground text-[16px] font-medium"
          >
            Probability of seeing all 295 cities
          </text>
          <g pointerEvents="none">
            <line x1={cur.x} x2={cur.x} y1={cur.y} y2="360" stroke={C_FG} strokeOpacity="0.22" strokeDasharray="4 5" />
            <circle cx={cur.x} cy={cur.y} r="5.5" fill={C_BG} stroke={C_FG} strokeWidth="2" />
            <rect x={tipX} y={tipY} width="190" height="62" rx="8" fill={C_BG} stroke={C_BORDER} />
            <text x={tipX + 12} y={tipY + 24} className="fill-foreground text-[14px] font-semibold">
              {fmt(cur.s)} spawns
            </text>
            <text x={tipX + 12} y={tipY + 45} className="fill-muted-foreground text-[13px]">
              {pctText} chance
            </text>
          </g>
        </svg>
      </div>
      <div className="flex flex-col gap-2 border-t border-border/80 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <span className="text-foreground">
          {fmt(cur.s)} workspaces: {pctText} chance of seeing all cities
        </span>
        <span>Each legendary city: ~1 in 3,600 spawns</span>
        <span>n = 295 cities</span>
      </div>
      <figcaption className="sr-only">
        The probability reaches about 50% after 11,815 workspace spawns, 75% after 14,923, 90% after 18,516, 95% after
        21,101, and 99% after 26,964.
      </figcaption>
    </figure>
  )
}

export const SITE_COMPONENTS = {
  ApiKeyTester,
  ApiAgentPrompt,
  ConfigureProjectPrompt,
  KeyboardShortcutsCheatsheetOverlay,
  CityProbabilityCurve,
}
