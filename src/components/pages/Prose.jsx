import Icon from '../Icon.jsx'
import './pages.css'

// CLONE_SPEC_PAGES §0.3 Prose article (`prose prose-sm sm:prose`, styles in pages.css).
// `className` carries the per-page margin (mt-10, or none on privacy/terms).
export default function Prose({ as: Tag = 'article', maxWidth = '!max-w-3xl', className = '', children }) {
  return <Tag className={`prose mx-auto w-full ${maxWidth} ${className}`}>{children}</Tag>
}

// §0.3 heading anchors: <a data-card href="#id" class="peer"> + lucide link 14px, opacity 0 → 1
// on anchor hover (150ms, default ease).
export function ProseHeading({ as: Tag = 'h2', id, children }) {
  return (
    <Tag id={id} className="flex scroll-m-28 flex-row items-center gap-2">
      <a data-card="" href={`#${id}`} className="peer">
        {children}
      </a>
      <Icon
        src="/assets/pages/shared/icon-link.svg"
        className="size-3.5 text-muted-foreground opacity-0 transition-opacity peer-hover:opacity-100"
      />
    </Tag>
  )
}
