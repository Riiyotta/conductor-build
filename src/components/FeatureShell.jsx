// §4–7 shared feature-section shell
export default function FeatureShell({ title, titleExtra, body, demo, children }) {
  return (
    <section className="mx-auto grid max-w-3xl gap-6 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div>
        <h2 className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          <span>{title}</span>
          {titleExtra}
        </h2>
        <div className="space-y-3 text-sm text-muted-foreground sm:text-base">
          <p>{body}</p>
        </div>
      </div>
      <div>{demo}</div>
      {children}
    </section>
  )
}
