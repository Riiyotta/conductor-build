import Icon from './Icon.jsx'
import { useDownloadDialog } from './DownloadDialog.jsx'

// §10 CTA "Be like this guy."
export default function CTA() {
  const { open } = useDownloadDialog()
  return (
    <section className="relative isolate mx-auto flex min-h-[24rem] w-full max-w-7xl items-center justify-center overflow-hidden bg-background sm:min-h-[32rem]">
      <div className="cta-bg-mask absolute inset-0 -z-10">
        <img
          src="/assets/img/conductor-orchestra.webp"
          alt="A conductor leading an orchestra in front of a packed audience"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-background to-transparent xl:block" />
        <div className="absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-background to-transparent xl:block" />
      </div>
      <div className="flex flex-col items-center px-4">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-4xl">
          Be like this guy.
          <br />
          Try Conductor.
        </h2>
        <button
          type="button"
          onClick={open}
          className="group mt-8 inline-flex h-10 cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-md bg-white px-5 py-4 text-sm font-bold text-black shadow-lg hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2"
        >
          Download now
          <span className="relative size-4">
            <Icon
              name="download"
              className="absolute inset-0 size-4 transition-all duration-200 group-hover:-translate-y-2 group-hover:opacity-0"
            />
            <Icon
              name="arrow-down"
              className="absolute inset-0 size-4 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
            />
          </span>
        </button>
      </div>
    </section>
  )
}
