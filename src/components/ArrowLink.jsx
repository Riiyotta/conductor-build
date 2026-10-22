// Original markup: inline lucide arrow-right SVG, class
// "lucide lucide-arrow-right size-4 transition-transform duration-200 group-hover:translate-x-1" (Tailwind v4,
// so the hover moves the standalone `translate` property 0 -> 4px over 0.2s ease, transform stays none).
// Tailwind v3 here: `translate-x-1` would animate `transform`, so the `translate` property is set explicitly.
export function ArrowRight({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-arrow-right size-4 transition-[transform,translate,scale,rotate] duration-200 group-hover:[translate:0.25rem_0] ${className}`}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

// "Learn more about Cloud" / "See what people are saying" link style (§5, §8)
export default function ArrowLink({ href, external, className = '', children }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className={`group flex w-fit items-center gap-2 text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground ${className}`}
    >
      {children}
      <ArrowRight />
    </a>
  )
}
