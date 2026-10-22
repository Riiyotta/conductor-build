import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import usePageMeta from '../components/pages/usePageMeta.js'

// 404: replica of the original's `NotFoundTerminal` (measured live on /this-does-not-exist, and the
// component logic ported from the shipped chunk). No site header / footer: the whole viewport is a
// black <a href="/"> with a retro terminal that types itself out (4–10ms per character, 25ms between
// lines), a CRT scanline overlay and a block cursor blinking every 530ms. Clicking anywhere goes home.
// The original keeps the homepage title / description and adds <meta name="robots" content="noindex">.
const VERSION = '0.91.0'
const RULE = '═'.repeat(62)

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])
}

export default function NotFound() {
  usePageMeta(
    'Conductor - Run a team of coding agents in the cloud',
    'Run coding agents in isolated cloud sandboxes with Conductor Cloud.',
  )
  useNoIndex()

  const script = useMemo(
    () => [
      '',
      `CONDUCTOR OS v${VERSION}`,
      'Copyright (c) 2026 Melty Labs, Inc.',
      '',
      'C:\\> navigate /page',
      '',
      'ERROR 404: FILE NOT FOUND',
      '',
      'The system cannot find the path specified.',
      'Please verify the path and try again.',
      '',
      'Press any key to return home...',
    ],
    [],
  )
  const [lines, setLines] = useState([])
  const [line, setLine] = useState(0)
  const [char, setChar] = useState(0)
  const [cursorOn, setCursorOn] = useState(true)

  useEffect(() => {
    if (line >= script.length) return
    const text = script[line]
    if (char < text.length) {
      const t = setTimeout(() => {
        setLines((prev) => {
          const next = [...prev]
          next[line] = (next[line] || '') + text[char]
          return next
        })
        setChar((c) => c + 1)
      }, 4 + 6 * Math.random())
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setLine((l) => l + 1)
      setChar(0)
      setLines((prev) => [...prev, ''])
    }, 25)
    return () => clearTimeout(t)
  }, [line, char, script])

  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 530)
    return () => clearInterval(id)
  }, [])

  const done = line >= script.length
  const cursor = <span className={cursorOn ? 'opacity-100' : 'opacity-0'}>█</span>

  return (
    <Link
      to="/"
      className="block flex min-h-screen cursor-pointer items-start justify-center bg-black pt-24 focus:outline-none"
    >
      <div className="p-8 font-mono text-sm sm:text-base">
        <div className="pointer-events-none fixed inset-0 z-10 bg-scanlines" />
        <div className="text-white">
          <div className="mb-0">╔{RULE}╗</div>
          {lines.map((text, i) => (
            <div key={i} className="min-h-[1.5em]">
              {text}
              {i === line && !done && cursor}
            </div>
          ))}
          {done && cursor}
          <div className="mt-0">╚{RULE}╝</div>
        </div>
      </div>
    </Link>
  )
}
