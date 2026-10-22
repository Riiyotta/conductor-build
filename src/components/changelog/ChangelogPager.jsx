import { Link } from 'react-router-dom'
import { TOTAL_PAGES, pageUrl, pagerItems } from './changelogData.js'

// CLONE_SPEC_DOCS §5.3 `nav[aria-label="Changelog pages"]`, class lists as in the live markup.
// The original button variant merges `px-2 gap-2` with the size's `px-2.5 gap-1.5`; computed result
// is padding 0 10px with gap 8px on the links, 6px on the disabled span (whose base lacks `gap-2`).
const FOCUS =
  'whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2'
const SIZE = 'font-medium h-7 px-2.5 text-xs rounded-md'
const OUTLINE = 'border border-border bg-background/50 backdrop-blur-md hover:bg-secondary hover:text-foreground'
const NAV_LINK = `inline-flex items-center justify-center gap-2 ${FOCUS} ${OUTLINE} ${SIZE}`
const NAV_DISABLED = `inline-flex items-center justify-center gap-1.5 ${FOCUS} ${OUTLINE} ${SIZE} pointer-events-none opacity-50`
const NUM = `inline-flex items-center justify-center gap-2 ${FOCUS} text-foreground/90 hover:bg-secondary hover:text-foreground ${SIZE}`
const NUM_CURRENT = `inline-flex items-center justify-center gap-2 ${FOCUS} bg-secondary text-foreground hover:bg-secondary/80 ${SIZE}`

const svgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}
const ChevronLeft = () => (
  <svg {...svgProps} className="lucide lucide-chevron-left pointer-events-none size-4 shrink-0">
    <path d="m15 18-6-6 6-6" />
  </svg>
)
const ChevronRight = () => (
  <svg {...svgProps} className="lucide lucide-chevron-right pointer-events-none size-4 shrink-0">
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export default function ChangelogPager({ page }) {
  const hasPrev = page > 1
  const hasNext = page < TOTAL_PAGES
  return (
    <nav aria-label="Changelog pages" className="mt-16 flex flex-col items-center gap-4 border-t border-border/40 pt-8">
      <div className="flex w-full items-center justify-between gap-4">
        {hasPrev ? (
          <Link className={NAV_LINK} rel="prev" to={pageUrl(page - 1)}>
            <ChevronLeft />
            Previous
          </Link>
        ) : (
          <span className={NAV_DISABLED} aria-disabled="true">
            <ChevronLeft />
            Previous
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          Page {page} of {TOTAL_PAGES}
        </span>
        {hasNext ? (
          <Link className={NAV_LINK} rel="next" to={pageUrl(page + 1)}>
            Next
            <ChevronRight />
          </Link>
        ) : (
          <span className={NAV_DISABLED} aria-disabled="true">
            Next
            <ChevronRight />
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {pagerItems(page).map(({ page: n, ellipsis }) => (
          <div key={n} className="flex items-center gap-1">
            {ellipsis && <span className="px-2 text-sm text-muted-foreground">...</span>}
            {n === page ? (
              <span className={NUM_CURRENT} aria-current="page">
                {n}
              </span>
            ) : (
              <Link className={NUM} to={pageUrl(n)}>
                {n}
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}
