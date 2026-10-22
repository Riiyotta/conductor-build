import PageShell from './PageShell.jsx'
import PageContainer from './PageContainer.jsx'
import Prose from './Prose.jsx'

// CLONE_SPEC_PAGES §7: privacy / terms. No PageHeader, article has no mt.
export default function LegalLayout({ title, description, children }) {
  return (
    <PageShell title={title} description={description}>
      <PageContainer>
        <Prose>{children}</Prose>
      </PageContainer>
    </PageShell>
  )
}
