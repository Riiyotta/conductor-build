import { Fragment, createContext, useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import Lucide, { RawSvg } from './icons.jsx'
import Collapsible from './Collapsible.jsx'
import { SITE_COMPONENTS } from './SiteComponents.jsx'
import { CodeFigure } from './CodeFigure.jsx'

// Renders the typed body tree from src/content/docs/<slug>.json (CLONE_SPEC_DOCS §6.1) with the
// fumadocs component styling of §2–§3.

/* Original utility classes carried in `attrs['data-class']` (kept here so Tailwind generates them):
   flex items-center gap-2 | inline-flex flex-wrap items-center gap-x-2 gap-y-1 | inline-flex items-center gap-2 |
   inline-flex items-center gap-1.5 | flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-foreground |
   not-prose my-8 space-y-10 | flex items-center gap-1.5 font-medium text-foreground |
   flex flex-col gap-3 pb-5 md:flex-row md:items-start md:justify-between | flex min-w-0 items-center gap-2 */

export const PageContext = createContext({ body: [] })

const SVG_ATTR = {
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'stroke-opacity': 'strokeOpacity',
  'fill-opacity': 'fillOpacity',
}

function isRouterHref(href) {
  if (!href || !href.startsWith('/') || href.startsWith('//')) return false
  const path = href.split(/[?#]/)[0]
  return !/\.[a-z0-9]+$/i.test(path) && !path.startsWith('/assets/')
}

function elementProps(node) {
  const props = {}
  for (const [k, v] of Object.entries(node.attrs || {})) {
    if (k === 'data-class') {
      // These grouped section blocks lost their inner classes in the scrape; dropping `not-prose`
      // lets their headings/paragraphs use the prose styles (see docs.css .docs-section-group).
      props.className = v === 'not-prose my-8 space-y-10' ? 'docs-section-group my-8 space-y-10' : v
    } else if (k === 'class') props.className = v
    else props[SVG_ATTR[k] || k] = v
  }
  return props
}

const isOr = (c) => c.type === 'text' && c.value.trim() === 'or'

function Element({ node }) {
  const { tag } = node
  const props = elementProps(node)
  // Shortcut alternatives ("⌘ B or [") lost their muted wrapper around "or" in the scrape.
  if (tag === 'span' && props.className === 'inline-flex items-center gap-2' && node.children.some(isOr)) {
    return (
      <span {...props}>
        {node.children.map((c, i) =>
          isOr(c) ? (
            <span key={i} className="text-xs text-muted-foreground">
              or
            </span>
          ) : (
            <Node key={i} node={c} />
          ),
        )}
      </span>
    )
  }
  const children = <Nodes nodes={node.children} />
  if (tag === 'a') {
    const { href, ...rest } = props
    if (isRouterHref(href) && !rest.target)
      return (
        <Link to={href} {...rest}>
          {children}
        </Link>
      )
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  }
  if (tag === 'path') return <path {...props} />
  if (tag === 'svg') return <svg className="docs-content-svg" {...props}>{children}</svg>
  if (tag === 'ol' && props.start) props.start = Number(props.start)
  const Tag = tag
  return <Tag {...props}>{children}</Tag>
}

export function Nodes({ nodes }) {
  if (!nodes) return null
  return nodes.map((n, i) => <Node key={i} node={n} />)
}

function Node({ node }) {
  switch (node.type) {
    case 'text':
      return node.value
    case 'element':
      return <Element node={node} />
    case 'heading':
      return <Heading node={node} />
    case 'code':
      return <CodeBlock node={node} />
    case 'codeTabs':
      return <CodeTabs node={node} />
    case 'callout':
      return <Callout node={node} />
    case 'steps':
      return (
        <div className="fd-steps">
          {node.children.map((s, i) => (
            <div key={i} className="fd-step">
              <Nodes nodes={s.children} />
            </div>
          ))}
        </div>
      )
    case 'accordions':
      return <Accordions node={node} />
    case 'table':
      return <Table node={node} />
    case 'image':
      return <ImageFrame node={node} />
    case 'video':
      return <VideoFrame node={node} />
    case 'youtube':
      return <YouTube node={node} />
    case 'cards':
      return <Cards node={node} />
    case 'shortcut':
      return <Shortcut node={node} />
    case 'kbd':
      return <kbd>{node.value}</kbd>
    case 'icon':
      return <RawSvg svg={node.svg} className="inline-flex [&_svg]:size-4" />
    case 'component': {
      const C = SITE_COMPONENTS[node.name]
      return C ? <C {...node.props} /> : null
    }
    default:
      return null
  }
}

// ---------- §2 headings ----------
function Heading({ node }) {
  const Tag = `h${node.depth}`
  return (
    <Tag id={node.id} className="flex scroll-mt-28 flex-row items-center gap-2">
      <a data-card="" href={`#${node.id}`} className="docs-heading-anchor peer">
        <Nodes nodes={node.children} />
      </a>
      <Lucide name="link" className="docs-heading-icon size-3.5 shrink-0 text-muted-foreground" />
    </Tag>
  )
}

// ---------- §3.1 code block ----------
function CodeBlock({ node, inTab = false }) {
  return (
    <CodeFigure title={node.title} icon={node.icon} copyText={node.code} inTab={inTab}>
      <pre>
        <code>
          {node.lines.map((line, i) => (
            <span key={i} className="line">
              {line.tokens.map((t, j) => (
                <span
                  key={j}
                  style={t.color ? { '--shiki-light': t.color, '--shiki-light-font-style': t.fontStyle } : undefined}
                >
                  {t.text}
                </span>
              ))}
            </span>
          ))}
        </code>
      </pre>
    </CodeFigure>
  )
}

// ---------- §3.2 code tabs ----------
function CodeTabs({ node }) {
  const [value, setValue] = useState(node.defaultValue ?? node.tabs[0]?.value)
  return (
    <div className="my-4 rounded-xl border border-border bg-background">
      <div role="tablist" className="flex flex-row overflow-x-auto px-2 text-muted-foreground">
        {node.tabs.map((tab) => {
          const active = tab.value === value
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              data-state={active ? 'active' : 'inactive'}
              onClick={() => setValue(tab.value)}
              className={`group relative inline-flex items-center gap-2 whitespace-nowrap px-2 py-1.5 text-sm font-medium transition-colors hover:text-foreground ${
                active ? 'text-primary hover:text-primary' : ''
              }`}
            >
              {tab.label}
              <div className={`absolute inset-x-2 bottom-0 h-px ${active ? 'bg-primary' : ''}`} />
            </button>
          )
        })}
      </div>
      {node.tabs
        .filter((tab) => tab.value === value)
        .map((tab) => (
          <div key={tab.value} role="tabpanel">
            {tab.children.map((c, i) =>
              c.type === 'code' ? <CodeBlock key={i} node={c} inTab /> : <Node key={i} node={c} />,
            )}
          </div>
        ))}
    </div>
  )
}

// ---------- §3.3 callout ----------
function Callout({ node }) {
  const warning = node.calloutType === 'warning'
  return (
    <div
      role="note"
      aria-label={warning ? 'Warning note' : 'Info note'}
      className="docs-callout not-prose my-6 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1.5 rounded-2xl border px-3.5 py-2.5 sm:px-4 sm:py-3"
    >
      <div className="docs-callout-icon mt-0.5 flex size-7 items-center justify-center rounded-full border">
        <Lucide name={warning ? 'triangle-alert' : 'info'} className="size-5" />
      </div>
      <div className="min-w-0">
        <span className="sr-only">{warning ? 'Warning: ' : 'Info: '}</span>
        <div className="docs-callout-description text-[0.95rem] leading-[1.75]">
          <Nodes nodes={node.children} />
        </div>
      </div>
    </div>
  )
}

// ---------- §3.5 accordions ----------
function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

function Accordions({ node }) {
  const items = node.children.map((c) => ({ ...c, id: c.id || slugify(c.title) }))
  const [openId, setOpenId] = useState(() => {
    const h = typeof window !== 'undefined' ? decodeURIComponent(window.location.hash.slice(1)) : ''
    return items.some((i) => i.id === h) ? h : null
  })
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
      {items.map((item) => {
        const open = item.id === openId
        return (
          <div key={item.id} id={item.id} className="scroll-mt-24" data-state={open ? 'open' : 'closed'}>
            <h3 className="not-prose flex flex-row items-center font-medium text-foreground">
              <button
                type="button"
                aria-expanded={open}
                data-state={open ? 'open' : 'closed'}
                onClick={() => setOpenId(open ? null : item.id)}
                className="group flex flex-1 items-center gap-2 px-3 py-2.5 text-start focus-visible:outline-none"
              >
                <Lucide
                  name="chevron-right"
                  className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    open ? 'rotate-90' : ''
                  }`}
                />
                {item.title}
              </button>
            </h3>
            <Collapsible open={open} className="overflow-hidden" duration={200} easing="ease-out" closedOpacity={0.5}>
              <div className="prose-no-margin px-4 pb-2 text-[0.9375rem]">
                <Nodes nodes={item.children} />
              </div>
            </Collapsible>
          </div>
        )
      })}
    </div>
  )
}

// ---------- §3.6 table ----------
function Table({ node }) {
  return (
    <div className="docs-table-shell not-prose my-8 overflow-hidden rounded-[0.9rem]">
      <div className="docs-table-scroll overflow-x-auto" role="region" tabIndex={0}>
        <table className="docs-table w-full min-w-[38rem] border-separate border-spacing-0 text-sm">
          {node.caption && <caption>{node.caption}</caption>}
          <thead>
            <tr>
              {node.head.map((c, i) => (
                <th key={i} style={c.align ? { textAlign: c.align } : undefined}>
                  <Nodes nodes={c.children} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {node.rows.map((row, r) => (
              <tr key={r}>
                {row.map((c, i) => (
                  <td key={i} style={c.align ? { textAlign: c.align } : undefined}>
                    <Nodes nodes={c.children} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------- §3.7 image / video ----------
function ImageFrame({ node }) {
  return (
    <figure className="docs-asset-shell not-prose my-10 w-full">
      <div className="docs-asset-frame">
        <img
          className="docs-asset-media docs-asset-image"
          src={node.src}
          alt={node.alt}
          width={node.width}
          height={node.height}
          loading="lazy"
          decoding="async"
        />
      </div>
    </figure>
  )
}

function VideoFrame({ node }) {
  return (
    <figure className="docs-asset-shell not-prose my-10 w-full">
      <div className="docs-asset-frame">
        <video
          className="docs-asset-media docs-asset-video"
          src={node.src}
          aria-label={node.alt}
          controls={node.controls}
          autoPlay={node.autoPlay}
          muted={node.muted}
          loop={node.loop}
          playsInline={node.playsInline}
          preload="metadata"
        />
      </div>
      {node.summary && <figcaption className="sr-only">{node.summary}</figcaption>}
    </figure>
  )
}

// ---------- §3.8 YouTube (lite-youtube, click to play) ----------
function YouTube({ node }) {
  const [active, setActive] = useState(false)
  const embed = (
    <div data-ntpc="YouTubeEmbed">
      <lite-youtube
        videoid={node.videoId}
        class={active ? 'lyt-activated' : undefined}
        style={{ backgroundImage: `url("${node.thumbnail}")` }}
        onClick={() => setActive(true)}
      >
        {active ? (
          <iframe
            width="560"
            height="315"
            title={node.title}
            src={`https://www.youtube-nocookie.com/embed/${node.videoId}?autoplay=1&playsinline=1`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" className="lyt-playbtn" aria-label={node.title}>
            <span className="lyt-visually-hidden">{node.title}</span>
          </button>
        )}
      </lite-youtube>
    </div>
  )
  if (!node.framed) return <div className="not-prose my-10">{embed}</div>
  return (
    <div className="not-prose my-10 overflow-hidden rounded-[1.75rem] border border-border/80 bg-muted/55 p-2.5">
      {embed}
    </div>
  )
}

// ---------- §3.9 cards ----------
function Cards({ node }) {
  return (
    <div
      className={`not-prose my-8 grid grid-cols-1 gap-5 md:gap-6 ${
        node.columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
      }`}
    >
      {node.children.map((card, i) => {
        // The scraper stored the Reddit card's trailing arrow in `icon` next to its "r" text badge.
        const leading = card.iconText ? null : card.icon
        const trailing = card.iconText ? card.icon : card.trailingIcon
        const ext = card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
        const inner = (
          <>
            {card.iconText ? (
              <span
                aria-hidden="true"
                className="flex size-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-medium leading-none text-muted-foreground"
              >
                {card.iconText}
              </span>
            ) : (
              leading && <RawSvg svg={leading} className="flex shrink-0 text-muted-foreground [&_svg]:size-4" />
            )}
            <span>{card.title}</span>
            {trailing && <RawSvg svg={trailing} className="ml-auto flex shrink-0 text-muted-foreground [&_svg]:size-4" />}
          </>
        )
        const cls = 'mb-3 flex items-center gap-3 text-sm font-medium text-foreground no-underline hover:no-underline'
        return (
          <article
            key={i}
            data-card=""
            className="rounded-3xl border border-border/80 bg-muted/35 p-5 transition-colors duration-200 hover:border-foreground/15 hover:bg-muted/70 md:p-6"
          >
            {isRouterHref(card.href) && !card.external ? (
              <Link to={card.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <a href={card.href} className={cls} {...ext}>
                {inner}
              </a>
            )}
            <div className="docs-card-body text-sm leading-6 text-foreground/[.72]">
              <Nodes nodes={card.children} />
            </div>
          </article>
        )
      })}
    </div>
  )
}

// ---------- §3.10 keyboard shortcut ----------
function Shortcut({ node }) {
  return (
    <span className="docs-shortcut">
      <span className="sr-only">{node.label}</span>
      {node.keys.map((k, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="docs-shortcut-separator" aria-hidden="true">
              {node.separator || '+'}
            </span>
          )}
          <kbd className="docs-key" aria-hidden="true">
            {/* Empty key = the Return glyph, an inline icon on the original (stripped by the scraper). */}
            {k === '' ? <Lucide name="corner-down-left" className="size-3.5" /> : k}
          </kbd>
        </Fragment>
      ))}
    </span>
  )
}

export function usePageBody() {
  return useContext(PageContext).body
}
