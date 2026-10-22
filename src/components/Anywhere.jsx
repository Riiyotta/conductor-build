import FeatureShell from './FeatureShell.jsx'
import { useDownloadDialog } from './DownloadDialog.jsx'

// §7 "Conduct from anywhere."
const BTN =
  'inline-flex h-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted'

export default function Anywhere() {
  const { open } = useDownloadDialog()
  return (
    <FeatureShell
      title="Conduct from anywhere."
      body="Conduct from the desktop app, mobile, or your own integrations to the Conductor API."
      demo={
        <div className="overflow-hidden rounded-xl border border-border">
          <img
            src="/assets/img/demos/conductor-mobile-dock.jpeg"
            alt="Conductor in the iPhone app dock"
            width="1825"
            height="862"
            // Rendered ratio follows the next/image candidate the original serves at DPR 1
            // (sizes="(min-width: 768px) 44rem, 100vw"): 640w -> 640x302 below md, 750w -> 750x354 at md+.
            // Measured: 356x168 at 390, 702x331.3 at 1280/1440.
            className="aspect-[640/302] h-auto w-full object-cover md:aspect-[750/354]"
          />
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-2 font-mono text-xs sm:text-sm">
        <button type="button" onClick={open} className={`${BTN} cursor-pointer`}>
          macOS
        </button>
        <a href="https://apps.apple.com/us/app/conductor-build/id6791228564" target="_blank" rel="noreferrer" className={BTN}>
          iOS
        </a>
        <a href="/docs/api" className={BTN}>
          API
        </a>
      </div>
    </FeatureShell>
  )
}
