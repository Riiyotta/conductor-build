import { Suspense, lazy } from 'react'

// Route entry for /docs/*: the whole docs shell (and its content chunks) is code-split away from the
// marketing bundle.
const DocsPage = lazy(() => import('./DocsPage.jsx'))

export default function DocsRoute() {
  return (
    <Suspense fallback={null}>
      <DocsPage />
    </Suspense>
  )
}
