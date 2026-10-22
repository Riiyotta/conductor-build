import { Navigate, Route, Routes } from 'react-router-dom'
import ChangelogIndex from './ChangelogIndex.jsx'
import ChangelogPost from './ChangelogPost.jsx'

// Mounted at /changelog/* (lazy chunk, see App.jsx).
export default function ChangelogRoutes() {
  return (
    <Routes>
      <Route index element={<ChangelogIndex />} />
      <Route path="page/:n" element={<ChangelogIndex />} />
      <Route path=":slug" element={<ChangelogPost />} />
      <Route path="*" element={<Navigate to="/changelog" replace />} />
    </Routes>
  )
}
