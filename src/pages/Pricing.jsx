import { Link } from 'react-router-dom'
import PageShell from '../components/pages/PageShell.jsx'
import PageContainer from '../components/pages/PageContainer.jsx'
import Logos from '../components/Logos.jsx'
import { useDownloadDialog } from '../components/DownloadDialog.jsx'

// CLONE_SPEC_PAGES §1 /pricing

// §1.2 buttons have no transition class: hover is instant.
const BTN_BASE =
  'inline-flex h-9 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-4 text-xs font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2'
const BTN_DARK = `${BTN_BASE} bg-foreground text-background hover:bg-foreground/90`
const BTN_OUTLINE = `${BTN_BASE} cursor-pointer border border-border bg-background text-foreground hover:bg-secondary`

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    cta: { label: 'Download', download: true },
    items: [
      'Run multiple coding agents in parallel',
      'Local workspaces on your Mac',
      'Integrate with the newest frontier and open source models',
      'Bring your own subscriptions and keys',
    ],
  },
  {
    name: 'Pro',
    badge: 'Most popular',
    price: '$50',
    suffix: '/mo',
    cta: { label: 'Get Pro', href: 'https://app.conductor.build/pro' },
    lead: 'Everything in Free, plus:',
    items: [
      'Conductor Cloud and a bunch of cloud workspace hours',
      'Live collaboration with up to 5 Pro users',
      'Conductor API',
      'Conductor mobile app',
    ],
  },
  {
    name: 'Teams',
    price: '$60',
    suffix: '/mo/user',
    cta: { label: 'Get Teams', href: 'https://app.conductor.build/teams?interval=monthly' },
    lead: 'Everything in Pro, plus:',
    items: ['Live collaboration for teams of any size', 'Admin portal', 'Centralized billing'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cta: { label: 'Learn more', to: '/enterprise' },
    lead: 'Everything in Teams, plus:',
    items: [
      'Data processing agreement (DPA)',
      'Purchase-order billing',
      'SAML SSO, SCIM',
      'Custom security and privacy settings',
      'SLA and dedicated support channels',
    ],
  },
]

function PlanButton({ cta }) {
  const { open } = useDownloadDialog()
  if (cta.download)
    return (
      <button type="button" onClick={open} className={BTN_OUTLINE}>
        {cta.label}
      </button>
    )
  if (cta.to)
    return (
      <Link to={cta.to} className={BTN_DARK}>
        {cta.label}
      </Link>
    )
  return (
    <a href={cta.href} className={BTN_DARK}>
      {cta.label}
    </a>
  )
}

function PlanCard({ plan }) {
  return (
    <section className="relative flex h-full flex-col rounded-xl border border-border bg-background p-6">
      {plan.badge && (
        <div className="absolute -top-3 left-5 inline-flex items-center rounded-lg border border-tip-secondary-border bg-tip-secondary px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-tip-muted">
          {plan.badge}
        </div>
      )}
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{plan.name}</h2>
      <div className="mt-4 min-h-12">
        <p className="flex items-baseline gap-1 text-3xl font-semibold tracking-tight text-foreground">
          {plan.price}
          {plan.suffix && (
            <span className="text-sm font-normal tracking-normal text-muted-foreground">{plan.suffix}</span>
          )}
        </p>
      </div>
      <div className="mt-6">
        <PlanButton cta={plan.cta} />
      </div>
      <div className="mt-8">
        {plan.lead && <p className="mb-3 text-xs font-medium text-foreground">{plan.lead}</p>}
        <ul className="space-y-2.5">
          {plan.items.map((item) => (
            <li key={item} className="grid grid-cols-[auto_1fr] gap-x-2 text-xs leading-5 text-muted-foreground">
              <span aria-hidden="true">└</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// §1.3 answer links: muted, underline currentColor offset 4, hover → foreground (instant).
const A = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
    {children}
  </a>
)

// §1.3 FAQ, verbatim from recon/pages/content/pricing.html (static, not an accordion).
const FAQ = [
  ['How do I get access to Cloud workspaces?', [<>Cloud workspaces are available to users on Pro, Teams, or Enterprise plans.</>]],
  [
    'What are the differences between Pro, Teams, and Enterprise plans?',
    [
      <>
        Our <em>Pro plan</em> is for individual users who want to get the most out of Conductor. Pro gets you access to cloud
        workspaces and all of our latest features like the Conductor API, our mobile app, and a whole lot more coming soon.
        Additionally, users with a Pro plan can create shared orgs with up to 5 total Pro users to collaborate live with
        Conductor Multiplayer.
      </>,
      <>
        Our <em>Team plan</em> gets you all of Pro’s features to use across your company. And now with Conductor Multiplayer,
        users in the same Conductor org can collaborate live by sharing workspaces and prompting agents in real-time
        together. Our Team plan also provides centralized billing and an admin portal to manage user roles within your org.
      </>,
      <>
        Our <em>Enterprise plan</em> has all of Teams’ features with the additional security and privacy controls large
        organizations expect like automated user provisioning, SLA for dedicated support, and fine-grained security
        controls.
      </>,
    ],
  ],
  [
    'Can I have both a Pro plan and a Team plan?',
    [
      <>
        Yes. Pro is billed per person and lets you create cloud orgs with up to 5 Pro users total. It’s a good fit for small
        groups that don’t need centralized billing.
      </>,
      <>
        Team is billed per company. A Team seat doesn’t include Pro, so if you also want small cloud orgs outside your
        company, you’ll need a separate Pro plan.
      </>,
    ],
  ],
  [
    'Do I have to use API keys to set up inference in cloud workspaces?',
    [<>No, just like local Conductor, you can bring your own subscriptions and/or API keys for cloud workspaces.</>],
  ],
  [
    'Do I have to pay an additional fee for cloud workspaces?',
    [<>Not right now, but we plan to introduce usage-based pricing for cloud compute in the future.</>],
  ],
  [
    'How are cloud workspaces different from local workspaces?',
    [
      <>
        When you create a cloud workspace, we automatically create a Vercel sandbox for your agent to run in. Your agent
        works in the cloud so that even if you close the Conductor app, work continues.
      </>,
      <>
        In contrast, local workspace sessions run on your local machine. When your machine shuts off or you close the app,
        sessions terminate.
      </>,
    ],
  ],
  ['What are the hardware specs of the sandboxes?', [<>Each machine has an 8 core CPU with 16GB of RAM.</>]],
  [
    'What comes pre-installed on the sandboxes?',
    [
      <>
        Each machine runs Amazon Linux 2023 with the following software pre-installed: Node.js 24, npm, pnpm, Python 3, git,
        GitHub CLI, jq, ripgrep, git-lfs, tmux, and vim. Users are able to install additional software to their machines by
        configuring their cloud settings.
      </>,
    ],
  ],
  [
    'Where can I learn more about Vercel sandboxes?',
    [
      <>
        <A href="https://vercel.com/docs/sandbox">https://vercel.com/docs/sandbox</A>. Conductor Cloud was built in{' '}
        <A href="https://vercel.com/customers/how-conductor-moved-parallel-coding-agents-from-the-laptop-to-the-cloud-with-vercel-sandbox">
          close collaboration with Vercel
        </A>
        .
      </>,
    ],
  ],
  [
    'Where are cloud workspaces hosted?',
    [
      <>
        Our cloud workspaces are hosted in Vercel sandboxes based in the{' '}
        <A href="https://vercel.com/docs/regions">us-east-1 region</A>.
      </>,
    ],
  ],
  [
    'Does Conductor have access to my data in cloud workspaces?',
    [
      <>
        Yes. Unlike with local Conductor sessions, chat messages sent in cloud workspaces are stored on Conductor’s servers.
      </>,
    ],
  ],
  [
    'Can you explain why data privacy is different between Cloud and Local Conductor?',
    [
      <>
        With local Conductor, your messages are sent directly to your coding model provider, and session data is stored on
        your device. Conductor never accesses your coding inputs / outputs.
      </>,
      <>
        With Cloud Conductor, sessions run in managed cloud sandboxes rather than on your device. As a result, Conductor must
        store your session inputs and outputs on our servers to facilitate activity in cloud workspaces.
      </>,
    ],
  ],
  [
    'Has Conductor completed a SOC 2 Type II audit?',
    [
      <>
        Yes. Conductor holds a SOC 2 Type II attestation. The full SOC 2 audit and our annual penetration test reports are
        available upon request through our trust center: <A href="https://trust.conductor.build/">trust.conductor.build</A>
      </>,
    ],
  ],
  [
    'Can I use my own cloud machines instead of Conductor’s?',
    [
      <>
        Not at the moment, but our team is hard at work building a self-hosted cloud offering. If you are interested in
        exploring this as part of an Enterprise plan, please reach out to us here:{' '}
        <A href="https://www.conductor.build/enterprise">https://www.conductor.build/enterprise</A>
      </>,
    ],
  ],
]

export default function Pricing() {
  return (
    <PageShell
      title="Pricing | Conductor"
      description="Choose the Conductor plan that fits how you and your team work."
    >
      <PageContainer wide>
        <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Pricing</h1>
        <div className="mx-auto mt-10 max-w-7xl">
          <div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {PLANS.map((p) => (
                <PlanCard key={p.name} plan={p} />
              ))}
            </div>
            <div className="mt-10 sm:mt-14">
              <Logos />
            </div>
            <section aria-label="Pricing FAQ" className="px-8 pt-8 text-sm sm:pt-10">
              <div className="mx-auto max-w-xl">
                <dl className="space-y-6">
                  {FAQ.map(([q, answer]) => (
                    <div key={q}>
                      <dt className="font-semibold text-foreground">{q}</dt>
                      <dd className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 text-muted-foreground">
                        <span aria-hidden="true">└</span>
                        <div className="space-y-3">
                          {answer.map((para, i) => (
                            <p key={i}>{para}</p>
                          ))}
                        </div>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          </div>
        </div>
      </PageContainer>
    </PageShell>
  )
}
