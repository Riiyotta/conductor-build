import { useEffect, useRef, useState } from 'react'
import FeatureShell from './FeatureShell.jsx'
import Icon from './Icon.jsx'
import { useInterval } from '../lib/hooks.js'

// §4 "Ludwig has entered the chat."
const TITLE_AVATARS = [
  {
    name: 'Clara Schumann',
    src: '/assets/img/demos/clara-schumann.jpg',
    timeZone: 'Europe/Berlin',
    href: 'https://en.wikipedia.org/wiki/Clara_Schumann',
    imgClass: 'object-[center_25%]',
  },
  {
    name: 'Wolfgang Amadeus Mozart',
    src: '/assets/img/demos/mozart.jpg',
    timeZone: 'Europe/Vienna',
    href: 'https://en.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart',
  },
  {
    name: 'Ludwig van Beethoven',
    src: '/assets/img/demos/beethoven.jpg',
    timeZone: 'Europe/Berlin',
    href: 'https://en.wikipedia.org/wiki/Ludwig_van_Beethoven',
    online: true,
  },
]

const COMPOSERS = [
  {
    name: 'Ludwig',
    src: '/assets/img/demos/beethoven.jpg',
    messages: ['shipped the fourth movement for @Clara', "can't hear the CI alarms, sorry", '@Clara rewrote the finale, again'],
  },
  {
    name: 'Wolfgang',
    src: '/assets/img/demos/mozart.jpg',
    messages: ['@Ludwig MORE FORTISSIMO!!', "one-shotted @Ludwig's review", "@Ludwig no notes needed, it's done"],
  },
  {
    name: 'Clara',
    src: '/assets/img/demos/clara-schumann.jpg',
    messages: ["reviewing @Ludwig's PR", 'left a few comments', 'on tour, but the agents are running'],
  },
  {
    name: 'Johann',
    src: '/assets/img/demos/bach.jpg',
    messages: ["refactored @Wolfgang's patch into a fugue", "every voice passes @Clara's tests now", 'rebasing on the Well-Tempered branch'],
  },
  {
    name: 'Frédéric',
    src: '/assets/img/demos/chopin.jpg',
    messages: ['nocturne deployed for @Clara', 'tiny patch for @Johann, very delicate', 'please review quietly'],
  },
]

const formatTime = (timeZone) =>
  new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(new Date())

function TitleAvatar({ avatar }) {
  const [time, setTime] = useState(() => formatTime(avatar.timeZone))
  // M13: refresh local time every 30s
  useInterval(() => setTime(formatTime(avatar.timeZone)), 30000)

  return (
    <a
      href={avatar.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${avatar.name} on Wikipedia`}
      className="group/avatar relative block size-7 rounded-full outline-none hover:z-10 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <img
        src={avatar.src}
        alt=""
        width="28"
        height="28"
        className={`size-7 rounded-full object-cover ring-1 ring-black/10 ${avatar.imgClass ?? ''}`}
      />
      {avatar.online && (
        <span aria-hidden="true" className="absolute bottom-0 right-0 size-2 rounded-full bg-positive ring-2 ring-background" />
      )}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 flex flex-col [translate:-50%_0.25rem] whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-[10px] font-normal tracking-normal text-background opacity-0 shadow-md transition-[opacity,translate] duration-150 group-hover/avatar:opacity-100 group-hover/avatar:[translate:-50%_0] group-focus-visible/avatar:opacity-100 group-focus-visible/avatar:[translate:-50%_0]"
      >
        <span>{avatar.name}</span>
        <span className="font-mono text-[8px] tabular-nums text-background/60">{time} local time</span>
      </span>
    </a>
  )
}

function Message({ message }) {
  return message.split(/(@[\p{L}\p{M}-]+)/gu).map((part, i) => {
    const c = COMPOSERS.find((x) => part === `@${x.name}`)
    if (!c) return <span key={`${part}-${i}`}>{part}</span>
    return (
      <span
        key={`${part}-${i}`}
        className="inline-flex h-5 translate-y-[0.09em] items-center gap-1 rounded-sm border border-border bg-background px-1.5 align-text-bottom text-xs leading-none text-foreground"
      >
        <img src={c.src} alt="" width="12" height="12" className="size-3 rounded-full object-cover" />
        {c.name}
      </span>
    )
  })
}

function MultiplayerDemo() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const [counter, setCounter] = useState(0)
  const [active, setActive] = useState(undefined)

  // M6: IO threshold .3, toggles; leaving the viewport resets.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        const isIn = entry?.isIntersecting === true
        setVisible(isIn)
        if (!isIn) {
          setActive(undefined)
          setCounter(0)
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // M6: 1400ms typing, then one bubble for 2600ms, repeat.
  useInterval(
    () => {
      if (active !== undefined) {
        setActive(undefined)
        return
      }
      const composerIndex = counter % COMPOSERS.length
      const msgs = COMPOSERS[composerIndex].messages
      setActive({ composerIndex, messageIndex: Math.floor(counter / COMPOSERS.length) % msgs.length })
      setCounter((c) => c + 1)
    },
    visible ? (active === undefined ? 1400 : 2600) : null,
  )

  return (
    <div
      ref={ref}
      data-multiplayer-visible={visible}
      className="flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-background px-6 sm:px-10"
    >
      <ul aria-hidden="true" className="flex w-full max-w-sm select-none flex-col gap-4 py-2">
        {COMPOSERS.map((c, i) => {
          const message = active?.composerIndex === i ? c.messages[active.messageIndex] : undefined
          return (
            // duration-500 mirrors the original (inert animate-in classes leave `transition: all 500ms ease`).
            <li key={c.name} className="flex items-center gap-2 duration-500">
              <span className="relative shrink-0">
                <img src={c.src} alt="" width="24" height="24" className="size-6 rounded-full object-cover" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-presence ring-2 ring-background" />
              </span>
              <span className="text-sm text-muted-foreground">{c.name}</span>
              <span className="relative">
                {message === undefined ? (
                  <Icon name="typing" className="size-4 text-muted-foreground" />
                ) : (
                  <span className="absolute left-0 top-1/2 w-max -translate-y-1/2 whitespace-nowrap rounded-md bg-highlight px-3 py-2 text-sm text-highlight-foreground">
                    <Message message={message} />
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function Multiplayer() {
  return (
    <FeatureShell
      title="Ludwig has entered the chat."
      titleExtra={
        <span className="flex -space-x-1.5">
          {TITLE_AVATARS.map((a) => (
            <TitleAvatar key={a.name} avatar={a} />
          ))}
        </span>
      }
      body={
        <>
          Conductor is now <em>multiplayer</em>. Share a workspace link (⌘⇧C) with teammates, see who is active, follow
          work you care about, and prompt agents together in real-time.
        </>
      }
      demo={<MultiplayerDemo />}
    />
  )
}
