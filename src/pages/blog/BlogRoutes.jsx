import { Route, Routes, useParams } from 'react-router-dom'
import NotFound from '../NotFound.jsx'
import BlogIndex from './BlogIndex.jsx'
import BlogPost from './BlogPost.jsx'
import { POSTS } from '../../components/blog/BlogData.js'

function PostRoute() {
  const { slug } = useParams()
  const meta = POSTS.find((p) => p.slug === slug)
  // Original: unknown /blog/<slug> serves the 404 terminal (HTTP 404), no redirect.
  if (!meta) return <NotFound />
  return <BlogPost key={slug} slug={slug} meta={meta} />
}

// Mounted at /blog/* (lazy chunk, see App.jsx).
export default function BlogRoutes() {
  return (
    <Routes>
      <Route index element={<BlogIndex />} />
      <Route path=":slug" element={<PostRoute />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
