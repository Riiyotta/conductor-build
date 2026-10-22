import { useLayoutEffect } from 'react'

// ScrollManager handles hashes at navigation time, but changelog bodies load lazily, so an anchor
// like /changelog#0-90-0 only exists once the content is in. Re-apply the hash then.
export function useScrollToHashWhenReady(hash, ready) {
  useLayoutEffect(() => {
    if (!ready || !hash) return
    const el = document.getElementById(decodeURIComponent(hash.slice(1)))
    if (el) el.scrollIntoView()
  }, [hash, ready])
}
