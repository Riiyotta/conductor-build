// CLONE_SPEC_PAGES §0.2 shared PageHeader (h1 + muted lead).
// `width`: max-w-3xl (default), max-w-2xl (team-plan), max-w-5xl (brandkit, renders full 836).
export default function PageHeader({ title, lead, width = 'max-w-3xl', eyebrow = null }) {
  return (
    <div className={`mx-auto ${width}`}>
      {eyebrow}
      <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{lead}</p>
    </div>
  )
}
