import { useEffect, useState } from 'react'
import Lucide, { RawSvg } from './icons.jsx'

// §3.1 fumadocs CodeBlock chrome: figure, optional title bar with language icon, copy button.
export function CopyButton({ text, className = '' }) {
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    if (!checked) return
    const t = setTimeout(() => setChecked(false), 1500)
    return () => clearTimeout(t)
  }, [checked])
  return (
    <button
      type="button"
      aria-label={checked ? 'Copied Text' : 'Copy Text'}
      data-checked={checked ? '' : undefined}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => setChecked(true),
          () => {},
        )
      }}
      className={`inline-flex items-center justify-center rounded-md p-1 text-sm font-medium transition-colors duration-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary data-[checked]:text-foreground [&_svg]:size-4 ${className}`}
    >
      <Lucide name={checked ? 'check' : 'clipboard'} />
    </button>
  )
}

const FIGURE_SHADOW = 'shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]'

export function CodeFigure({ title, icon, copyText, inTab = false, children }) {
  return (
    <figure
      dir="ltr"
      tabIndex={-1}
      className={`docs-code shiki not-prose relative overflow-hidden border border-border text-sm ${FIGURE_SHADOW} ${
        inTab ? '-mx-px -mb-px rounded-b-xl bg-muted' : 'my-4 rounded-xl bg-background'
      }`}
    >
      {title ? (
        <div className="flex h-[38px] items-center gap-2 border-b border-border px-4 text-muted-foreground">
          {icon && <RawSvg svg={icon} className="block [&_svg]:size-3.5" />}
          <figcaption className="flex-1 truncate">{title}</figcaption>
          <CopyButton text={copyText} className="-me-2" />
        </div>
      ) : (
        <div className="absolute right-2 top-3 z-[2] rounded-lg text-muted-foreground backdrop-blur-lg">
          <CopyButton text={copyText} />
        </div>
      )}
      <div
        role="region"
        tabIndex={0}
        className="docs-code-region focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        style={title ? undefined : { '--padding-right': '32px' }}
      >
        {children}
      </div>
    </figure>
  )
}

