import PageShell from '../components/pages/PageShell.jsx'
import PageContainer from '../components/pages/PageContainer.jsx'
import PageHeader from '../components/pages/PageHeader.jsx'
import Prose from '../components/pages/Prose.jsx'
import HubSpotForm from '../components/pages/HubSpotForm.jsx'

// CLONE_SPEC_PAGES §2 /enterprise

// §2.1 logo grid (differs from the homepage strip: Life360 + Reducto, Spotify unfiltered, no counter)
const LOGOS = [
  { alt: 'Linear', src: '/assets/img/logos/linear.svg', cls: 'h-4 sm:h-6' },
  { alt: 'Vercel', src: '/assets/img/logos/vercel-light.svg', cls: 'h-3.5 sm:h-5' },
  { alt: 'Notion', src: '/assets/img/logos/notion-wordmark.svg', cls: 'h-5 sm:h-8' },
  { alt: 'Ramp', src: '/assets/img/logos/ramp-wordmark.svg', cls: 'h-5 sm:h-6' },
  { alt: 'Life360', src: '/assets/pages/enterprise/life360.png', cls: 'h-5 sm:h-6 brightness-0' },
  { alt: 'Square', src: '/assets/img/logos/square-wordmark.svg', cls: 'h-4 sm:h-6' },
  { alt: 'Reducto', src: '/assets/pages/enterprise/reducto.svg', cls: 'h-4 sm:h-5' },
  // Original serves this via next/image at w=256; rendered 88.6x24 → same 96/26 ratio as the homepage.
  { alt: 'Spotify', src: '/assets/img/logos/spotify-wordmark.png', cls: 'aspect-[96/26] h-4 sm:h-6' },
]

export default function Enterprise() {
  return (
    <PageShell
      title="Enterprise | Conductor"
      description="Conductor is the best way to run multiple coding agents in parallel. Reach out to bring Conductor to your organization."
    >
      <PageContainer>
        <PageHeader
          title="Conductor Enterprise"
          lead="Conductor is the best way to run multiple coding agents in parallel. Reach out to bring Conductor to your organization."
        />
        <Prose className="mt-10">
          <p>Trusted by builders at</p>
          <div className="not-prose mb-10 border-b border-border pb-10">
            <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4 sm:grid-cols-4 sm:gap-6">
              {LOGOS.map((l) => (
                <div key={l.alt} className="flex h-8 items-center justify-center sm:h-10">
                  <img alt={l.alt} src={l.src} className={`w-auto ${l.cls}`} />
                </div>
              ))}
            </div>
          </div>
          <section id="contact-sales" className="not-prose -mb-12 -mt-4 scroll-mt-24 md:-mb-16">
            <HubSpotForm variant="enterprise" formId="f1df7d97-c440-4b74-8f51-b020c9616e2f" />
          </section>
        </Prose>
      </PageContainer>
    </PageShell>
  )
}
