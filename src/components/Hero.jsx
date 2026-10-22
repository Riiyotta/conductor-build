import { useEffect, useState } from 'react'
import { ArrowRight } from './ArrowLink.jsx'
import { useInterval, useScramble } from '../lib/hooks.js'

// §2 Hero
const PHRASES = ['in the cloud.', 'on your Mac.', 'from your iPhone.']

function HeroHeadline() {
  const [ready, setReady] = useState(false)
  const [index, setIndex] = useState(0)
  const text = PHRASES[index]

  // M1: options exactly as passed in the shipped bundle (step/chance/seed/tick default to 1).
  const { ref } = useScramble({
    text,
    speed: 0.7,
    scramble: 3,
    range: [97, 122],
    ignore: [' ', '.'],
    playOnMount: false,
    overdrive: false,
  })

  // M3: fade in on first rAF after mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // M1: advance phrase every 3000ms, forever.
  useInterval(() => setIndex((i) => (i + 1) % PHRASES.length), 3000)

  return (
    <h1
      className={`mb-8 text-[length:min(1.875rem,calc(7.4vw_-_2.5px))] font-semibold tracking-tight text-inherit transition-opacity duration-500 ease-out motion-reduce:opacity-100 motion-reduce:transition-none sm:text-4xl ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="block">Run a team of coding agents</span>
      {/* Original renders the phrase as children too, so the new phrase flashes for one frame before the scramble's first tick. */}
      <span ref={ref} className="block">
        {text}
      </span>
    </h1>
  )
}

export default function Hero() {
  return (
    <div className="relative isolate overflow-hidden bg-background text-foreground">
      <img
        src="/assets/img/homepage-hero-background.webp"
        alt=""
        width="1672"
        height="941"
        className="hero-bg-mask pointer-events-none absolute inset-x-0 top-0 z-0 h-auto min-h-[34rem] w-full select-none object-cover"
      />

      <section className="relative z-10 mx-auto max-w-xl px-4 pt-20 text-white sm:px-8 sm:pt-24">
        {/* Wordmark: animated WebP (plays once, M2) used as a mask over white */}
        <div className="mb-8">
          <div className="w-48 sm:w-56">
            <div className="relative flex aspect-[496/76] w-full items-center justify-start overflow-visible">
              <span
                aria-hidden="true"
                className="block h-full w-full bg-current"
                style={{
                  WebkitMaskImage: 'url(/assets/img/animations/conductor-logo.webp)',
                  maskImage: 'url(/assets/img/animations/conductor-logo.webp)',
                  WebkitMaskPosition: 'left center',
                  maskPosition: 'left center',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                }}
              />
            </div>
          </div>
        </div>

        <HeroHeadline />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="/pricing"
            className="group inline-flex h-10 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md bg-background px-3 py-4 text-sm font-semibold text-foreground hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2"
          >
            Get Conductor
            <ArrowRight />
          </a>

          <blockquote className="mt-1 text-pretty text-foreground sm:col-span-2">
            <p className="text-sm italic leading-6">
              “feels like going from typing with two fingers to having eight arms”
            </p>
            <footer className="mt-2 flex items-center gap-2 text-xs leading-5">
              <img
                src="/assets/img/testimonials/frank.jpg"
                alt="Frank"
                width="20"
                height="20"
                className="size-5 shrink-0 rounded-full border border-border object-cover"
              />
              <span>
                <span className="font-medium">Frank</span>, Product Designer, Thinking Machines
              </span>
            </footer>
          </blockquote>
        </div>
      </section>

      <div className="relative z-10 mx-auto mb-10 mt-8 max-w-hero px-4 sm:mb-14 sm:mt-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl">
          <img
            src="/assets/img/conductor-app-hero-light.webp"
            alt="Conductor app showing collaborative agent chats and a changes panel"
            width="3022"
            height="1954"
            className="h-auto w-full"
          />
        </div>
      </div>
    </div>
  )
}
