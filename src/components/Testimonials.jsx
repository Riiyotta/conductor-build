import { useEffect, useRef, useState } from 'react'
import ArrowLink from './ArrowLink.jsx'
import Icon from './Icon.jsx'

// §8 Testimonials (lazy-mounted) + M4 reveal
const TESTIMONIALS = [
  {
    quote: "Conductor Cloud has made me so much more productive and I don't have to keep my Macbook Pro cracked open anymore",
    name: 'Garry Tan',
    verified: true,
    icon: { src: '/assets/img/logos/yc.png', alt: 'Y Combinator logo' },
    subtitle: 'President & CEO, Y Combinator',
    avatar: '/assets/img/testimonials/garry.jpg',
    href: 'https://x.com/garrytan/status/2092062231488061584',
  },
  {
    quote: 'Conductor is arguably as big of a productivity boost as Anthropic is.',
    name: 'Josh Pigford',
    verified: false,
    subtitle: 'Serial founder',
    avatar: '/assets/img/testimonials/josh.png',
    href: 'https://x.com/Shpigford/status/2054717330978914719',
  },
  {
    quote: 'It finally feels like I have a build tool that works the way I want it to.',
    name: 'Brandon Leonardo',
    verified: true,
    icon: { src: '/assets/img/logos/instacart-favicon.png', alt: 'Instacart logo' },
    subtitle: 'Co-founder, Instacart',
    avatar: '/assets/img/testimonials/brandon.png',
    href: 'https://x.com/shiftb',
  },
  {
    quote: "It took some adjustment, but now I can't imagine building without @conductor_build",
    name: 'Cole Bemis',
    verified: true,
    icon: { src: '/assets/img/logos/notion.svg', alt: 'Notion logo' },
    subtitle: 'Design Engineer, Notion',
    avatar: '/assets/img/testimonials/cole.jpg',
  },
  {
    quote: "I'm officially Conductor pilled 🔥",
    name: 'Brian Lovin',
    verified: true,
    icon: { src: '/assets/img/logos/notion.svg', alt: 'Notion logo' },
    subtitle: '@brian_lovin',
    avatar: '/assets/img/testimonials/brian-lovin.jpg',
    href: 'https://x.com/brian_lovin',
  },
  {
    quote: 'This is the future',
    name: 'Guillermo Rauch',
    verified: true,
    subtitle: 'CEO, Vercel',
    avatar: '/assets/img/testimonials/guillermo.jpg',
    href: 'https://x.com/rauchg',
  },
]

function Card({ t, index }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  // M4: per-card IO threshold .1, fires once; 500ms ease-out, delay index*50ms.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const content = (
    <>
      <blockquote className="text-pretty text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {`“${t.quote}”`}
      </blockquote>
      <div className="mt-6 flex w-fit items-center gap-3 transition-opacity duration-150 group-hover:opacity-70">
        <img
          src={t.avatar}
          alt={t.name}
          width="40"
          height="40"
          className="size-10 shrink-0 rounded-full border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-foreground">{t.name}</span>
            {t.verified && <Icon name="verified" className="size-4 text-foreground" role="img" aria-hidden={undefined} aria-label="Verified" />}
            {t.icon && (
              <img src={t.icon.src} alt={t.icon.alt} width="16" height="16" className="size-4 shrink-0 rounded-icon object-contain" />
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>
    </>
  )

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 50}ms` }}
      // Original (Tailwind v4) animates the individual `translate` property, not `transform`.
      className={`transition-[opacity,translate] duration-500 ease-out motion-reduce:opacity-100 motion-reduce:transition-none motion-reduce:[translate:0_0] ${
        inView ? 'opacity-100 [translate:0_0]' : 'opacity-0 [translate:0_1rem]'
      }`}
    >
      {t.href ? (
        <a href={t.href} target="_blank" rel="noreferrer" className="group block">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  )
}

function TestimonialsContent() {
  return (
    <section className="px-8 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-x-16 gap-y-24 md:grid-cols-2 lg:gap-x-24">
          {TESTIMONIALS.map((t, i) => (
            <Card key={t.name} t={t} index={i} />
          ))}
        </div>
        <ArrowLink href="https://x.com/search?q=%40conductor_build&src=typed_query" external className="mt-12">
          See what people are saying
        </ArrowLink>
      </div>
    </section>
  )
}

// Original lazy-loads this section: a placeholder is swapped in when it enters the viewport (threshold .01).
export default function Testimonials() {
  const ref = useRef(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (mounted) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setMounted(true)
          io.disconnect()
        }
      },
      { threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [mounted])

  if (mounted) return <TestimonialsContent />
  return <section ref={ref} aria-hidden="true" className="min-h-[30rem] pb-16 pt-6 md:px-8" />
}
