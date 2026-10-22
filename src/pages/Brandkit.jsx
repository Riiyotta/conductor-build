import { Link } from 'react-router-dom'
import PageShell from '../components/pages/PageShell.jsx'
import PageContainer from '../components/pages/PageContainer.jsx'
import PageHeader from '../components/pages/PageHeader.jsx'
import Icon from '../components/Icon.jsx'
import '../components/pages/pages.css'

// CLONE_SPEC_PAGES §6 /brandkit (copy verbatim from recon/pages/content/brandkit.html).
// Original file hrefs are /brandkit/<file>; rewritten to the local copies (spec §6.3 allows either).
const BK = '/assets/pages/brandkit'

const ASSETS = [
  {
    title: 'Conductor Letter mark',
    note: 'Dark. Use on light backgrounds.',
    dark: false,
    preview: 'conductor-letter-dark.svg',
    alt: 'Letter mark preview',
    imgCls: 'h-40 w-auto',
    files: [
      ['conductor-letter-dark.svg', 'conductor-letter-dark.svg', 'SVG'],
      ['conductor-letter-dark.png · 677 x 1024', 'conductor-letter-dark.png', 'PNG'],
    ],
  },
  {
    title: 'Conductor Letter mark',
    note: 'Light. Use on dark backgrounds.',
    dark: true,
    preview: 'conductor-letter-light.svg',
    alt: 'Letter mark preview',
    imgCls: 'h-40 w-auto',
    files: [
      ['conductor-letter-light.svg', 'conductor-letter-light.svg', 'SVG'],
      ['conductor-letter-light.png · 677 x 1024', 'conductor-letter-light.png', 'PNG'],
    ],
  },
  {
    title: 'Conductor Wordmark',
    note: 'Dark. Use on light backgrounds.',
    dark: false,
    preview: 'conductor-wordmark-dark.svg',
    alt: 'Wordmark preview',
    imgCls: 'h-auto w-full max-w-lg',
    files: [
      ['conductor-wordmark-dark.svg', 'conductor-wordmark-dark.svg', 'SVG'],
      ['conductor-wordmark-dark.png · 2400 x 369', 'conductor-wordmark-dark.png', 'PNG'],
    ],
  },
  {
    title: 'Conductor Wordmark',
    note: 'Light. Use on dark backgrounds.',
    dark: true,
    preview: 'conductor-wordmark-light.svg',
    alt: 'Wordmark preview',
    imgCls: 'h-auto w-full max-w-lg',
    files: [
      ['conductor-wordmark-light.svg', 'conductor-wordmark-light.svg', 'SVG'],
      ['conductor-wordmark-light.png · 2400 x 369', 'conductor-wordmark-light.png', 'PNG'],
    ],
  },
]

const DESCRIPTION = [
  'Conductor is a Mac app for running coding agents in parallel. Developers create isolated workspaces for Claude Code, Codex, and Cursor, see what each agent is doing, then review and merge the changes.',
  'Each workspace gets its own branch, git worktree, run environment, and shared context folder, so multiple tasks can move at once without crowding the main repository.',
  'Conductor is a Y Combinator Summer 2024 company based in San Francisco, building developer tools for teams working with AI coding agents.',
]
const SHORT_DESCRIPTION =
  'Conductor is a Mac app for running Claude Code, Codex, and Cursor agents in parallel across isolated workspaces.'

const FACTS = [
  ['Product', 'Conductor'],
  ['Category', 'Developer tools / AI'],
  ['Platform', 'Mac app'],
  ['Agents', 'Claude Code, Codex, and Cursor'],
  ['Founded', '2024'],
  ['YC batch', 'Summer 2024'],
  ['Location', 'San Francisco'],
]

const ROW = 'flex items-center gap-3 rounded-md bg-muted px-3 py-2.5 text-sm transition-colors hover:bg-muted/80'

const OFFICIAL_LINKS = [
  { title: 'Website', url: 'https://www.conductor.build', to: '/' },
  { title: 'Docs', url: 'https://www.conductor.build/docs', to: '/docs' },
  { title: 'Changelog', url: 'https://www.conductor.build/changelog', to: '/changelog' },
  { title: 'YC profile', url: 'https://www.ycombinator.com/companies/conductor', href: 'https://www.ycombinator.com/companies/conductor' },
]

// §6.5: copies to the clipboard; no visual feedback at all (no icon swap, toast or label change).
// cursor: default (not pointer), as measured.
function CopyButton({ label, text }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => navigator.clipboard?.writeText(text).catch(() => {})}
      className="inline-flex size-8 shrink-0 cursor-default items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon src={`${BK}/icon-copy.svg`} className="size-3.5" />
    </button>
  )
}

function AssetCard({ a }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-background">
      <div className={`flex min-h-64 items-center justify-center p-10 ${a.dark ? 'bg-brand-dark' : 'bg-white'}`}>
        <img alt={a.alt} src={`${BK}/${a.preview}`} className={a.imgCls} />
      </div>
      <div className="border-t border-border bg-background p-5">
        <div className="mb-4 flex items-start gap-2">
          <Icon name="file-text" className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">{a.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{a.note}</p>
          </div>
        </div>
        <div className="grid gap-2">
          {a.files.map(([chip, file, kind]) => (
            <div key={file} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground">{chip}</span>
              <a download="" href={`${BK}/${file}`} className="shrink-0 text-xs text-foreground underline-offset-4 hover:underline">
                {kind}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function OfficialLink({ l }) {
  const body = (
    <>
      <div>
        <div className="font-medium text-foreground">{l.title}</div>
        <code className="font-mono text-xs text-muted-foreground">{l.url}</code>
      </div>
      <Icon src={`${BK}/icon-external-link.svg`} className="size-4 text-muted-foreground" />
    </>
  )
  const cls = `${ROW} justify-between`
  return l.to ? (
    <Link to={l.to} className={cls}>
      {body}
    </Link>
  ) : (
    <a href={l.href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  )
}

export default function Brandkit() {
  return (
    <PageShell title="Brand kit | Conductor" description="Official Conductor brand assets, product description, and links.">
      <PageContainer>
        <PageHeader
          width="max-w-5xl"
          eyebrow={
            <div className="mb-6 inline-flex items-center rounded-xs border border-tip-secondary-border bg-tip-secondary px-1 py-0.5 font-mono text-xs uppercase tracking-wider text-tip-muted">
              Brand kit
            </div>
          }
          title="Conductor brand assets"
          lead="Official Conductor brand assets, product description, and links."
        />
        {/* `text-muted-foreground sm:prose`: muted below 640, then sm:prose's body color wins → #2c2826;
            width capped at the prose default 65ch */}
        <div className="prose mt-6 max-sm:!text-muted-foreground">
          <p>
            Official product description, links, and logo files for Conductor. The downloadable ZIP includes light and dark
            SVG and PNG files for the letter mark and wordmark.
          </p>
        </div>

        {/* §6.2 download card */}
        <div className="mt-8 rounded-lg border border-border bg-muted p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                <Icon src={`${BK}/icon-file-archive.svg`} className="size-4 text-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Brand kit download</h2>
                <p className="mt-1 text-sm text-muted-foreground">Light and dark SVGs, plus PNG exports.</p>
              </div>
            </div>
            <a
              download=""
              href={`${BK}/conductor-brandkit.zip`}
              className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-foreground px-3 py-4 text-sm font-medium text-background ring-offset-background hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2 sm:w-auto"
            >
              <Icon name="download" className="size-4" />
              Download ZIP
            </a>
          </div>
        </div>

        {/* §6.3 asset cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {ASSETS.map((a) => (
            <AssetCard key={a.preview} a={a} />
          ))}
        </div>

        {/* §6.4 About Conductor. The original's 390 overflow (§6.6: cards 483.9px wide, page scrolls
            horizontally) comes from grid items without min-w-0; the markup below keeps that as-is. */}
        <section className="mt-12">
          <h2 className="mb-3 text-xl font-semibold text-foreground">About Conductor</h2>
          <div className="grid gap-3">
            <section className="rounded-lg border border-border bg-background p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">Description</h3>
                <CopyButton label="Copy description" text={DESCRIPTION.join('\n\n')} />
              </div>
              <div className="space-y-4 text-sm leading-6 text-muted-foreground sm:text-base">
                {DESCRIPTION.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
            <div className="grid items-start gap-3 md:grid-cols-2">
              <section className="rounded-lg border border-border bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">Short description</h3>
                  <CopyButton label="Copy short description" text={SHORT_DESCRIPTION} />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{SHORT_DESCRIPTION}</p>
              </section>
              <section className="rounded-lg border border-border bg-background p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Facts</h3>
                <dl className="grid gap-2">
                  {FACTS.map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3 rounded-md bg-muted px-3 py-2.5 text-sm">
                      <div className="grid min-w-0 flex-1 grid-cols-[7rem_1fr] gap-4">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="truncate text-foreground">{v}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
            <section className="rounded-lg border border-border bg-background p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Agent resources</h3>
              <p className="mb-3 text-sm leading-6 text-muted-foreground">
                Agents can discover the Conductor skill from the site root or load the skill markdown directly.
              </p>
              <div className="grid gap-2">
                {/* Served from public/.well-known (copied from /assets/pages/brandkit/well-known) */}
                <a className={ROW} href="/.well-known/agent-skills/conductor/SKILL.md">
                  <span className="w-24 shrink-0 text-muted-foreground">Skill</span>
                  <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                    /.well-known/agent-skills/conductor/SKILL.md
                  </code>
                </a>
                <a className={ROW} href="/.well-known/agent-skills/index.json">
                  <span className="w-24 shrink-0 text-muted-foreground">Discovery</span>
                  <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                    /.well-known/agent-skills/index.json
                  </code>
                </a>
              </div>
            </section>
            <section className="rounded-lg border border-border bg-background p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Official links</h3>
              <div className="grid gap-2">
                {OFFICIAL_LINKS.map((l) => (
                  <OfficialLink key={l.title} l={l} />
                ))}
              </div>
            </section>
          </div>
        </section>
      </PageContainer>
    </PageShell>
  )
}
