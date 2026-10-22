import PageShell from '../components/pages/PageShell.jsx'
import PageContainer from '../components/pages/PageContainer.jsx'
import PageHeader from '../components/pages/PageHeader.jsx'
import Prose from '../components/pages/Prose.jsx'
import HubSpotForm from '../components/pages/HubSpotForm.jsx'

// CLONE_SPEC_PAGES §3 /team-plan (not linked from the nav)
export default function TeamPlan() {
  return (
    <PageShell
      title="Conductor Teams | Conductor"
      description="Team plans are currently invite-only. If you'd like to bring Conductor to your company, fill out the form below and we'll be in touch soon."
    >
      <PageContainer>
        <PageHeader
          width="max-w-2xl"
          title="Conductor Teams"
          lead="Team plans are currently invite-only. If you'd like to bring Conductor to your company, fill out the form below and we'll be in touch soon."
        />
        <Prose maxWidth="!max-w-2xl" className="mt-10">
          {/* Original quirk (§3): the form lives in a 450px scroll box and its -40px top margin clips
              the form's own top padding; the rest of the form is only reachable by scrolling the box. */}
          <div className="h-[450px] overflow-y-auto">
            <HubSpotForm
              variant="team-plan"
              formId="a7817add-03f3-49dc-9ffc-16c10009e49a"
              className="not-prose -mt-10"
            />
          </div>
        </Prose>
      </PageContainer>
    </PageShell>
  )
}
