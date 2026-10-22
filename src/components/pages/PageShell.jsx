import Header from '../Header.jsx'
import Footer from '../Footer.jsx'
import usePageMeta from './usePageMeta.js'
import './pages.css'

// CLONE_SPEC_PAGES §0.1: subpage shell. The outer wrapper computes MONO (body is mono), the header
// carries its own font-sans, page content sits in `main.bg-background.font-sans`, and the footer
// sits outside the sans wrapper, so it renders in real mono.
export default function PageShell({ title, description, children }) {
  usePageMeta(title, description)
  return (
    // Live: <body class="flex min-h-screen flex-col"> > main.flex.flex-1.flex-col (header + page) + footer,
    // so on short pages / tall viewports the footer sits at the viewport bottom. #root has no layout
    // in the clone, so the min-h-screen flex column lives here (homepage untouched).
    <div className="flex min-h-screen flex-col font-mono">
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="bg-background font-sans">{children}</main>
      </div>
      <Footer mono />
    </div>
  )
}
