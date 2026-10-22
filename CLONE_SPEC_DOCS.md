Source: https://www.conductor.build/

# Conductor docs and changelog: clone spec (routes `/docs/*`, `/changelog`, `/changelog/page/:n`, `/changelog/:slug`)

Measured on 2026-10-22 with a private headless Chromium (Playwright 1.63, deviceScaleFactor 1) at 1440x900, 1280x900, 1024, 800 and 390x844. I used getComputedStyle, getBoundingClientRect, getAnimations and pseudo-element styles, and also read the shipped CSS (`/_next/static/immutable/chunks/25q8hi5g3_2_6.css`, the same file as the homepage) and the RSC flight payloads.

This file extends `CLONE_SPEC.md`. The header, footer, base color tokens, fonts quirk, radii and the default transition are documented there, and **are reused unchanged** unless this file states a delta.

Supporting files:
- Raw measurement dumps: `recon/docs/raw/*.json`. Each dump has selector, computed style and rect. The key files are `docs-1440.json`, `docs-1280/1024/800.json`, `comp-*.json` (prose components), `mob-*.json`, `drawer.json`, `side-1440.json`, `search-*.json`, `tabpop.json`, `toc.json` and `cl-*.json`.
- Screenshots: `recon/docs/*.png` (1440 and 390 for every sampled page, full-page).
- The relevant CSS rules, verbatim from the shipped stylesheet (prose, shiki, fd-steps, docs-table, docs-callout, docs-asset, docs-key and keyframes): `recon/docs/docs-css-rules-excerpt.css`.
- Server-rendered HTML of the site-specific interactive components: `recon/docs/components/*.ssr.html`.
- Content: `src/content/**`, produced by `scripts/scrape-content.mjs`. Media manifest: `ASSETS_DOCS.md` and `src/content/media-manifest.json`.

---

## 0. Framework / architecture findings

- **Same Next.js app as the marketing site.** It uses the same `25q8hi5g3_2_6.css`, the same Turbopack chunk naming (`/_next/static/immutable/chunks/*.js`), the same `<header>`/footer and the same `html.light`. The response headers are the same: `x-vercel-cache`, `x-nextjs-prerender: 1`, `vary: rsc, next-router-state-tree…`, behind Cloudflare.
- **The docs shell is Fumadocs (fumadocs-ui, "notebook/docs" layout), heavily themed.** Evidence:
  - The ids `#nd-docs-layout`, `#nd-sidebar`, `#nd-sidebar-mobile`, `#nd-page`, `#nd-toc`, `#nd-subnav`.
  - The `--color-fd-*` and `--fd-*` variables, the `fd-*` keyframes and `fd-steps`/`fd-step`.
  - The RSC client components `DocsPage`, `DocsTitle`, `DocsDescription`, `DocsBody`, `CodeBlock`, `Pre`, `CodeBlockTabs*`, `Accordions`, `Accordion`.
  - The page tree, with `type: root|folder|page|separator` and `root: true` sidebar tabs.
  - Search is Fumadocs' server endpoint `GET /api/search?query=…`.
- The changelog is **not** Fumadocs. It is a custom Next page that uses the marketing header (`HomeLayout`/`UnifiedHomeHeader`) and the client components `ChangelogContent` (index) and `SingleChangelogEntry` (post). The changelog body is markdown, rendered with per-tag Tailwind classes.
- Code highlighting is Shiki with the dual theme `github-light`/`github-dark`. Only the light colours apply (`--shiki-light`).
- Each page also exposes markdown at `<url>.md` (and `/llms.txt`, `/llms-full.txt`, `/changelog.md`). The scraper stores this as `markdown` alongside the structured body.
- The theme is light only (`html.light`). The `.dark` values exist in the CSS, but the docs and changelog pages never activate them.

### 0.1 Fonts (delta from CLONE_SPEC §0.1, important)
- **The docs shell renders in the system sans stack**: `ui-sans-serif, system-ui, sans-serif`. This covers the sidebar, breadcrumb, H1, the description and the prev/next cards.
- **Docs prose (`.prose`) uses a different stack**: `Geist, -apple-system, "system-ui", "Segoe UI", sans-serif, ui-sans-serif, system-ui, sans-serif`.
  - The prose rule is `.prose{font-family:var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif}`, where `--font-geist-sans` is `var(--font-geist-sans-source, Geist), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. `--font-geist-sans-source` is not defined at that point.
  - There is **no `@font-face` named `Geist`** (only `geistSans`). The result is that prose falls back to `-apple-system`, which is SF Pro on macOS, the same as the shell.
  - Copy that stack exactly. Text would only render in Geist on machines where Geist is installed locally.
  - The search dialog, the root-tab popover and Radix popovers also use the Geist stack.
- **Mono** is `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`. It is used for code blocks, inline code, `kbd.docs-key`, the search `⌘ K` kbd, table code and the ApiKeyTester input.
- **Changelog version badges render in MONO on /changelog**: computed `ui-monospace…`, 12px. This differs from the homepage changelog section, where they render sans (CLONE_SPEC §0.1).
- The footer on these pages computes to the mono stack at the `<footer>` element (`font-mono`), the same as the homepage.

### 0.2 New tokens (light values, from `:root`; all also seen as computed values)
| token | value | used by |
|---|---|---|
| --color-fd-primary / --primary | `#413030` rgb(65,48,48) | active sidebar link text, active TOC link, TOC thumb, tab underline, breadcrumb current |
| fd-primary/10 | `rgba(65,48,48,.10)` (computed `oklab(0.3285 0.0236 0.0079 / .1)`) | active sidebar link bg |
| --color-fd-secondary / --secondary | `#fafaf9` | search button bg (at /50 = rgba(250,250,249,.5)), step number circle, code-tab panel bg, pagination current page |
| --color-fd-accent | `#fafaf9` | hovers (sidebar link hover at /50, search result selected, popover item hover) |
| --color-fd-overlay | `#0003` = rgba(0,0,0,.2) | search dialog backdrop |
| --color-fd-popover | `#fff` | search dialog bg; root-tab popover uses /60 + blur 16px |
| --color-fd-ring | `#413030` | focus rings |
| --docs-table-shell | `#fdfcfc` | table container bg |
| --docs-table-header | `#f8f7f6` | th bg |
| --docs-table-border | `#e3e0de` (borders at 92% / 94% / 80% alpha, see §3.6) | table borders |
| --docs-callout-surface | `#f9f7f6` | callout bg |
| --docs-callout-border | `#ece4df` | callout border; icon border at 80% |
| --docs-callout-content | `#2c2826` | callout text |
| --docs-callout-accent | `#6e5149` rgb(110,81,73) | callout icon colour, link underline at 72% |
| --docs-asset-frame-radius / -padding / -max-width / --docs-asset-max-height | `1.25rem` (20px) / `.5rem` (8px) / `46rem` (736px) / `24rem` | image and video frames |
| --site-content-width | `56.25rem` (900px) | changelog container |
| foreground/72 | `rgba(44,40,38,.72)` (computed `oklab(0.2804 0.0046 0.0052 / .72)`) | card body text, prose `a` inside cards |
| foreground/10 | `rgba(44,40,38,.10)` | TOC track lines |
| border/80 | `rgba(234,232,230,.8)` | cards, table shell, YouTube frame |
| border/40 | `rgba(234,232,230,.4)` | changelog article separators, pager top border |
| shiki github-light | text `#24292E`, purple `#6F42C1`, string `#032F62`, constant/key/flag `#005CC5`, comment `#6A737D`, keyword `#D73A49` (all six seen as computed token colours) | code |
| fd diff (unused on site) | remove `#c80a641f`/`#e60a64`, add `#0eb4641a`/`#0ac864` | shiki diff notation (not used) |

---

## 1. Docs shell: layout grid (all docs pages)

### 1.1 Grid
`#nd-docs-layout` is `display:grid; overflow-x:clip; min-height:100dvh`, with this inline style (verbatim):
```
grid-template:
 "sidebar sidebar header toc toc"
 "sidebar sidebar toc-popover toc toc"
 "sidebar sidebar main toc toc" 1fr /
 minmax(min-content,1fr) var(--fd-sidebar-col) minmax(0, calc(var(--fd-layout-width,97rem) - var(--fd-sidebar-width) - var(--fd-toc-width))) var(--fd-toc-width) minmax(min-content,1fr);
--fd-layout-width: 80rem;  --fd-sidebar-col: var(--fd-sidebar-width);
--fd-docs-row-1: var(--fd-banner-height,0px);  --fd-docs-row-2: calc(row-1 + --fd-header-height);  --fd-docs-row-3: calc(row-2 + --fd-toc-popover-height)
```
- `--fd-sidebar-width` is 268px at ≥768 (md) and 0 below.
- `--fd-toc-width` is 268px at ≥1280 (xl) and 0 below.
- `--fd-banner-height` is 4rem (64px) at md+. This is the sticky offset for the sidebar and TOC: they stick at `top:64px`, while the marketing header is 57px tall. That leaves a 7px gap above the sidebar and TOC.
- `--fd-header-height` is 0 at md+ and 56px below md (`#nd-subnav`).

Measured column widths:
| viewport | columns | article x / width |
|---|---|---|
| 1440 | 80 · 268 · 744 · 268 · 80 | 348 / 744 |
| 1280 | 0 · 268 · 744 · 268 · 0 | 268 / 744 |
| 1024 | 0 · 268 · 756 · 0 · 0 (TOC hidden, `max-xl:hidden`) | 268 / 756 |
| 800 | 0 · 268 · 532 · 0 · 0 | 268 / 532 |
| 390 | 0 · 0 · 390 · 0 · 0; rows 56 · 0 · auto | 0 / 390 |

The page footer (CLONE_SPEC §11) follows the grid directly. At 1440 the doc height is 2238 for /docs and 9859 for /docs/api.

### 1.2 Top bar
- **≥768:** the marketing header from CLONE_SPEC §1, with class `sticky z-40 font-sans hidden md:block`. It is 57px tall with a 1px #eae8e6 bottom border. "Docs" has `aria-current="page"` → `text-foreground` (#2c2826); the other links are `text-foreground/70`.
- **<768:** the marketing header is hidden and `header#nd-subnav` (Fumadocs) replaces it:
  - `[grid-area:header]`, sticky top 0, z-30, height 56px, `ps-4 pe-2.5` (16/10px), border-bottom 1px #eae8e6.
  - bg `rgba(255,255,255,.8)` with `backdrop-filter: blur(8px)`, and `transition-colors` 150ms.
  - Left: link "/" with the Conductor mark svg and the text "Conductor", `inline-flex gap-2.5` (10px), weight 600, 16px.
  - Right: two icon buttons, each `p-2` (8px), radius 6px, icon 18px (`[&_svg]:size-4.5`), hover bg #fafaf9:
    - Search (lucide `search`, `data-search`, opens the search dialog).
    - "Open Sidebar" (lucide `panel-left`).

### 1.3 Sidebar (desktop, `aside#nd-sidebar`)
- **Wrapper** (`[grid-area:sidebar]`): sticky `top:64px`, height `calc(100dvh - 64px)` (836 at 900 tall), z-20, `pointer-events-none *:pointer-events-auto`.
- **Aside:** absolute, full column width (348 at 1440), `items-end`. Every child is 268px wide (`*:w-(--fd-sidebar-width)`), so the content hugs the main column. Content x starts at 80+16=96 at 1440 and at 16 at ≤1280. bg `#fff` (`bg-fd-card`), 14px/20px, `#2c2826`.
  - It has the class `border-e` but the **computed border-right is 0**. There is no visible divider between the sidebar and the content (screenshot confirms).
  - `transition` 250ms (collapse feature, unused).
- **Top block** (`flex flex-col gap-3 p-4 pb-2`, i.e. 16px with 8px bottom, gap 12px):
  1. A "Conductor" logo link (`text-[0.9375rem] font-medium gap-2.5`). It is **not rendered at md+**: the measured first visible child is the search button at y=80.
  2. **Search button** (`button[data-search-full]`): 236x36, `inline-flex items-center gap-2` (8px), padding `6px 6px 6px 8px`, radius 8px, border 1px #eae8e6, bg `rgba(250,250,249,.5)`, text 14px/20px #756f6c. Hover: bg #fafaf9 and text #2c2826, with `transition-colors` 150ms `cubic-bezier(.4,0,.2,1)`.
     - Content: lucide `search` 16px, then "Search", then `ms-auto inline-flex gap-0.5` holding two `kbd`s: "⌘" and "K".
     - Each kbd: 22px tall, `px-1.5` (6px), radius 6px, border 1px #eae8e6, bg #fff, **mono** 14px/20px, color #756f6c.
  3. **Root switcher** (sidebar tabs, `button[aria-haspopup=dialog]`): 236x38, `flex items-center gap-2 p-2` (8px), radius 8px, border 1px #eae8e6, bg `rgba(250,250,249,.5)`, text `#2c2826`.
     - Content: an empty icon slot (`size-9 md:size-5 empty:hidden`), `p.text-sm.font-medium` with the root name ("Reference" or "How to"), a description `p` (hidden at md+, shown in the mobile drawer), then lucide `chevrons-up-down` 16px `ms-auto` in muted colour.
     - Hover and open state: bg #fafaf9.
     - It is only rendered when the current page belongs to a root (Reference or How to). On fallback-only pages (pages not in either root, e.g. `/docs/reference/conductor-json`; see §6.1), the sidebar instead shows the two roots as collapsed top-level folders.
  4. Two hidden `nav[aria-label=Site]` blocks hold the site links. One shows only <md (in the drawer). The other shows only when the sidebar is collapsed, which the UI never triggers (see 1.3.3).
- **Root popover** (on click): Radix popover, `data-side=bottom`, width equal to the trigger (240px measured, `min-w-[240px]`), padding 4px, gap 4px, radius 12px, border #eae8e6.
  - bg `rgba(255,255,255,.6)` + `backdrop-filter: blur(16px)`, `shadow-lg` (`0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)`).
  - Animation `fd-popover-in` 100ms ease (`opacity 0; scale(.9)` → normal), from origin `--radix-popper-transform-origin`. Font is the Geist stack.
  - Items (links to the root index): `flex items-center gap-2 rounded-lg p-1.5` (6px padding, radius 8px), 67px tall, hover bg #fafaf9.
    - Title `text-sm font-medium leading-none` (14px/14px 500).
    - Description `text-[0.8125rem] text-muted mt-1` (13px, #756f6c).
    - A check icon on the current root.
  - The two roots:
    - "Reference": "Conductor reference and concepts", index `/docs`.
    - "How to": "Complete common tasks in Conductor", index `/docs/guides/use-files-to-copy`.
- **Tree viewport** (Radix ScrollArea): `flex-1 min-h-0`, viewport `p-4` (16px), `overscroll-contain`, scrollbar hidden.
  - Top and bottom fade mask: `mask-image: linear-gradient(to bottom, transparent, white 12px, white calc(100% - 12px), transparent)`.
  - Children stack in a `flex-col` with gap 2px (`gap-0.5`).
  - **Separator** (`p`): 14px/20px, weight 400, colour **#2c2826** (not muted), `px-2` (8px), `mb-1` (4px), `mt-6` (24px; first one mt 0), `inline-flex gap-2`. Examples: "Get Started", "Cloud", "Concepts", "Reference", "Security", "Troubleshooting".
  - **Page link**: 236x36, `flex items-center gap-2 p-2` (8px), radius 8px, 14px/20px, colour `#756f6c`. Inline `padding-inline-start: calc(2 * var(--spacing))` gives 8px at the top level and **20px** (`5*4px`) inside a folder.
    - Hover: bg `rgba(250,250,249,.5)`, text `rgba(44,40,38,.8)`, `hover:transition-none`, i.e. instant on hover-in with a 150ms fade-out.
    - **Active** (`data-active=true`): bg `rgba(65,48,48,.10)`, text `#413030`. Inside a folder it also gets a 1px `#413030` bar via `::before` (absolute, `inset-y-2.5` = 10px top/bottom, `inset-s-2.5` = left 10px). This bar overlays the folder guide line.
  - **Folder** (collapsible; `button` when the folder has no index page, `a` when it does), same box as a page link. The label is followed by lucide `chevron-down` 16px `ms-auto`, colour #756f6c, `-rotate-90` when closed, 0deg when open, with `transition-transform` (150ms).
    - Content: `overflow-hidden`, animated with `fd-collapsible-down` and `fd-collapsible-up` (150ms `cubic-bezier(.45,0,.55,1)`, height 0↔`--radix-collapsible-content-height` and opacity 0→1).
    - A guide line runs through the content: `::before` 1px `#eae8e6`, top/bottom 4px, left 10px.
    - Inner list: `flex-col gap-0.5 pt-0.5` (2px).
    - Folders containing the current page are open on load. All others are closed (`defaultOpen:false`), and their children are **not rendered until opened**.
    - Reference folders (in order): API, Workspace setup, Settings, Agents and tools, Harnesses, Review and merge, App controls.
  - The full tree is in `src/content/docs/nav.json`.
- **Collapse panel:** `div[data-sidebar-panel]`, fixed at `top: calc(16px + row-3)`, `inset-s-4`, `rounded-xl p-0.5 border bg-fd-muted shadow-lg`. It holds the "Collapse Sidebar" button (`panel-left`) and the "Open Search" button (each 30x30, p 6px, radius 8, icon 18px).
  - It is permanently `opacity-0 pointer-events-none` because the sidebar is never collapsed: the site exposes no collapse trigger.
  - **Do not build it.**

### 1.4 Article column (`article#nd-page.docs-page`)
- Box: `mx-auto flex flex-col gap-4` (16px), `max-w-[900px]`, `min-w-0`.
- Padding:
  - 1440 and 1280: `16px 32px 24px` (`xl:px-8 xl:pt-4 pb-6`).
  - 768–1279: `32px 24px 24px` (`md:px-6 md:pt-8`).
  - <768: `24px 16px` (`px-4 py-6`).
- Children in order: breadcrumb `nav` → `h1` → description `p` → `div.prose` → prev/next grid.
- **Breadcrumb** (`nav[aria-label=Breadcrumb].docs-breadcrumb`):
  - 14px/20px, weight 500, letter-spacing −0.35px (`tracking-tight`), colour #756f6c, `white-space:nowrap`, `overflow-x:auto` with the scrollbar hidden.
  - `ol.flex.gap-1.5` (6px). Each `li` is `flex shrink-0 items-center gap-1.5` and starts with a chevron-right separator svg (except the first).
  - The items are plain `span`s, not links, e.g. "Get Started" › "Introduction".
  - The last item is `span[aria-current=page].font-medium.text-fd-primary`, but measured colour #756f6c on /docs (the shell colour wins). Use #756f6c for all items.
  - Fallback pages show a single item, e.g. "conductor.json".
  - 20px tall; at 1440 it sits at y=73.
- **H1:** `text-4xl md:text-[2.6rem] font-semibold leading-[1.05] tracking-tight`.
  - ≥768: 41.6px / 43.68px, 600, letter-spacing −1.04px, colour #2c2826.
  - <768: 36px / 37.8px, letter-spacing −0.9px.
  - System sans. y=109 at 1440 (16px gap after the breadcrumb).
- **Description:** `mb-0 mt-2 max-w-3xl text-base md:text-lg text-muted-foreground`. 18px/28px at ≥768 and 16px/24px below, colour #756f6c, `margin-top: 8px` (plus the 16px flex gap, so 24px from the H1), max-width 768px.
- **Prose block** (`div.prose.flex-1.docs-prose.pt-1`): padding-top 4px.
  - **max-width 655.08px.** That is `65ch` of the prose font: the article is 680 wide at 1440, but the prose stops at 655.
  - 16px / 28px, colour #2c2826. Font is the Geist stack (§0.1).
- **Prev/next** (`div.@container.grid.gap-4.grid-cols-1`, `md:grid-cols-2` when both exist). It is the last article child, with the flex gap of 16px above.
  - Each card is an `a`: `flex flex-col gap-2 rounded-lg border p-4 text-sm`. That is 16px padding, radius 8px, border 1px #eae8e6, gap 8px, 82px tall, 14px/20px.
    - Hover: bg `rgba(250,250,249,.8)` (`hover:bg-fd-accent/80`) and text #2c2826, with `transition-colors` 150ms.
  - Row 1: `inline-flex items-center gap-1.5 font-medium` (14px 500 #2c2826). It holds a chevron-left 16px with the title for "previous", and the title with a chevron-right (`flex-row-reverse`) for "next".
  - Row 2: description `p.text-fd-muted-foreground.truncate` (14px/20px #756f6c, single line with ellipsis).
  - The next card is right-aligned (`text-end`). A single card spans full width (`@max-lg:col-span-full`). Measured widths:
    - 1440: one card, 680 wide.
    - 1280: two cards, 332 each.
    - 1024: two cards, 346 each.
    - 800: one card per row (484).
  - The order follows the flattened page tree. Values are stored per page as `previous` / `next` in `src/content/docs/<slug>.json`.

### 1.5 Right TOC (`#nd-toc`, Fumadocs "clerk" style; xl+ only)
- Box: sticky `top:64px`, height `calc(100dvh - 64px)`, `flex-col`, padding `48px 16px 8px 0` (`pt-12 pe-4 pb-2`), 268px wide. At 1440 it starts at x=1092; the title sits at y=80.
- **Title:** `h3#toc-title.inline-flex.items-center.gap-1.5`, 14px/20px #756f6c, lucide `text-align-start` 16px, text "On this page".
- **List viewport:** `relative min-h-0 text-sm ms-px overflow-auto py-3` (12px). The scrollbar is hidden. It has the same edge fade mask as the sidebar but at 16px (`transparent, white 16px, white calc(100%-16px), transparent`).
- **Item:** `a.prose.relative.py-1.5.text-sm`.
  - 14px/20px, padding 6px vertical; the first item has pt 0 and the last has pb 0. Height 26px for single-line items.
  - Inline `padding-inline-start` is **20px for depth 2 and 32px for depth 3**.
  - Colour #756f6c; hover #2c2826 (`transition-colors` 150ms); `data-active=true` gives `#413030`.
  - Each item draws a vertical rail: `div.absolute.inset-y-0.w-px.bg-fd-foreground/10` (1px, `rgba(44,40,38,.1)`), at `inset-inline-start:8px` for depth 2 and 16px for depth 3.
  - When the depth changes between neighbours, a small connector svg is inserted: `viewBox="8 0 8 12"`, 9x12, `-top-1.5`, path `M 8 0 C 8 8 16 4 16 12` (or the reverse), stroke `rgba(44,40,38,.1)` 1px.
- **Scroll-spy (measured on /docs/guides/migrate-from-cursor after scrolling to 1600):**
  - Every heading currently inside the viewport is active. Several items can be active at once; there was no single-active behaviour.
  - On first load at the top of the page, the first item is active.
  - Fumadocs implements this with an IntersectionObserver on the `h2`/`h3` ids.
- **Active track:** an absolutely positioned block (`div.absolute.top-0.inset-s-0`, width 24.5px, height equal to the list height) contains:
  1. An svg whose path follows the rails: x=8.5 for depth 2 and x=16.5 for depth 3; 20px straight segments, then a cubic `C` bend over 12px between items (e.g. `M8.5 0 L8.5 20 C 8.5 28 8.5 24 8.5 32 …`). Stroke `#413030` 1px.
     - It is clipped to the active range with `clip-path: polygon(0 var(--track-top), 100% var(--track-top), 100% var(--track-bottom), 0 var(--track-bottom))` and `transition-[clip-path]` (150ms).
  2. A **thumb dot**: 4x4px circle, bg #413030. It sits on the same path via `offset-path: path(…)` and `offset-distance: var(--offset-distance)`, with opacity `var(--opacity)`.
     - `transition: opacity .15s, offset-distance .15s cubic-bezier(.4,0,.2,1)`.
     - Measured state: `--track-top:148px; --track-bottom:200px; --offset-distance:204px`.
- No TOC popover is used. `tableOfContentPopover.enabled=false` and `--fd-toc-popover-height:0`, so **there is no TOC at all below 1280px**.

### 1.6 Mobile drawer (`aside#nd-sidebar-mobile`, <768)
- Opened by "Open Sidebar" in `#nd-subnav`.
- Panel:
  - fixed `inset-e-0 inset-y-0` (slides in from the **right**).
  - `w-[85%] max-w-[380px]` (331.5px at 390), full height, z-40.
  - bg #fff, `border-s` 1px #eae8e6, `shadow-lg`.
  - Base font **15px/22.5px** (`text-[0.9375rem]`).
- Animation: `fd-sidebar-in` 250ms ease (`translateX(100%)` → 0); close uses `fd-sidebar-out` 250ms. When closed the panel is `invisible`.
- Overlay: `fixed inset-0 z-40 backdrop-blur-xs` (`blur(4px)`), **no background colour**, with `fd-fade-in`/`fd-fade-out` at 300ms ease. Clicking it closes the drawer.
- Content, top to bottom:
  1. A row (`flex text-fd-muted-foreground items-center gap-1.5`) with `flex-1` and the close button ("Open Sidebar" label, `panel-left`, p 8px).
  2. Site nav (`flex flex-col gap-1 border-b pb-3`):
     - Links Changelog / **Docs** (active, `text-fd-primary` #413030) / Pricing / Enterprise / Join Us / Sign in. Each is `rounded-md px-3 py-2 text-sm` (12/8px padding, 14px/20px, 36px tall, radius 6px), colour #756f6c, hover bg `rgba(250,250,249,.5)` and text #2c2826.
     - A "Download" row button, `flex w-full justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted`. It opens the same download dialog as the header (CLONE_SPEC §11b).
  3. The root switcher. Here it is 58px tall and shows the description line under the name (14px, #756f6c), with a 36px icon slot (empty).
  4. The tree viewport, identical to desktop but at 15px base. Page links stay `text-sm` (14px).

### 1.7 Search (⌘K / Ctrl-K, the search button, or the subnav search icon)
- **Overlay:** `fixed inset-0 z-50 bg rgba(0,0,0,.2)` + `backdrop-filter: blur(4px)`, with `fd-fade-in` / `fd-fade-out` at 300ms ease.
- **Dialog** (`[role=dialog]`):
  - fixed, `left:50%; translateX(-50%)`.
  - `top: calc(50% - 250px)` at md+ (y=200 at 900 tall) and `top:16px` below md.
  - `w-[calc(100%-1rem)] max-w-screen-sm` (640px).
  - radius 12px, border #eae8e6, bg #fff.
  - `shadow-2xl shadow-black/50`, i.e. `0 25px 50px -12px rgba(0,0,0,.5)`.
  - Font is the Geist stack, 16px.
  - `fd-dialog-in` 300ms `cubic-bezier(.16,1,.3,1)` (`opacity 0, scale(1.06)` → 1). Closing uses `fd-dialog-out` (→ `scale(1.04)`, opacity 0).
  - Children are separated by `border-b`.
- **Input row** (`flex items-center gap-2 p-3`):
  - Lucide search icon (16px, muted).
  - `input[placeholder=Search]`: `text-lg` declared but computed 16px/24px, transparent bg, placeholder #756f6c, no outline, caret `#413030`.
  - An "ESC" button: 30px tall, `px-2 py-1.5`, 12px/16px, weight 500, mono, colour #756f6c, border 1px #eae8e6, radius 6px, hover bg #fafaf9.
- **Results list:**
  - Wrapper `overflow-hidden h-(--fd-animated-height) transition-[height]` (150ms). Its height animates from 0 to the content height, max 460px.
  - Inner `flex flex-col overflow-y-auto max-h-[460px] p-1` (4px).
  - The list is empty (height 0) until the user types.
- **Result item** (`button`): `px-2.5 py-2` (10/8px), radius 8px, 14px/20px, text-start.
  - Selected item (`aria-selected=true`, arrow keys or hover): bg #fafaf9.
  - Page result: 56px tall, two lines:
    1. Breadcrumb trail, `text-xs` 12px #756f6c, e.g. "Conductor › Reference › Settings" with chevron separators.
    2. Title, `font-medium`.
  - Heading or text result: 36px tall. It is indented with a 1px rail (`absolute start-3 inset-y-0 w-px bg-fd-border`) and `ps-4` text. Headings add a hash icon and `ps-8`. Text rows render in `rgba(44,40,38,.8)`.
  - Matched terms: `<mark>` is rendered as `span.text-fd-primary.underline` (#413030 underline).
  - Inline code in results: `border rounded-md px-px bg-fd-secondary`.
- **Data source:** live `GET https://www.conductor.build/api/search?query=<q>` returns `[{id, type: page|heading|text, content (with <mark>), breadcrumbs?, url}]`.
  - **The clone cannot call this endpoint.** Use `src/content/docs/_search-index.json` instead. It contains page, heading and text records per page and was built by the scraper.
  - Implement client-side matching and highlight matches by wrapping them in `<mark>`.

---

## 2. Docs typography in prose (computed at 1440; prose font = Geist stack)
| role | size / line-height | weight | other |
|---|---|---|---|
| p | 16 / 28 | 400 | colour #2c2826; margin 0 0 20px (first child mt 0; between paragraphs 20px) |
| h2 (`flex scroll-m-28 items-center gap-2`) | 24 / 32 | **700** | margin 48px 0 24px; scroll-margin-top 112px. Inner `a.peer` has weight 500 (computed); the visual weight is the anchor's 500 because the text lives in the `a`. **Use 500 on the text.** |
| h3 | 20 / 32 | 600 (anchor text 500 as for h2) | margin 32px 0 12px |
| h4 | 16 / 24 | 600 | margin 24px 0 8px |
| heading anchor icon | lucide `link` 14px, colour #756f6c, `opacity:0`; `peer-hover:opacity-100` with `transition-opacity` 150ms | | Placed after the text, gap 8px. Headings are not underlined. |
| a (inline) | inherits | **500** | colour #2c2826; `text-decoration: underline 1px`; `text-underline-offset: .18em` (2.88px); decoration colour `color-mix(currentColor 55%, transparent)` = rgba(44,40,38,.55); `transition: opacity .2s`; hover opacity .8 |
| strong | inherits | 600 | #2c2826 |
| ul / ol | 16 / 28 | 400 | padding-left 26px; margin 20px 0; li margin 8px 0, padding-left 6px; ol `decimal`; markers: bullets and counters #756f6c (`--tw-prose-bullets/counters`) |
| inline `code` | 14 / 24.5 | **600** | mono; bg #fafaf9; border 1px #eae8e6; radius 5px; padding 3px; no backticks (`content:none`). Inside links it keeps the chip and inherits the link colour/underline. |
| blockquote | tailwind-typography default | 500, italic | border-left .25rem `#eae8e6`, padding-left 1em, colour #756f6c (`--tw-prose-quotes: var(--muted-foreground)`), quote marks. Seen on `/docs/cloud/getting-started`; not individually measured. |
| hr | | | border-top 1px #eae8e6, margin 3em 0 (typography default; not present on sampled pages) |

Prose `table` (raw, without the docs shell) also exists in the Fumadocs CSS, but every docs table on the site uses the `docs-table-shell` component (§3.6).

---

## 3. Docs MDX components (all measured at 1440 unless noted)
In the content JSON, every component maps to a node `type`, noted as `node:` below. The schema is in §6.

### 3.1 Code block (`node: code`): Fumadocs `CodeBlock`
- **Figure:**
  - `figure.shiki` with `my-4` (16px 0), bg #fff, border 1px #eae8e6, radius 12px.
  - `shadow-sm`: `0 1px 3px rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)`.
  - `overflow:hidden`, 14px/20px base, full prose width (655px). Default text colour is `#24292e`.
- **With title** (` ```lang title="…" `):
  - Header `div.flex.items-center.gap-2.h-9.5.border-b.px-4`: 38px tall, padding 0 16px, gap 8px, colour #756f6c, 14px/20px.
  - Header content: a language icon (14x14 svg from Shiki's icon set, stored as `icon` in JSON), then `figcaption.flex-1.truncate` with the title, then the copy button (`-me-2`).
- **Without title:** the copy button is absolutely positioned at `top:12px; right:8px` in a wrapper `z-2 rounded-lg backdrop-blur-lg` (`blur(16px)`).
  - Lines then get `--padding-right: 32px` so text never runs under the button.
- **Copy button:** 24x24, padding 4px, radius 6px, colour #756f6c, lucide `clipboard` 16px.
  - Hover and `data-checked` colour: #2c2826.
  - On click it copies the code and swaps to the check icon. Fumadocs restores the clipboard icon after roughly 1.5s; that timing was not measured.
- **Scroll region:**
  - `div[role=region].text-[0.8125rem].py-3.5.overflow-auto.max-h-[600px].fd-scroll-container`: 13px/18.57px, padding 14px 0.
  - Scrollbar (webkit): 5px wide, thumb #eae8e6, radius 5px, transparent track.
- **pre and lines:**
  - `pre.min-w-full.w-max` holds `code` with flex-col lines.
  - Each `span.line` has padding-inline 16px (right 32px when the copy button overlays) and `white-space: pre`. Mono, 13px/18.57px.
  - An empty line keeps `height:1lh`.
- **Token colours:** see §0.2. Tokens carry an inline `--shiki-light:#XXXXXX`, rendered as `color: var(--shiki-light)`. The JSON stores `color` (light) and `colorDark`.
- The 141 code blocks on the site cover these languages (taken from the `.md` fences): bash, sh, json, toml, text, txt, and a few without a language. Diff, highlight and line-number notations are styled in the CSS but **unused**.

### 3.2 Code tabs (`node: codeTabs`): Fumadocs `CodeBlockTabs` (2 instances, `/docs/guides/migrate-from-cursor`)
- **Container:** `bg-fd-card rounded-xl border my-4`. That is bg #fff, radius 12px, border #eae8e6, margin 16px 0.
- **Tablist:** `flex px-2 overflow-x-auto`, 32px tall, padding 0 8px, colour #756f6c.
- **Tab:** `relative inline-flex text-sm font-medium px-2 py-1.5 gap-2 whitespace-nowrap`: 14px/20px 500, padding 6px 8px, 32px tall.
  - Inactive: #756f6c; hover #2c2826.
  - Active (`data-state=active`): `#413030`, with a 1px underline bar `absolute inset-x-2 bottom-0 h-px bg #413030` (8px inset each side).
  - `transition-colors` 150ms.
- **Panel:** contains the code figure restyled as `bg-fd-secondary -mx-px -mb-px last:rounded-b-xl`. That gives bg **#fafaf9**, top corners square, bottom radius 12px, and the border overlapping the container border. No title header; the copy button sits top-right.
- The default tab is the first one. There is no animation (`animation-duration:0s`).

### 3.3 Callout (`node: callout`, `calloutType: info | warning`; 13 on the site: 11 info, 2 warning)
- **Box:** `div[role=note][aria-label="Info note"|"Warning note"].docs-callout.not-prose`.
  - `my-6` (24px), `grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1.5` (gap 6px 8px).
  - Padding `12px 16px` at ≥640 and `10px 14px` below.
  - Radius 16px, border 1px **#ece4df**, bg **#f9f7f6**, text #2c2826.
- **Icon badge:** `docs-callout-icon mt-0.5 size-7 rounded-full border`, 28x28 circle.
  - bg `color-mix(#fff 92%, #f9f7f6)` ≈ `#fefefe`; border `rgba(236,228,223,.8)`.
  - Icon colour **#6e5149**, lucide 20px: `info` for info, `triangle-alert` for warning.
  - **Info and warning share the same colours.** The site defines no per-type palette.
- **Body:** `span.sr-only` with "Info: " or "Warning: ", then `div.docs-callout-description` at 15.2px/26.6px (`text-[0.95rem]`), colour #2c2826.
  - First child mt 0 and last child mb 0. `p + p`, `ul` and `ol` get `margin-top: .65rem`. Lists use `padding-left: 1.15rem`, and each `li` has `margin-block: .2rem`.
  - Links: weight 500, #2c2826, underline 1.5px, offset .18em, decoration `rgba(110,81,73,.72)`, `transition: opacity .2s, text-decoration-color .2s`. Hover: opacity .8 and decoration #6e5149.
- A single-paragraph callout measures 79px tall.

### 3.4 Steps (`node: steps` > `step`): `.fd-steps` / `.fd-step` (10 instances, 44 steps)
- **`.fd-steps`:** `counter-reset: step`, `border-left: 1px solid #eae8e6`, `position: relative`.
  - Margin-left / padding-left: **16px / 28px** at ≥640, and **8px / 24px** below.
- **`.fd-step::before`:** shows `counter(step)` in a 32x32 circle, bg #fafaf9, colour #2c2826, 14px/20px.
  - `display:flex` centred, absolutely positioned at `inset-inline-start: -16px; top: 0` relative to the step, so it sits centred on the border line.
  - `counter-increment: step`.
- Each step normally starts with an `h3` (20/32, 600; its top margin collapses out of the step). After that comes the normal prose content: paragraphs, tables and code.

### 3.5 Accordions (`node: accordions` > `accordion`): Fumadocs `Accordions type="single"` (11 groups, 29 items)
- **Group:** `divide-y divide-fd-border overflow-hidden rounded-lg border bg-fd-card`. That is border 1px #eae8e6, radius 8px, bg #fff, with 1px #eae8e6 dividers. There are no vertical margins of its own (prose flow only).
- **Item:** `div.scroll-m-24` (scroll-margin 96px). Fumadocs gives each item an id from its title, so `#…` deep links open it.
- **Trigger:** `h3.not-prose.flex.items-center.font-medium` > `button.group.flex.flex-1.items-center.gap-2.px-3.py-2.5.text-start`.
  - 16px/28px **500**, padding 10px 12px, gap 8px, 48px tall, colour #2c2826.
  - Leading lucide `chevron-right` 16px, colour #756f6c, with `transition-transform duration-200` and `rotate-90` when open.
- **Panel:** `overflow-hidden`.
  - Opening uses `fd-accordion-down` 200ms ease-out (height 0 → content, opacity .5 → 1). Closing uses `fd-accordion-up`.
  - The inner content padding in Fumadocs is `px-4 pb-2` (prose). Panels are closed on load, so this was **not measured**.
- All items are closed initially. The scraper captured the content of every panel from the RSC payload.

### 3.6 Table (`node: table`): `.docs-table-shell` (56 tables)
- **Shell:** `not-prose my-8 overflow-hidden rounded-[0.9rem] border`.
  - margin 32px 0, radius 14.4px, bg `#fdfcfc`, border 1px `rgba(227,224,222,.92)`.
  - `box-shadow: inset 0 1px 0 rgba(255,255,255,.7), 0 1px 2px rgba(44,40,38,.06)`.
- **Scroll wrapper:** `.docs-table-scroll.overflow-x-auto[role=region][tabindex=0]`, with focus-visible outline `2px solid #413030`, offset −2px.
- **Table:** `w-full min-w-[38rem]` (608px; this forces horizontal scroll at 390), `border-separate border-spacing-0`, 14px/20px, colour #2c2826.
- **th:** 12.48px (`.78rem`) / 17.83px, **600**, letter-spacing .01em (0.125px), no text-transform, bg **#f8f7f6**, left-aligned, `vertical-align: top`.
- **th and td padding:**
  - ≥768: `15.2px 18px` (`.95rem 1.125rem`). The first cell has padding-left 22.4px (1.4rem) and the last cell has padding-right 22.4px.
  - <768: `12.8px 16px` (`.8rem 1rem`), with first/last cells at 20px.
- **Cell borders:**
  - `border-bottom: 1px solid rgba(227,224,222,.94)`; the last row has none.
  - `th+th` and `td+td` get `border-left: 1px solid rgba(227,224,222,.8)`.
- **Code in cells:** not a prose chip (the shell is `not-prose`). Plain mono at **11.9px** (.85em), weight 400, `white-space: nowrap`, no background.
- Caption (if present): 14px #756f6c, padding `.85rem 1rem .25rem`, left-aligned.

### 3.7 Image / video frame (`node: image | video`): `.docs-asset-shell` (9 images, 3 videos)
- **Shell:** `figure.docs-asset-shell.not-prose.my-10`, width 100%, margin 40px 0.
- **Frame** (`.docs-asset-frame`):
  - `display:flex; justify-content:center; margin-inline:auto; width: fit-content; max-width: min(100%, 736px)`.
  - border 1px `rgba(234,232,230,.88)`, radius **20px**, padding **8px**, `overflow:hidden`.
  - bg `color-mix(#fafaf9 86%, #fff)` ≈ **#fbfbfa**.
- **Media** (`.docs-asset-media`): `display:block; width:auto; max-width:100%; height:auto; object-fit: contain; margin-inline:auto`, radius **12px** (20 − 8).
  - `max-height: min(56vh, 30rem)` (the later rule wins): 480px at 900 tall, 472.6px at 844 tall.
  - Measured on /docs/cloud: image 637x379 inside a 655x397 frame.
- Video (`node: video`) is `controls playsInline` and not autoplay. Examples: `/docs/concepts/workflow`, `/docs/reference/diff-viewer`, `/docs/reference/scripts`.
  - It is followed by an `sr-only` summary, stored as `summary` in the JSON.
- **Light/dark pairs:** `.docs-theme-image-light` / `-dark`. The dark one is hidden in light mode; JSON stores them as `variants`. Render the light variant only.

### 3.8 YouTube embed (`node: youtube`; 13 on the site)
- **Framed preview** (`framed: true`; e.g. "Introducing Conductor" on /docs):
  - Outer `div.not-prose.my-10.overflow-hidden.rounded-[1.75rem].border.border-border/80.bg-muted/55.p-2.5`: margin 40px 0, radius 28px, border `rgba(234,232,230,.8)`, bg `rgba(250,250,249,.55)`, padding 10px.
  - Inner `div[data-ntpc=YouTubeEmbed]` > `lite-youtube`.
- **lite-youtube:** block, width 100%, `max-width: 720px`, 16:9 (633x356 at 1440), radius 16px, bg #000, `overflow:hidden`, cursor pointer.
  - Background image `https://i.ytimg.com/vi_webp/<id>/sddefault.webp`; a local copy is at `/assets/docs/youtube/<id>-sddefault.webp`.
  - Play button `button.lyt-playbtn`: the standard lite-youtube-embed play glyph (YouTube red rounded rectangle, 68x48), `filter` transition 100ms `cubic-bezier(0,0,.2,1)`. Its label is the `title`.
  - On click it replaces itself with `<iframe src="https://www.youtube-nocookie.com/embed/<id>?autoplay=1&playsinline=1" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>`.
  - The exact lite-youtube base CSS comes from the third-party `lite-yt-embed.css`, loaded by `next/third-parties`. That stylesheet was not in the measured stylesheet set.

### 3.9 Cards (`node: cards` > `card`; /docs only, 2 grids, 5 cards)
- **Grid:** `not-prose my-8 grid grid-cols-1 gap-5 md:gap-6 md:grid-cols-2` (or `md:grid-cols-3`). Margin 32px 0; gap 20px below md and 24px at md+.
  - At 1440 the two-column grid has 315.5px columns, and each card is 130px tall.
- **Card** (`article`): `rounded-3xl border border-border/80 bg-muted/35 p-5 md:p-6`.
  - Radius **24px**, border `rgba(234,232,230,.8)`, bg `rgba(250,250,249,.35)`, padding 24px at md+ and 20px below.
  - Hover: border `rgba(44,40,38,.15)` and bg `rgba(250,250,249,.7)`, with `transition-colors` **200ms** `cubic-bezier(.4,0,.2,1)`.
- **Title link:** `mb-3 flex items-center gap-3 text-sm font-medium no-underline`: 14px/20px 500, #2c2826, gap 12px, margin-bottom 12px.
  - Content: a leading icon (muted, lucide 16px: `download`, `message-circle`, `mail`, and a Discord glyph; the Reddit card uses an "r" text badge instead, stored as `iconText`), then the title, then a trailing lucide `arrow-up-right` 16px with `ml-auto`, muted.
- **Body:** `div.text-sm.leading-6.text-foreground/72` at 14px/24px, `rgba(44,40,38,.72)`. Links inside are prose links.

### 3.10 Keyboard shortcut (`node: shortcut`; 144 occurrences) and kbd
- **`span.docs-shortcut`:** `inline-flex items-center gap-.24rem` (3.84px), `white-space:nowrap`, `vertical-align: baseline`.
  - It contains `span.sr-only` (e.g. "Command N"), then the keys, with `span.docs-shortcut-separator` "+" between them (12.8px = .8em, colour #756f6c).
- **`kbd.docs-key`:**
  - Font: mono, **12.48px** (.78em) / 18.1px (1.45), weight **600**, colour #2c2826.
  - Box: `inline-flex` centred, `min-width: 1.75em`, padding `.12rem .42rem` (1.92px 6.72px), radius 6px, 23x24 for "⌘".
  - border 1px `rgba(234,232,230,.92)`, bg `color-mix(#fafaf9 88%, #fff)` ≈ #fbfbfa, `box-shadow: inset 0 -1px 0 rgba(44,40,38,.14)`.
- A plain `kbd` (`node: kbd`) outside `.docs-shortcut` uses the typography kbd style: .875em, weight 500, radius .3125rem, `box-shadow: 0 0 0 1px rgba(44,40,38,.35), 0 3px 0 rgba(44,40,38,.35)`. None were seen in prose on the sampled pages.

### 3.11 Site-specific interactive components (`node: component`)
The component structure is captured in the content JSON (`name`, `props`, `children`). For their markup, use the SSR HTML in `recon/docs/components/`. Behaviour comes from the live site's client JS and was only partly measured.
| name | page | notes |
|---|---|---|
| `ApiKeyTester` | /docs/api | Box `not-prose my-6 rounded-lg border border-border/80 bg-muted/20 p-4` (radius 8, padding 16, bg `rgba(250,250,249,.2)`). Row `flex flex-col gap-2 sm:flex-row`. Contains a password `input` (h 36, radius 6, border #eae8e6, bg #fff, px 12, **mono 14px**, focus border #413030) and a "Run test" button (h 36, `px-3`, 14px 500, bg #2c2826, text #fff, radius 6, hover bg foreground/90). It performs live API calls against `api.conductor.build`. **Build only the static UI**; flag the behaviour as out of scope. |
| `ApiAgentPrompt` | /docs/api, /docs/api/mcp | Renders as a plain untitled code block (§3.1) holding `props.prompt` (no language). |
| `ConfigureProjectPrompt` | /docs/configure-your-project | `section.not-prose.my-6.rounded-lg.border.border-border/80.bg-muted/20.p-4`, measured 184px tall. Layout `flex flex-col gap-4 sm:flex-row sm:justify-between`. Contains an `h2.m-0.text-sm.font-medium` "Configure with Conductor" and a `p.mt-1.text-sm.leading-6.text-muted-foreground`. Actions: an `a[href^="conductor://prompt=…"]` (dark button) and a "Copy prompt" button (`border bg-background/50 backdrop-blur-md h-9 px-3 text-sm font-medium rounded-md gap-2`, clipboard icon). Below: `details.mt-4.rounded-md.border.border-border/70.bg-background`; its `summary` "View prompt" is 14px/20px 500 #756f6c, padding 8px 12px, hover #2c2826; the `pre` is mono 12px/20px, padding 12px, `max-h-80` (320px), `whitespace-pre-wrap`, with a top border. The full prompt text is in the SSR HTML. |
| `KeyboardShortcutsCheatsheetOverlay` | /docs/reference/keyboard-shortcuts | No visible SSR output (keyboard-triggered overlay). The page's 8 shortcut tables are regular content: `div.not-prose.my-8.space-y-10` sections with h2s and tables, in the JSON. |
| `CityProbabilityCurve` | /docs/reference/cities | `figure.not-prose.my-8.rounded-[0.9rem].border.border-border/80.bg-muted/35`. It has a header (`h2.text-lg.font-semibold` "Probability of finding all 295 cities" and a `p.text-sm.text-muted-foreground`), a 2/5-column grid of stat buttons (`gap-px bg-border/80`, `bg-background px-4 py-3`, hover `bg-muted/65`) and an SVG chart. The full SSR markup is 19 KB in `recon/docs/components/CityProbabilityCurve.ssr.html`. Interactive hover and selection behaviour was not measured. |

---

## 4. Docs at 390 (deltas; see `recon/docs/*-390.png` and `raw/mob-*.json`)
- **Chrome:** the marketing header is hidden. The page has `#nd-subnav` (§1.2), no sidebar, no TOC and the drawer (§1.6). The footer follows (CLONE_SPEC §14 footer deltas apply; height 509).
- **Article:** padding 24px 16px, width 358. The breadcrumb sits at y=80 (56 subnav + 24).
- **H1:** 36px/37.8px, letter-spacing −0.9px, at y=116.
- **Description:** 16px/24px.
- **Prose:** unchanged sizes (16/28; h2 24/32 with margins 48/24).
- **Components:**
  - Code blocks are full width (358) and scroll horizontally inside the region.
  - Tables keep `min-width: 608px` and scroll inside the shell.
  - Card grids become one column with a 20px gap and 20px card padding.
  - Callouts get 10px 14px padding.
  - Steps get 8px margin and 24px padding.
- **Prev/next:** a single column, each card full width.

---

## 5. Changelog
### 5.1 Container (index, pages and posts)
- **Header and footer:** the marketing header (CLONE_SPEC §1, sticky, 57px, "Changelog" `aria-current` → #2c2826) and the footer (CLONE_SPEC §11). The mobile header uses the menu button from CLONE_SPEC §1.
- **Main:** `section.changelog-container.pt-10.pb-24.md:py-24`.
  - `width:100%; margin-inline:auto`.
  - **<768:** `max-width: 900px` (`--site-content-width`), `padding-inline: 16px`, pt 40, pb 96.
  - **768–1279:** `max-width: calc(900px + 11.5rem)` (1084), `padding: 96px 24px 96px 208px` (`13rem` left gutter for the date column).
  - **≥1280:** `max-width: calc(900px + 11rem)` (**1076**), `padding: 96px 32px 96px 208px`.
  - Measured: section x=182 at 1440 and x=102 at 1280. The content column is **836px** wide at both (x=390 at 1440).
- There is no page title or hero on the changelog index. The first article starts at y=153 (57 header + 96 padding).

### 5.2 Entry (index article and post article)
- **Article:**
  - Index: `article#<version-dashed>` (e.g. `id="0-91-0"`), `relative mb-14 scroll-mt-8 border-b border-border/40 pb-14 last:mb-0 last:border-b-0 last:pb-0`.
    - margin-bottom 56px, padding-bottom 56px, separator `1px rgba(234,232,230,.4)`, scroll-margin-top 32px.
    - The pager `nav` is a sibling, so **every** article on an index page, including the last, keeps its border and margin.
  - Post: `article.relative`, with no border.
- **Meta column:** `mb-5 flex flex-col items-start gap-3 text-left md:absolute md:inset-y-0 md:left-[-12rem] md:mb-0 md:w-40 md:pt-1`.
  - **≥768:** absolute at left −192px, width 160px, full article height, padding-top 4px. The inner `div.flex.flex-col.items-start.gap-3.md:sticky.md:top-24` sticks at **top 96px** while the article scrolls. At 1440 the meta column sits at x=198.
  - **<768:** static, gap 12px, margin-bottom 20px.
  - Children:
    1. The **version badge**. On index pages it is wrapped in an `a` to the post.
       - `inline-flex items-center rounded-xs border px-1 py-0.5 font-mono text-xs uppercase tracking-wider`.
       - **Mono 12px/16px**, letter-spacing .6px, colour **#7d5e59**, bg **#f8f7f6**, border 1px **#f3ece7**, radius 2px, padding 2px 4px, 22px tall (57x22 for "0.91.0").
       - Index only: hover text #2c2826 with `transition-colors` 150ms.
    2. The **date**, `span.text-sm.text-muted-foreground`: 14px/20px #756f6c, e.g. "October 15, 2026" (verbatim strings; some older ones read "May 5th, 2026").
- **Content column:** `div.min-w-0`.
  - **Title:**
    - Index: `a.mb-6.block.text-2xl.font-semibold.text-foreground.hover:underline.sm:text-3xl`, i.e. 30px/36px at ≥640 and 24px/32px below, weight 600, #2c2826, margin-bottom 24px, underline on hover. It links to the post.
    - Post: `h1.mb-6.text-3xl.font-semibold`, **30px/36px at every width**, margin-bottom 24px. The title is the entry `title` without the version.
  - **Body** (markdown rendered with per-tag classes; system sans, colour #2c2826):
| element | class | computed |
|---|---|---|
| p | `text-base text-foreground mb-4` | 16/24, mb 16px |
| a | `text-foreground underline hover:no-underline` (+ `target=_blank rel=noopener noreferrer`, also on internal links) | default underline (1px, auto offset) |
| h2 | `text-xl font-semibold text-foreground mt-8 mb-3` | 20/28, 600, mt 32 mb 12 (used for sub-version headings on older posts) |
| h3 | `text-lg font-semibold text-foreground mt-6 mb-2` | 18/28, 600, mt 24 mb 8 ("Improvements", "Fixes") |
| h4 | `text-base font-semibold text-foreground mt-4 mb-2` | 16/24, 600, mt 16 mb 8 ("New in 0.91.2") |
| ul | `list-disc list-outside ml-8 pl-2 space-y-2 mb-4` | margin-left 32, padding-left 8, mb 16; li 16/24 with 8px between (`space-y-2`) |
| ol | plain `<ol>` (1 occurrence) | browser default decimal |
| strong | `font-semibold text-foreground` | 600 |
| code (inline) | `bg-muted px-1.5 py-0.5 rounded text-sm` | **mono 14/20**, bg #fafaf9, padding 2px 6px, **radius 8px** (`rounded` resolves to `--radius` .5rem), no border |
| pre | `mb-6 overflow-x-auto` > `code` (same chip classes) | mb 24px |
| image / video | `span.docs-asset-shell.not-prose.my-10.block > span.docs-asset-frame > img/video.docs-asset-media` | Identical frame to docs §3.7 (radius 20, padding 8, max-width 736, media radius 12, max-height min(56vh, 30rem)). It sits inside a `p.mb-4`. Images are `loading=lazy`, `width=800 height=450` (next/image). Videos are `autoplay muted loop playsinline width=100%` with `bg-black`. At 1440 a 0.90.0 image frame measured 632x498. Video frame 736x492. |

### 5.3 Index pagination (`nav[aria-label="Changelog pages"]`)
- **Nav:** `mt-16 flex flex-col items-center gap-4 border-t border-border/40 pt-8`. margin-top 64px, padding-top 32px, separator `1px rgba(234,232,230,.4)`, gap 16px. Total height 105px.
- **Row 1** (`flex w-full items-center justify-between gap-4`, 28px tall):
  - **Previous** and **Next** buttons: `h-7 px-2.5 text-xs gap-1.5 rounded-md border border-border bg-background/50 backdrop-blur-md font-medium`.
    - 28px tall, padding 0 10px, **12px/16px 500**, #2c2826, border 1px #eae8e6, bg `rgba(255,255,255,.5)` + `blur(12px)`, radius 6px, gap 6px.
    - Icons: lucide chevron-left/right 16px (Previous: icon then text; Next: text then icon). `rel=prev` / `rel=next`.
    - Hover bg #fafaf9.
    - On page 1, "Previous" is a `span[aria-disabled=true]` with `opacity:.5; pointer-events:none`. "Next" is disabled the same way on the last page.
  - Centre: `span.text-sm.text-muted-foreground` "Page N of 21" (14px/20px #756f6c).
- **Row 2** (`flex flex-wrap items-center justify-center gap-1`): page numbers.
  - Link: `h-7 px-2.5 text-xs font-medium rounded-md text-foreground/90 hover:bg-secondary`. 28px tall, padding 0 10px, 12px/16px 500, `rgba(44,40,38,.9)`, radius 6px.
  - Current: `span[aria-current=page]` with bg #fafaf9, colour #2c2826 (hover bg secondary/80).
  - Ellipsis: `span.px-2.text-sm.text-muted-foreground` "..." (14px).
  - Measured pattern (21 pages): `[1] 2 … 21`, `1 [2] 3 … 21`, `1 2 [3] 4 … 21`, `1 … 3 [4] 5 … 21`, `1 … 9 [10] 11 … 21`, `1 … 19 [20] 21`, `1 … 20 [21]`. That is: always first and last, plus current ±1, with "…" for any gap of ≥1 page.
- **URLs:** page 1 is `/changelog`; page n is `/changelog/page/n` (2–21). There are 10 entries per page; the last page has 7. The order is in `src/content/changelog/index.json` (`pages[].slugs`).

### 5.4 Post page (`/changelog/<urlSlug>`)
- **Back link** (first child of the section): `a.inline-flex.items-center.gap-2.text-sm.text-muted-foreground.hover:text-foreground.transition-colors.mb-8` to `/changelog`.
  - 14px/20px #756f6c, gap 8px, margin-bottom 32px, lucide `arrow-left` 16px, text "Back to changelog". 144x20 at x=390 (1440).
- The `article` follows (meta column + h1 + body, as in §5.2). There is no pager, no prev/next post and no author block.

### 5.5 Changelog at 390
- Section padding 40px 16px 96px, content width 358.
- The meta block stacks above the title: badge, then 12px gap, then the date, then 20px margin.
- Index title 24px/32px; post h1 stays 30px/36px.
- Media frames are full width: 358 with 340 media.
- The pager keeps the same structure: both rows fit at 358 (the number row is 126–158px wide).
- Doc heights: index 24157, page 2 35001, post 0.90.0 5507.

### 5.6 Motion (changelog)
There is none beyond hover colour transitions (150ms) and the sticky meta column. Videos autoplay muted and loop. No IntersectionObserver or entrance animations were observed: `document.getAnimations()` was empty apart from the header's `top-nav-scroll-mask-x`.

---

## 6. Content data (written by `scripts/scrape-content.mjs`)
**Run:** `node scripts/scrape-content.mjs [--no-media] [--only=docs|changelog]`.
- No dependencies are needed.
- It uses a pool of 4 concurrent requests with a 150ms delay between items.
- On macOS it re-executes itself with the keychain CA bundle (`NODE_EXTRA_CA_CERTS`), because this machine's network uses a TLS-intercepting CA. Set `SCRAPE_NO_KEYCHAIN=1` to disable that.
- It is idempotent: downloads already in `public/` are reused.

### 6.1 Files
- `src/content/docs/nav.json`: `{ name, roots: [folder(root)…], fallback: […], order: [{root, pages:[{url,name,group}]}] }`.
  - Node shapes:
    - folder: `{type:'folder', name, description?, root?, defaultOpen?, collapsible?, index?:page, children}`
    - page: `{type:'page', name, description?, url, source}`
    - separator: `{type:'separator', name}`
  - The "Reference" root has 52 entries and "How to" has 15; together they cover 65 unique URLs, because a root index also appears as a page. 4 pages are fallback-only (reachable but not in the sidebar): `/docs/reference/conductor-json`, `/docs/reference/remote-control`, `/docs/reference/scripts/run` and `/docs/reference/scripts/setup`.
  - `fallback` also lists the pages that the sidebar shows under other labels.
- `src/content/docs/<slug>.json`: one file per docs URL (69). The slug is the path after `/docs/`, and `/docs` itself is `index.json`. Fields:
  - `slug, url, title, description, meta{title, ogImage}`
  - `breadcrumb[{name, url?}]`
  - `toc[{depth, url:'#id', title}]` and `tocStyle:'clerk'`
  - `previous?{url,title,description}`, `next?{…}`
  - `components[]` (names of the §3.11 components on the page)
  - `body`: a typed node tree (below)
  - `html`: clean semantic HTML rendered from `body` with `data-*` markers
  - `text`: plain text for search
  - `markdown`: the `.md` export
- `body` node types:
  - `text{value}`
  - `element{tag, attrs, children}`: p, ul, ol, li, a, strong, em, code, blockquote, h2 without an id, span/div/section with `attrs['data-class']` holding the original utility classes, svg/path
  - `heading{depth,id,children}`
  - `code{lang?, title?, icon?(svg), code, lines[{tokens[{text,color,colorDark,fontStyle?}]}]}`
  - `codeTabs{defaultValue, tabs[{value,label,children}]}`
  - `callout{calloutType, title?, children}`
  - `steps{children: step{children}}`
  - `accordions{accordionType, children: accordion{title, id?, children}}`
  - `table{caption?, head[cell], rows[[cell]]}`, where cell is `{children, align?}`
  - `image{src, alt, width?, height?, variants?}`
  - `video{src, alt, controls, autoPlay, muted, loop, playsInline, summary?}`
  - `youtube{videoId, title, thumbnail, framed?}`
  - `cards{columns, children: card{title, href, external?, icon?(svg), iconText?, trailingIcon?(svg), children}}`
  - `shortcut{label, keys[], separator}`
  - `kbd{value}`
  - `icon{svg}`
  - `component{name, props, children}`
- `src/content/docs/_pages.json`: a flat page list.
- `src/content/docs/_search-index.json`: search records, replacing `/api/search`.
- `src/content/changelog/index.json`: `{ totalPages:21, pageSize:10, pages:[{page,url,slugs[]}], posts:[…207 in display order…], notInIndex:[] }`.
  - Post entry: `{slug, version, title, fullTitle, date, dateISO, summary, hero{type,src,alt?}|null, authors:[], url, indexPage, position}`.
- `src/content/changelog/<urlSlug>.json` (207 files): `{slug, version, versionSlug, title, fullTitle, date, dateISO, description, summary, hero, ogImage(remote), authors:[], url, sourceUrl, headings[{depth,title}], html, markdown}`.
  - `html` is the live SSR body with class attributes stripped. Styles are per tag in §5.2. Media is wrapped as `<figure data-asset>`, Cloudflare-obfuscated emails are decoded, and links and media are rewritten to local paths.
  - `markdown` is the raw entry source from the RSC payload, with media rewritten as well.
- `src/content/media-manifest.json` (every remote → local mapping) and `src/content/scrape-summary.json`.
- Internal links are rewritten to site-relative paths (`/docs/...`, `/changelog/...`). External links are left untouched.

### 6.2 Counts (final run)
- Docs: 69/69 sitemap URLs extracted.
- Changelog: 207/207 posts across 21 index pages. All 207 appear in the index pages.
- Media: 342 references. 337 downloaded (316 images + 21 videos, ≈1.14 GB). 5 failed (see Gaps).
- Folder layout and per-file details are in `ASSETS_DOCS.md`.

---

## 7. Gaps / not measurable / judgement calls
1. **Docs prose font:** the computed family is "Geist, -apple-system, …", but Geist is never loaded (there is no `@font-face Geist`). It renders as SF Pro on macOS and falls back further elsewhere. Do not ship Geist for docs prose if you want pixel parity on the measured machine.
2. **Accordion open-state padding** and the **copy-button "copied" timing** were not measured. Both come from Fumadocs defaults (accordion content `px-4 pb-2`; check icon roughly 1.5s).
3. **lite-youtube base CSS** (play button glyph and size) comes from a third-party stylesheet that was not in the measured CSS. Use lite-youtube-embed's standard CSS.
4. **Interactive components:**
   - `ApiKeyTester`: live API calls.
   - `CityProbabilityCurve`: chart interactions.
   - `KeyboardShortcutsCheatsheetOverlay`: hotkey overlay.

   Their behaviour lives in client JS that I did not reverse-engineer. Only the static SSR markup is provided.
5. **Search:** the live site uses the server endpoint `/api/search` (Orama). The clone must search `_search-index.json` client-side, so result ranking will differ.
6. **5 changelog images 404 on the live site too** (dead GitHub user-attachments). They are referenced by `0.25.0-workspace-storage-improvements…`, `0.15.1-claude-s-thinking`, `0.15.0-linear` (2) and `0.14.0-command-palette`. They are left as the original remote URLs in the content, so they render broken exactly as on the original.
7. **Changelog `authors`:** the site shows no authors anywhere. The field is an empty array; JSON-LD lists only the "Conductor" organisation. The `hero` field is derived as the first image or video in the entry body; there is no explicit hero field on the site.
8. **`dateISO`** is parsed from free-text dates such as "May 5th, 2026". The display string `date` is verbatim; use it for rendering.
9. **Docs video sizes:** `workflow.mp4` is 771 MB and `ConductorAdvancedSetup.mp4` is 172 MB. They are downloaded to `public/assets/docs/media/` as requested, but they will bloat `dist/`. Consider keeping the remote URLs (`https://melty.t3.storage.dev/...`, listed in the manifest) for those two.
10. **The sidebar collapse UI and TOC popover** exist in Fumadocs but are disabled or unreachable on the site. Do not build them.
11. **Ten older changelog posts render an indented `<video …>` from their markdown as literal escaped text** (inside a `<p>`) on the live site. The content `html` keeps this as-is so the clone matches; those video files are not downloaded.
12. I did not verify the hover colours of the search result list beyond the class names. The accent and secondary colours are both #fafaf9.
