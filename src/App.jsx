import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { DownloadDialogProvider } from './components/DownloadDialog.jsx'
import { InternalLinkInterceptor, ScrollManager } from './components/pages/RouterHelpers.jsx'
import usePageMeta from './components/pages/usePageMeta.js'
import Home from './pages/Home.jsx'
import Pricing from './pages/Pricing.jsx'
import Enterprise from './pages/Enterprise.jsx'
import TeamPlan from './pages/TeamPlan.jsx'
import Slack from './pages/Slack.jsx'
import JoinUs from './pages/JoinUs.jsx'
import Brandkit from './pages/Brandkit.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import NotFound from './pages/NotFound.jsx'
import DocsRoute from './pages/docs/DocsRoute.jsx'

// Changelog: own lazy chunk (index.json + routes); post bodies are further split per post.
const ChangelogRoutes = lazy(() => import('./pages/changelog/ChangelogRoutes.jsx'))

function HomeRoute() {
  usePageMeta(
    'Conductor - Run a team of coding agents in the cloud',
    'Run coding agents in isolated cloud sandboxes with Conductor Cloud.',
  )
  return <Home />
}

export default function App() {
  return (
    <DownloadDialogProvider>
      <ScrollManager />
      <InternalLinkInterceptor />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/enterprise" element={<Enterprise />} />
        <Route path="/team-plan" element={<TeamPlan />} />
        <Route path="/slack" element={<Slack />} />
        <Route path="/join-us" element={<JoinUs />} />
        <Route path="/brandkit" element={<Brandkit />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        {/* Docs / changelog (built later from src/content/): add nested routes here, e.g.
            <Route path="/docs/*" element={<Docs />} /> and <Route path="/changelog/*" element={<ChangelogPage />} />.
            Until then they fall through to the 404. */}
        <Route path="/docs/*" element={<DocsRoute />} />
        <Route
          path="/changelog/*"
          element={
            <Suspense fallback={null}>
              <ChangelogRoutes />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DownloadDialogProvider>
  )
}
