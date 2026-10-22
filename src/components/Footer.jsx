import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

// §11 Footer (original uses `font-mono`, which is remapped to the sans stack – renders sans)
const COLUMNS = [
  {
    heading: '[Company]',
    links: [
      { label: 'Team', href: '/join-us#our-team' },
      { label: 'Blog', href: '/blog' },
      { label: 'Enterprise', href: '/enterprise' },
      { label: 'Join us', href: '/join-us' },
    ],
  },
  {
    heading: '[Resources]',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Brand kit', href: '/brandkit' },
    ],
  },
  {
    heading: '[Legal]',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
  {
    heading: '[Connect]',
    external: true,
    links: [
      { label: 'X', href: 'https://x.com/conductor_build' },
      { label: 'YouTube', href: 'https://www.youtube.com/@conductor_build' },
      { label: 'Reddit', href: 'https://www.reddit.com/r/conductorbuild' },
      { label: 'Discord', href: 'https://discord.gg/RSrYmstWzy' },
    ],
  },
]

// `mono`: CLONE_SPEC_PAGES §0.1 – on the standalone subpages the footer is not inside the
// homepage's sans wrapper, so its `font-mono` renders real mono.
export default function Footer({ mono = false }) {
  return (
    <footer
      className={`relative overflow-hidden border-t border-border bg-muted px-6 pb-12 pt-16 sm:px-8 ${
        mono ? 'font-mono' : 'font-sans'
      }`}
    >
      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4 lg:gap-x-12">
          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <span className="text-sm text-muted-foreground">{col.heading}</span>
              <div className="flex flex-col gap-2">
                {col.links.map((l) =>
                  col.external ? (
                    <a
                      key={l.label}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground transition-colors hover:text-foreground/70"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      key={l.label}
                      to={l.href}
                      className="text-sm text-foreground transition-colors hover:text-foreground/70"
                    >
                      {l.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-sm text-muted-foreground">© 2026 Melty Labs</span>
          <a
            href="https://trust.conductor.build"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon name="shield-check" className="size-4" />
            SOC 2 Type II
          </a>
        </div>
      </div>
    </footer>
  )
}
