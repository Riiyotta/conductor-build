import { ArrowRight } from './ArrowLink.jsx'

// §9 Changelog (live data as of the recon date)
const ENTRIES = [
  { version: '0.91.0', date: 'October 15, 2026', title: 'A (mostly) boring update', href: '/changelog/0.91.0-a-mostly-boring-update' },
  { version: '0.90.0', date: 'October 2, 2026', title: 'Conductor for iOS', href: '/changelog/0.90.0-conductor-for-ios' },
  { version: '0.89.1', date: 'September 29, 2026', title: 'GPT-6.1 Sol', href: '/changelog/0.89.1-gpt-6-1-sol' },
]

// Latest release; also shown as `CONDUCTOR v<version>` on the post-download terminal screen.
export const LATEST_VERSION = ENTRIES[0].version

export default function Changelog() {
  return (
    <section className="border-t border-border bg-background px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          <a href="/changelog">Changelog</a>
        </h2>
        <a
          href="https://x.com/kennyliu/status/1950364590841483673?s=20"
          target="_blank"
          rel="noreferrer"
          className="mt-5 block text-pretty text-sm italic leading-6 text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
        >
          “The speed and fury with which the Conductor team ships is magnificent to behold.”
        </a>
        <div className="-mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
          {ENTRIES.map((e) => (
            <a
              key={e.version}
              href={e.href}
              className="group flex w-[min(82vw,24rem)] shrink-0 snap-start flex-col overflow-hidden border border-border bg-background transition-colors hover:border-foreground/30 md:w-auto"
            >
              <div className="p-6">
                <div className="flex items-center gap-3">
                  {/* Renders sans on the original (font-mono is remapped to the sans stack, §0.1) */}
                  <div className="inline-flex items-center rounded-xs border border-tip-secondary-border bg-tip-secondary px-1 py-0.5 font-sans text-xs uppercase tracking-wider tabular-nums text-tip-muted">
                    {e.version}
                  </div>
                  <span className="text-xs text-muted-foreground">{e.date}</span>
                </div>
                <h3 className="mt-5 line-clamp-2 text-base font-semibold text-foreground transition-opacity group-hover:opacity-70">
                  {e.title}
                </h3>
              </div>
            </a>
          ))}
        </div>
        <a
          href="/changelog"
          className="group mt-14 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowRight />
        </a>
      </div>
    </section>
  )
}
