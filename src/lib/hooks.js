import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Same semantics as usehooks-ts `useInterval` (used by the original):
// `delay === null` pauses; the interval is only recreated when `delay` changes.
export function useInterval(callback, delay) {
  const saved = useRef(callback)
  useLayoutEffect(() => {
    saved.current = callback
  }, [callback])
  useEffect(() => {
    if (delay === null || delay === undefined) return
    const id = setInterval(() => saved.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])
  return matches
}

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

// M1: the scramble hook exactly as inlined in the original's hero chunk (a vendored
// use-scramble variant). Differences from use-scramble@2.2.15 that matter visually:
// it writes `textContent`, it only (re)starts the rAF loop when `text`/`speed` change,
// and a non-mount text change always plays.
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

export function useScramble(props) {
  const {
    playOnMount = true,
    text = '',
    speed = 1,
    seed = 1,
    scramble = 1,
    overflow = true,
    range = [65, 125],
    onAnimationStart,
    onAnimationFrame,
    onAnimationEnd,
    ignore = [' '],
  } = props
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const step = reduced ? text.length : props.step ?? 1
  const chance = reduced ? 0 : props.chance ?? 1
  const overdrive = !reduced && (props.overdrive ?? true)
  const tick = props.tick ?? 1

  const nodeRef = useRef(null)
  const rafRef = useRef(0)
  const elapsedRef = useRef(0)
  const fpsInterval = 1000 / (60 * speed)
  const stepRef = useRef(0)
  const scrambleIndexRef = useRef(0)
  const controlRef = useRef([])
  const overdriveRef = useRef(0)
  const keep = (value, replace) => (ignore.includes(`${value}`) ? value : replace)

  const draw = () => {
    if (!nodeRef.current) return
    let result = ''
    const c = controlRef.current
    for (let i = 0; i < c.length; i++) {
      const v = c[i]
      if (typeof v === 'number' && v > 0) {
        result += String.fromCharCode(range.length === 2 ? randInt(range[0], range[1]) : range[randInt(0, range.length - 1)])
        if (i <= scrambleIndexRef.current) c[i] = c[i] - 1
      } else if (typeof v === 'string' && (i >= text.length || i >= scrambleIndexRef.current)) {
        result += v
      } else if (v === text[i] && i < scrambleIndexRef.current) {
        result += text[i]
      } else if (v === 0 && i < text.length) {
        result += text[i]
        c[i] = text[i]
      }
    }
    nodeRef.current.textContent = result
    onAnimationFrame?.(result)
    if (result === text) {
      controlRef.current.splice(text.length, controlRef.current.length)
      onAnimationEnd?.()
      cancelAnimationFrame(rafRef.current)
    }
    stepRef.current++
  }

  const onTick = () => {
    const c = controlRef.current
    for (let s = 0; s < step; s++) {
      if (scrambleIndexRef.current < text.length) {
        const i = scrambleIndexRef.current
        const scr = randInt(0, 10) >= (1 - chance) * 10
        c[i] = keep(text[scrambleIndexRef.current], scr ? scramble + randInt(0, Math.ceil(scramble / 2)) : 0)
        scrambleIndexRef.current++
      }
    }
    if (text.length < c.length) {
      c.pop()
      c.splice(text.length, step)
    }
    for (let s = 0; s < step; s++) if (c.length < text.length) c.push(keep(text[c.length + 1], null))
    if (scrambleIndexRef.current !== text.length) {
      for (let s = 0; s < seed; s++) {
        const i = randInt(scrambleIndexRef.current, c.length)
        if (typeof c[i] !== 'number' && c[i] !== undefined) c[i] = keep(c[i], randInt(0, 10) >= (1 - chance) * 10 ? scramble || seed : 0)
      }
    }
  }

  const animate = (time) => {
    if (!speed) return
    rafRef.current = requestAnimationFrame(animate)
    if (overdrive) {
      for (let s = 0; s < step; s++) {
        const max = Math.max(controlRef.current.length, text.length)
        if (overdriveRef.current < max) {
          controlRef.current[overdriveRef.current] = keep(
            text[overdriveRef.current],
            String.fromCharCode(typeof overdrive === 'boolean' ? 95 : overdrive),
          )
          overdriveRef.current++
        }
      }
    }
    if (time - elapsedRef.current > fpsInterval) {
      elapsedRef.current = time
      if (stepRef.current % tick === 0) onTick()
      draw()
    }
  }

  const reset = () => {
    stepRef.current = 0
    scrambleIndexRef.current = 0
    overdriveRef.current = 0
    if (!overflow) controlRef.current = new Array(text.length)
  }

  const animateRef = useRef(animate)
  animateRef.current = animate
  const resetRef = useRef(reset)
  resetRef.current = reset
  const drawRef = useRef(draw)
  drawRef.current = draw
  const playOnMountRef = useRef(playOnMount)
  const prevTextRef = useRef(undefined)

  useEffect(() => {
    resetRef.current()
  }, [text])

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    const play =
      (prevTextRef.current !== undefined && prevTextRef.current !== text) ||
      (prevTextRef.current === undefined && playOnMountRef.current)
    prevTextRef.current = text
    if (!play) {
      controlRef.current = text.split('')
      stepRef.current = text.length
      scrambleIndexRef.current = text.length
      overdriveRef.current = text.length
      drawRef.current()
      return
    }
    if (speed) {
      rafRef.current = requestAnimationFrame((t) => animateRef.current(t))
      return () => cancelAnimationFrame(rafRef.current)
    }
  }, [text, speed])

  return {
    ref: nodeRef,
    replay: () => {
      cancelAnimationFrame(rafRef.current)
      reset()
      onAnimationStart?.()
      rafRef.current = requestAnimationFrame(animate)
    },
  }
}
