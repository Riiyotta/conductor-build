import PageShell from '../components/pages/PageShell.jsx'
import PageContainer from '../components/pages/PageContainer.jsx'
import PageHeader from '../components/pages/PageHeader.jsx'
import Prose, { ProseHeading } from '../components/pages/Prose.jsx'
import Icon from '../components/Icon.jsx'

// CLONE_SPEC_PAGES §5 /join-us (copy verbatim from recon/pages/content/join-us.html)

const Ext = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
)

// §5.2 team cards
const TEAM = [
  {
    name: 'Charlie Holtz',
    role: 'CEO and Co-Founder',
    x: 'https://x.com/charlieholtz',
    img: '/assets/img/demos/charlie.jpg',
    bio: [
      <>
        Before Conductor, Charlie worked as a quantitative researcher at a <Ext href="https://point72.com/">hedge fund</Ext>,
        and led growth at Replicate where he created apps that were used by millions. One time he{' '}
        <Ext href="https://web.archive.org/web/20231117033051/https://www.businessinsider.com/david-attenborough-ai-video-hollywood-actors-afraid-sag-aftra-2023-11">
          accidentally struck fear into the heart of Hollywood
        </Ext>
        .
      </>,
      <>
        Charlie started Conductor with Jackson in the summer of 2024 to build the best interface for managing your AIs, eat
        lots of ice cream, and do the best work of our lives.
      </>,
    ],
  },
  {
    name: 'Jackson de Campos',
    role: 'CTO and Co-Founder',
    x: 'https://x.com/jacksondecampos',
    img: '/assets/img/demos/jackson.jpg',
    bio: [
      <>
        Jackson first learned to code in Microsoft Visual Basic 2005, and he's been hooked ever since. Before starting
        Conductor, he built ML infrastructure at Netflix, researched automated negotiating agents at Brown, and, with
        Charlie, built <Ext href="https://shindig.life/">Shindig</Ext>, the first, best, and only way to host a party from the
        command line. In his free time he enjoys reading{' '}
        <Ext href="https://en.wikipedia.org/wiki/Garner%27s_Modern_English_Usage">Garner's Modern English Usage</Ext>.
      </>,
    ],
  },
  {
    name: 'Guillaume Sabran',
    role: 'Founding Engineer',
    x: 'https://x.com/guisabran',
    img: '/assets/pages/join-us/guillaume.png',
    bio: [<>Guillaume worked as a staff engineer at Airbnb, and before that he was at Snap.</>],
  },
  {
    name: 'Lewis Ellis',
    role: 'Engineer',
    x: 'https://x.com/NotTuxedoSam',
    img: '/assets/pages/join-us/lewis.png',
    bio: [
      <>
        Lewis worked at YC. Before that he was at Pave. He likes <Ext href="https://tuxedosam.dev/">penguins</Ext>.
      </>,
    ],
  },
  {
    name: 'Tywen Kelly',
    role: 'Engineer',
    x: 'https://x.com/tywenk',
    img: '/assets/pages/join-us/tywen.png',
    bio: [
      <>
        Tywen is an artist turned engineer. He has imaged{' '}
        <Ext href="https://tywenkelly.com/Lensless-Horizon">data centers</Ext> and wondered about{' '}
        <Ext href="https://e-scapes.blog/posts/worlds-made-without-hands">worlding</Ext>. He has worked in VR, AI, and
        GovTech.
      </>,
    ],
  },
  {
    name: 'Kaden Hyatt',
    role: 'Engineer',
    x: 'https://x.com/kaden_hyatt',
    img: '/assets/pages/join-us/kaden.png',
    bio: [
      <>
        Kaden is studying at the University of Chicago and was previously at Replit. He also co-created the card game{' '}
        <Ext href="https://racetokepler.com">Race to Kepler</Ext>.
      </>,
    ],
  },
  {
    name: 'Sam Lehman',
    role: 'Founding Ops',
    x: 'https://x.com/splehman',
    img: '/assets/pages/join-us/sam.png',
    bio: [
      <>
        Sam wore many hats before donning his Conductor cap. He (literally) built a{' '}
        <Ext href="https://www.instagram.com/fairislebrewing/?hl=en">craft brewery in Seattle</Ext> before serving as Chief
        of Staff at a $10B RIA. He then took a brief detour to get his MBA at MIT Sloan, before spending the next four years
        as a VC. He also moonlights as one of the top coaches in the sport of Ultimate Frisbee (he met Charlie and Jackson
        playing Ultimate at Brown). At Conductor, Sam leads all things operations, ensuring there is always plenty of yogurt
        in the fridge.
      </>,
    ],
  },
]

function TeamCard({ person }) {
  return (
    <article className="not-prose my-4 rounded-lg border border-dashed border-border p-4 first:mt-0 last:mb-0">
      <div className="flex items-start gap-3">
        <img
          alt={`Portrait of ${person.name}`}
          src={person.img}
          className="aspect-square w-12 shrink-0 rounded-md object-cover sm:w-14"
        />
        <div className="min-w-0 flex-1 space-y-3 text-sm leading-6 text-muted-foreground">
          <div className="space-y-0.5 text-base font-medium text-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-x-1.5 sm:gap-y-1 sm:space-y-0">
            <span className="block sm:inline">{person.name}</span>
            <span className="flex items-center gap-1.5 text-muted-foreground sm:inline-flex">
              <span className="hidden sm:inline">·</span>
              <span>{person.role}</span>
              <a
                href={person.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${person.name} on X`}
                className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon src="/assets/pages/join-us/x-logo.svg" className="size-3" />
              </a>
            </span>
          </div>
          <div className="space-y-3 [&_a:hover]:decoration-muted-foreground [&_a]:font-normal [&_a]:text-inherit [&_a]:underline [&_a]:decoration-border [&_a]:underline-offset-2">
            {person.bio.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function JoinUs() {
  return (
    <PageShell
      title="Join us | Conductor"
      description="We're building Conductor in San Francisco and hiring engineers and designers to shape the future of AI-native software development."
    >
      <PageContainer>
        <PageHeader
          title="Join Conductor"
          lead="We're building Conductor in San Francisco and hiring engineers and designers to shape the future of AI-native software development."
        />
        <Prose className="mt-10">
          <p>
            Conductor lets you run a team of coding agents on your Mac. We've grown 10x since January and raised $24M from
            some of the top investors in Silicon Valley. We're used by engineers at leading companies like Linear, Vercel,
            Ramp, Notion, Stripe, and many more.
          </p>
          {/* §5.1 apply card: 1px dashed border, hover bg muted/50 over 150ms */}
          <a
            href="https://www.ycombinator.com/companies/conductor/jobs"
            target="_blank"
            rel="noopener noreferrer"
            className="not-prose my-8 flex items-center gap-3 rounded-lg border border-dashed border-border p-3 text-sm transition-colors hover:bg-muted/50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-apply-tile text-lg text-muted-foreground">
              <Icon src="/assets/pages/join-us/icon-arrow-up-right.svg" className="size-4" />
            </div>
            <div>
              <span className="flex items-center gap-2 font-bold text-foreground">Apply to join us</span>
              <p className="pt-1">We're looking for exceptional engineers and designers to work with us in SF.</p>
            </div>
          </a>
          <ProseHeading as="h2" id="our-plan">
            Our plan
          </ProseHeading>
          <p>
            Coding agents are doing work that junior engineers used to do. Soon they'll be doing senior-engineer work. In
            response, humans are becoming full-time AI-managers.
          </p>
          <p>
            What software will these AI-managers use? Conductor has already created a narrow new product category, the "AI
            orchestrator," and it's already changing how people work. As one engineer at Ambrook told me on a call:
          </p>
          <blockquote>
            <p>
              A huge amount of my work now is wildly parallelized, in a way I've never had to worry about before. It's been a
              while since a dev tool has changed my life [like Conductor did].
            </p>
          </blockquote>
          <p>
            Right now, AI-managers use many tools alongside Conductor. They'll probably use existing coding software (Cursor,
            Warp, GitHub) and tools for human managers (Linear, GitHub, Slack).
          </p>
          <p>
            Of all those tools, we think it's the AI orchestrator that has the best shot at becoming the primary UI that the
            AI-managers will use. Although it's the newest and least-established of those tools, it's the only one built
            ground-up with AI in mind.
          </p>
          <p>
            Designing the first AI orchestrator from the ground up as we build it has been a ton of fun. It feels like a
            perfect match for the skillset of our team: technical chops, customer focus, taste, and speed. And if we win the
            category, Conductor will be a massive company.
          </p>
          <img src="/assets/pages/join-us/about.webp" alt="Conductor team" width="960" height="540" className="h-auto w-full rounded-lg" />
          <ProseHeading as="h2" id="our-team">
            Our team
          </ProseHeading>
          <p>
            One reason we started Conductor was to create a place where we could do the best work of our lives: in person,
            with incredible people, toward a formidable goal, holding each other to the highest standards. Conductor feels
            like an elite sports team.
          </p>
          <p>
            We work in person about five days a week in San Francisco. Learn more about{' '}
            <Ext href="https://conductor-build.notion.site/What-It-s-Like-Working-at-Conductor-29da076bd0f2808bad97e3a4b876c01a">
              what it's like working at Conductor
            </Ext>{' '}
            and <Ext href="https://x.com/search?src=typed_query&q=%40conductor_build">see what we've been building</Ext>.
          </p>
          {TEAM.map((p) => (
            <TeamCard key={p.name} person={p} />
          ))}
        </Prose>
      </PageContainer>
    </PageShell>
  )
}
