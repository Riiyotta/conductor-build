import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Scroll to top on route change; if the URL has a hash (e.g. footer "Team" → /join-us#our-team,
// heading anchors), scroll that element into view instead (headings carry scroll-m-28).
export function ScrollManager() {
  const { pathname, hash } = useLocation()
  useLayoutEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) {
        el.scrollIntoView()
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

// Makes plain same-origin <a href="/..."> links inside components this agent doesn't own
// (homepage Hero / Sandbox / Anywhere / Changelog bodies) navigate client-side, without editing
// those files. Skips modified clicks, target/download links, hash-only links and file URLs
// (/assets/..., /.well-known/...*.md, zips), which must stay real requests.
export function InternalLinkInterceptor() {
  const navigate = useNavigate()
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self')) return
      const href = a.getAttribute('href')
      if (!href || !href.startsWith('/') || href.startsWith('//')) return
      const url = new URL(href, window.location.origin)
      if (/\.[a-z0-9]+$/i.test(url.pathname) || url.pathname.startsWith('/assets/')) return
      e.preventDefault()
      navigate(url.pathname + url.search + url.hash)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [navigate])
  return null
}
