Source: https://www.conductor.build/

# Conductor homepage: clone spec (route `/`)

Measured on 2026-10-22 with Playwright (Chromium, macOS) at 1440x900, 1280 and 390x844, using getComputedStyle, getBoundingClientRect, getAnimations and MutationObserver, plus a read of the shipped CSS/JS (`Conductor - Run a team of coding agents in the cloud_files/25q8hi5g3_2_6.css`, `1yxe03xjcss2j.js`, `2266ic-d_8-t2.js`, and lazy chunk `0d_lt-coofpbu.js`).
Raw dumps: `recon/raw-1440-loaded.json` (authoritative 1440), `recon/raw-1280.json`, `recon/raw-390.json`. Screenshots: `recon/original-1440-full.png`, `recon/original-390-full.png`.
Asset mapping is in `ASSETS.md`. All `/assets/...` paths below are relative to `public/`.

Original stack: Next.js (Turbopack) + Tailwind **v4** (colors computed as `oklab()/lab()`; uses the CSS `translate` property). The site renders in **light theme** (`<html class="light" style="color-scheme: light">`). No framer-motion, GSAP, Lottie or scroll libraries are used. Motion is CSS transitions and keyframes, React state timers (`setInterval`), IntersectionObserver, `requestAnimationFrame`, animated WebP files used as CSS masks, and one MP4.

---

## 0. Global

### 0.1 Fonts (important quirk)
- `@font-face geistSans` (Geist variable TTF) is declared and preloaded, but it is **never used**. `document.fonts` reports `geistSans: unloaded`.
- Why: `:root { --marketing-font-sans: var(--font-geist-sans-source, ui-sans-serif), system-ui, sans-serif }` is resolved on `:root`. `--font-geist-sans-source` is only defined on `<body>`, so the variable resolves to `ui-sans-serif, system-ui, sans-serif`.
- **Computed font-family for all sans text:** `ui-sans-serif, system-ui, sans-serif`. On macOS this renders SF Pro. **Use this exact stack**, not Geist.
- **Mono text** (only elements using `font-[family-name:var(--marketing-font-mono)]`): `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`.
- The page wrapper `div.bg-background.font-sans` sets `--font-mono: var(--marketing-font-sans)`. As a result, anything using the plain `font-mono` class renders **sans**, including the footer and the changelog version badges (measured as `ui-sans-serif`).
- `<body>` itself computes to the mono stack, but every visible element sits inside the sans wrapper.
- Smoothing: `antialiased` (`-webkit-font-smoothing: antialiased`).
- Local file `/assets/fonts/Geist-VariableFont_wght.ttf` is downloaded but **not needed for fidelity**.

### 0.2 Color tokens (light theme, from `:root`; all were also seen as computed values)
| token | value | usage |
|---|---|---|
| --background | `#ffffff` | page, header, cards |
| --foreground | `#2c2826` rgb(44,40,38) | primary text, nav Download button bg |
| foreground/70 | rgba(44,40,38,0.7) | nav links |
| foreground/90 | rgba(44,40,38,0.9) | dark button hover bg |
| foreground/30 | rgba(44,40,38,0.3) | changelog card hover border |
| --muted | `#fafaf9` rgb(250,250,249) | footer bg, faux sidebar bg, sandbox status pill |
| --muted-foreground | `#756f6c` rgb(117,111,108) | body copy, captions |
| --border | `#eae8e6` rgb(234,232,230) | all 1px borders |
| --highlight | `#faf7f5` rgb(250,247,245) | chat bubbles |
| --highlight-foreground | `#594545` rgb(89,69,69) | chat bubble text |
| --positive | `#16a249` rgb(22,162,73) | "PR #482 ready", "sandbox ready", Ludwig online dot |
| --primary | `#413030` | (unused on homepage) |
| --tip-secondary | `#f8f7f6` | changelog badge bg |
| --tip-secondary-border | `#f3ece7` | changelog badge border |
| --tip-muted | `#7d5e59` rgb(125,94,89) | changelog badge text |
| green-500 | `#00c758` (lab(70.55 -66.51 45.81)) | multiplayer presence dots |
| red-400 / amber-400 / green-400 | `#ff6568` / `#fcbb00` / `#05df72` | faux window traffic lights |
| Fable/Claude mark | `#D97757` | orchestration demo icon |
| black/40 | rgba(0,0,0,0.4) | CTA image overlay |
| black/50 | rgba(0,0,0,0.5) | download dialog backdrop |
| theme-color meta | `#2c2826` (light), `#eae8e6` (dark) | |

The dark theme (`.dark`) exists (`--background #141110`, `--foreground #eae8e6`, `--muted #211e1c`, `--muted-foreground #a5a09c`, `--border #ffffff1a`, `--highlight #2a1e1d`, `--highlight-foreground #f3ece7`). It is not active on the measured page. The hero wrapper carries a `dark` class but still computes `bg #fff` / `color #2c2826`, because tokens are resolved from `html.light`. Building the light theme only is sufficient. The dark-variant assets (night-sky bg, `*-light.svg` logos, `conductor-app-hero-dark.webp`) are mapped in ASSETS.md in case they are needed later.

### 0.3 Radii / shadows / blur
- radius: `rounded-xs` 2px (badge), `rounded-sm` 4px (mention chip), `rounded-md` 6px (buttons, tooltips, bubbles), `rounded-lg` 8px (logo link, dialog, sandbox pill), `rounded-xl` 12px (demo cards, hero app shot), `rounded-full`.
- `shadow-md` (tooltips): `0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)`.
- `shadow-lg` ("Download now", dialog): `0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)`.
- Avatar ring (`ring-1 ring-black/10`): `0 0 0 1px rgba(0,0,0,.1)`.
- Presence-dot ring: `0 0 0 2px #fff`.
- Traffic light inset: `inset 0 0 0 .5px rgba(0,0,0,.28)`.
- No `backdrop-filter` is used anywhere on the page. The only one is `backdrop-blur-md` on the dialog's "Join Windows/Linux waitlist" button.

### 0.4 Breakpoints & containers
Tailwind defaults: sm 640, md 768, lg 1024, xl 1280. Containers: `max-w-xl` 576, `max-w-2xl` 672, `max-w-3xl` 768, `max-w-6xl` 1152, `max-w-7xl` 1280, `max-w-[1920px]`.

### 0.5 Default transition
`transition-colors` = color/background-color/border-color/outline-color/text-decoration-color, `150ms cubic-bezier(0.4,0,0.2,1)`. `ease-out` = `cubic-bezier(0,0,0.2,1)`.

### 0.6 Typography roles (computed, 1440/1280; 390 values in §12)
| role | size/line-height | weight | letter-spacing | color |
|---|---|---|---|---|
| H1 hero (2 block spans) | 36px/40px (`sm:text-4xl`) | 600 | -0.9px (-0.025em) | #fff |
| H2 feature title | 24px/32px | 600 | -0.6px | #2c2826 |
| "Trusted by 100k+ builders" | 24px/32px, centered | 600 | -0.6px | #2c2826 |
| Testimonial quote (blockquote) | 24px/32px, `text-pretty` | 600 | -0.6px | #2c2826 |
| CTA H2 "Be like this guy." | 36px/40px, centered | **700** | -0.9px | #fff |
| Changelog H2 link | 24px/32px | 600 | -0.6px | #2c2826 |
| Changelog card H3 | 16px/24px | 600 | normal | #2c2826 |
| Feature body `p` | 16px/24px | 400 | normal | #756f6c |
| Nav link | 14px/20px | 400 | normal | rgba(44,40,38,.7) |
| Button label (nav Download) | 14px/20px | 500 | normal | #fff |
| "Get Conductor" | 14px/20px | 600 | normal | #2c2826 |
| "Download now" | 14px/20px | 700 | normal | #000 |
| Hero quote `p` | 14px/24px italic | 400 | normal | #2c2826 |
| Hero quote attribution | 12px/20px; name 500 | 400 | normal | #2c2826 |
| Text links ("Learn more about Cloud", "See what people are saying") | 14px/20px | 500 | normal | #2c2826, underline |
| Testimonial name / subtitle | 14px/20px 500 / 14px/20px 400 | | | #2c2826 / #756f6c |
| Changelog date | 12px/16px | 400 | normal | #756f6c |
| Changelog version badge | 12px/16px UPPERCASE, sans | 400 | 0.6px (0.05em) | #7d5e59 |
| Footer heading `[Company]` | 14px/20px | 400 | normal | #756f6c |
| Footer link | 14px/20px | 400 | normal | #2c2826 |
| "macOS / iOS / API" buttons | 14px/20px **mono** | 400 | normal | #2c2826 |

---

## 1. Header (sticky)
- `<header class="sticky top-0 z-40">`, height 57 (56 inner + 1px bottom border `#eae8e6`), bg `#fff`. **No scroll-state change**: no blur, shadow or color shift. No backdrop-filter.
- Inner: `max-w-7xl` (1280) centered, `px-8` (32px) from md up and `px-4` below. CSS grid `auto minmax(0,1fr) auto`, gap 16px, height 56, items centered. At 1440 the content spans x=112 to 1328.
- Left: home link 36x36 (`size-9`, rounded-lg) containing the Conductor logomark SVG `h-7` (28px tall, viewBox 0 0 115 174, so about 18.5px wide), `fill/stroke: currentColor` (#2c2826). File: `/assets/svg/conductor-logomark.svg`. aria-label "Conductor home".
- Right: `nav.top-nav-scroll-mask`, `display:flex` at md+ (hidden below), gap 24px, padding 4px, `max-width: calc(100vw - 10rem)`, `overflow-x:auto`, scrollbar hidden. It has a scroll-driven mask (see Motion M10).
  - Links in order: **Changelog** (/changelog), **Docs** (/docs), **Pricing** (/pricing), **Enterprise** (/enterprise), **Join Us** (/join-us), **Sign in** (https://app.conductor.build). 14px/20px, color rgba(44,40,38,.7), **hover color #2c2826**, transition-colors 150ms.
  - Measured x at 1440: Changelog 785 (w70), Docs 879 (w33), Pricing 936 (w45), Enterprise 1005 (w66), Join Us 1095 (w48), Sign in 1167 (w44), all at y=18, h20.
  - **Download** button: 90x32 at x=1234,y=12. bg #2c2826, text #fff, 14px weight 500, radius 6px, padding 0 12px (h-8 px-3), gap 8px. **Hover bg rgba(44,40,38,.9)**. Opens the Download dialog (§11).
- Below md: the nav is hidden and a menu button appears. 36x36, 1px border #eae8e6, radius 6px, bg #fff, hover bg #fafaf9, lucide `menu` icon 16px (`/assets/svg/icon-menu.svg`), swapping to `x` (`/assets/svg/icon-x.svg`) when open. The open panel sits below the header: `border-t border-border bg-background`, a nav column `max-w-7xl px-4 py-3 gap-1`. Each link gets `rounded-md px-3 py-2 hover:bg-muted`, and the last item is a "Download" row button (`flex w-full justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted`). Clicking any item closes the panel. No open/close animation.

## 2. Hero
Wrapper `div.relative.isolate.overflow-hidden.bg-background` spans y=57 to 1425 at 1440 (h 1368).

### 2.1 Background image
- `<img>` absolute, `inset-x-0 top-0`, `z-0`, `w-full h-auto min-h-[34rem]` (544px), `object-cover`, pointer-events none.
- **Mask:** `linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)` (both `mask-image` and `-webkit-mask-image`). The image fades into the white page.
- Light file: `/assets/img/homepage-hero-background.webp` (1672x941; blue sky with dotted/braille clouds). Rendered box 1440x810.4 at 1440, 1280x720.4 at 1280, 390x544 at 390 (min-height kicks in and cover crops).
- Dark-theme file: `/assets/img/homepage-hero-background-night-sky.webp` (not shown in light).

### 2.2 Text column
`section.relative.z-10.mx-auto.max-w-xl` (576px), `px-8 pt-24` at sm+ (96px top; `px-4 pt-20` below sm), color #fff. Box at 1440: x=432, w=576, inner x=464, w=512.
1. **Wordmark**: wrapper `w-56` (224px; `w-48`=192 below sm), `mb-8` (32px). Inner `div.aspect-[496/76]` is 224x34.3. It holds a `span.block.h-full.w-full.bg-current` (white) with an inline mask `mask-image:url(/animations/conductor-logo.webp); mask-position:left center; mask-size:contain; mask-repeat:no-repeat`. Local: `/assets/img/animations/conductor-logo.webp` (496x76 **animated WebP**, 157 frames, 3060ms, **loop count 1** so it plays once on load; see M2). Top at y=153.
2. **H1** at y=219.3, 512x80, `mb-8`. Two block spans:
   - line 1: "Run a team of coding agents"
   - line 2: cycles "in the cloud." → "on your Mac." → "from your iPhone." with a scramble effect (M1). SSR/initial text is "on your Mac.", which immediately scrambles to "in the cloud." on mount.
   - Font: `text-[min(1.875rem,calc(7.4vw-2.5px))]` base, 36px at sm+. Line-height is 40px at sm+; below sm it inherits 1.5. Weight 600, tracking -0.025em.
3. **CTA grid**: `grid grid-cols-1 gap-3 sm:grid-cols-2` (12px gap), 512 wide, cols 250/250, y=331.3.
   - **"Get Conductor"** link → `/pricing`. 250x40, bg **#fff**, text #2c2826, 14px weight 600, radius 6px, padding 16px 12px (h-10 px-3), `justify-between`, trailing lucide arrow-right 16px. **Hover: bg rgba(255,255,255,.9); arrow `translate-x-1` (4px) over 200ms cubic-bezier(.4,0,.2,1).**
   - **Quote** (blockquote spanning 2 cols, `mt-1` = 4px, y=387.3). `p` text-sm italic leading-6: “feels like going from typing with two fingers to having eight arms” (curly quotes included). Color #2c2826, because the light theme overrides the white.
   - Attribution `footer.mt-2` (8px), flex gap 8px, 12px/20px. Avatar 20x20 round with 1px #eae8e6 border (`/assets/img/testimonials/frank.jpg`), then "**Frank**" (500) ", Product Designer, Thinking Machines".

### 2.3 App screenshot
- Wrapper `div.relative.z-10.mx-auto.max-w-[1920px]`, `mt-10 mb-14` (40/56px) at sm+ (`mt-8 mb-10` below), `px-8` at lg (`px-6` sm, `px-4` base).
- Inner `div.overflow-hidden.rounded-xl` (12px) with `<img class="h-auto w-full">`.
- File: `/assets/img/conductor-app-hero-light.webp` (3022x1954). The window frame, shadow and transparent margins are **baked into the image**, so no CSS shadow or border is needed.
- Box: 1440 → x=32, y=479.3, 1376x889.7. 1280 → 1216x786.3. 390 → 358x232 (x=16).
- Alt: "Conductor app showing collaborative agent chats and a changes panel".
- No entrance animation is applied on the homepage. The CSS contains `product-hero-demo-*` keyframes, but no element uses them here.

## 3. "Trusted by" logo strip
- `section.px-4.pb-16.pt-6` (24px top, 64px bottom, 16px sides). y=1425 to 1673 at 1440 (h 248).
- Heading `p.mb-6` (24px) centered, 24px/32px, weight 600, tracking -0.6px, #2c2826 (20px/28px below sm). Text: "Trusted by **100k+** builders". The number span is `tabular-nums` and animates as a counter (M5). There is an sr-only copy "Trusted by 100k+ builders" and the visible copy is aria-hidden.
- Grid `mx-auto max-w-2xl grid-cols-4`, gap 24px at sm+ (16px below). At 1440 it is 672 wide (x=384), cols 4x150, 2 rows. Each cell is `flex h-10 items-center justify-center` (40px; h-8 = 32px below sm).
- Logos in order (light variants shown; the dark variant is hidden), sizes as rendered at 1440:
  1. Linear: `/assets/img/logos/linear.svg`, h 24 (h-4 → sm:h-6), 96x24
  2. Vercel: `/assets/img/logos/vercel-light.svg` (this is the one shown in light mode), h 20 (h-3.5 → sm:h-5), 100.6x20
  3. Notion: `/assets/img/logos/notion-wordmark.svg`, h 32 (h-5 → sm:h-8), 92x32
  4. Ramp: `/assets/img/logos/ramp-wordmark.svg`, h 24 (h-5 → sm:h-6), 90x24
  5. Y Combinator: `/assets/img/logos/yc-wordmark-orange.png`, `w-full h-auto max-w-36` (144px; max-w-28=112 below sm), **`mix-blend-mode: multiply`**, 144x28.7
  6. Square: `/assets/img/logos/square-wordmark.svg`, h 24 (h-4 → sm:h-6), 96x24
  7. PostHog: flex gap 6px, `/assets/img/logos/posthog-logomark.svg` h 24 (h-5 → sm:h-6, 45x24) plus `/assets/img/logos/posthog-wordmark.svg` h 16 (h-3.5 → sm:h-4, 65x16)
  8. Spotify: `/assets/img/logos/spotify-wordmark.png`, h 24 (h-4 → sm:h-6), 89x24, inline `filter: brightness(0) saturate(100%) invert(58%) sepia(95%) saturate(1063%) hue-rotate(87deg) brightness(92%) contrast(86%)` (turns it Spotify green)
- No hover effects on logos.

## 4–7. Feature sections (4 identical shells)
Shell: `section.mx-auto.grid.max-w-3xl.gap-6`, 768 wide (x=336 at 1440, 256 at 1280), `px-8 py-16` at lg (32/64px; sm: px-6 py-16; base: px-4 py-12). Single column 704px, row gap 24px. Children: (a) text block, (b) demo, (c) optional link/buttons.
- H2 `mb-3` (12px), flex-wrap, `gap-x-3 gap-y-2`, 24px/32px weight 600, tracking -0.6px, #2c2826 (20px/28px below sm).
- Body `div.space-y-3`: 16px/24px #756f6c at sm+ (14px/20px below).
- Demo cards: `rounded-xl` 12px, `border 1px #eae8e6`, `bg #fff`, `overflow-hidden`.

Vertical positions at 1440 (testimonials loaded):
| # | section | y | h |
|---|---|---|---|
| 4 | Multiplayer | 1673 | 640 |
| 5 | Cloud sandbox | 2313 | 684 |
| 6 | Orchestration | 2997 | 684 |
| 7 | Anywhere | 3681 | 613 |

### 4. "Ludwig has entered the chat."
- H2: "Ludwig has entered the chat." followed by an avatar stack (`flex -space-x-1.5`). Three links, each 28x28 (`size-7`) round with `ring-1 ring-black/10` and margin-right -6px:
  1. Clara Schumann (`/assets/img/demos/clara-schumann.jpg`, `object-position: center 25%`) → https://en.wikipedia.org/wiki/Clara_Schumann, tz Europe/Berlin
  2. Wolfgang Amadeus Mozart (`/assets/img/demos/mozart.jpg`) → https://en.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart, tz Europe/Vienna
  3. Ludwig van Beethoven (`/assets/img/demos/beethoven.jpg`) → https://en.wikipedia.org/wiki/Ludwig_van_Beethoven, tz Europe/Berlin. Has an online dot: absolute bottom-0 right-0, 8x8, bg #16a249, ring 2px #fff.
  - aria-label "<name> on Wikipedia", target _blank.
  - **Hover tooltip** (`role=tooltip`): absolute `bottom-full left-1/2 mb-2` (8px), `-translate-x-1/2`, rest state `translate-y-1` (4px) + opacity 0. Hover/focus-visible state: translate-y 0 + opacity 1, `transition: opacity, translate 150ms cubic-bezier(.4,0,.2,1)`. Styling: bg #2c2826, radius 6px, `px-2.5 py-1.5` (10/6px), shadow-md, white-space nowrap, flex-col. Line 1 is the name (10px/13.33px #fff). Line 2 is "{h:mm AM/PM} local time" in mono 8px/10.67px rgba(255,255,255,.6), tabular-nums, computed with `Intl.DateTimeFormat('en-US',{timeZone, hour:'numeric', minute:'2-digit'})` and refreshed every 30s. The hovered avatar gets z-10.
- Body: "Conductor is now *multiplayer*. Share a workspace link (⌘⇧C) with teammates, see who is active, follow work you care about, and prompt agents together in real-time." (`multiplayer` is wrapped in `<em>`, which renders italic.)
- **Demo card** 704x396 (`aspect-video`), flex centered, `px-10` at sm (40px; px-6 base). `ul.max-w-sm` (384) flex-col gap 16px, py 8px, select-none, aria-hidden. 5 rows `li.flex.items-center.gap-2` (8px), each 24px tall:
  - avatar 24x24 round + green dot (absolute -bottom-0.5 -right-0.5, 8x8, bg #00c758, ring 2px #fff)
  - name, 14px/20px #756f6c: **Ludwig** (beethoven.jpg), **Wolfgang** (mozart.jpg), **Clara** (clara-schumann.jpg), **Johann** (bach.jpg), **Frédéric** (chopin.jpg)
  - a `span.relative` holding either the typing indicator (16x16 div, `bg-current` #756f6c, mask `url(/animations/typing.webp)` center/contain/no-repeat) or a message bubble
  - Message bubble: absolute `left-0 top-1/2 -translate-y-1/2`, `w-max` nowrap, bg #faf7f5, color #594545, 14px/20px, `px-3 py-2` (12/8px), radius 6px. Measured 300x38 for "shipped the fourth movement for Clara".
  - @mentions inside bubbles render as chips: `inline-flex h-5` (20px), gap 4px, radius 4px, 1px #eae8e6 border, bg #fff, `px-1.5` (6px), 12px/12px #2c2826, translateY 0.09em, `align-text-bottom`, with a 12x12 round portrait.
  - Messages (composer → messages[]):
    - Ludwig: "shipped the fourth movement for @Clara" / "can't hear the CI alarms, sorry" / "@Clara rewrote the finale, again"
    - Wolfgang: "@Ludwig MORE FORTISSIMO!!" / "one-shotted @Ludwig's review" / "@Ludwig no notes needed, it's done"
    - Clara: "reviewing @Ludwig's PR" / "left a few comments" / "on tour, but the agents are running"
    - Johann: "refactored @Wolfgang's patch into a fugue" / "every voice passes @Clara's tests now" / "rebasing on the Well-Tempered branch"
    - Frédéric: "nocturne deployed for @Clara" / "tiny patch for @Johann, very delicate" / "please review quietly"
  - Timing: see M6.

### 5. "A cloud sandbox for every agent."
- Body: "Conductor Cloud runs on isolated microVMs with your repos and dependencies pre-installed. Sandboxes spin up in seconds so your agents can run for hours."
- **Demo card** 704x396 (`aspect-video`, `relative`). Faux Conductor window (`flex size-full bg-white`), aria-hidden.
  - **Sidebar** `aside`: `w-44` (176px; w-36 = 144 below sm), bg #fafaf9, `border-r 1px #eae8e6`, flex-col.
    - Title bar `h-8` (32) `px-3` (10px below sm), justify-between. Left: traffic lights, three 10x10 circles gap 6px (#ff6568, #fcbb00, #05df72) with `inset 0 0 0 .5px rgba(0,0,0,.28)`. Right: flex gap 8px #756f6c with lucide panel-left 14px (stroke 1.5), arrow-left 12px and arrow-right 12px (both hidden below sm).
    - App row `h-8 px-3 gap-2`: icon 20x20 radius 6px (`/assets/img/demos/conductor-app-icon.png`), then "Conductor" at 12px/16px weight 500 #2c2826 (11px below sm).
    - Nav block `px-2 py-0.5 space-y-0.5`. Rows are `h-7` (28) `rounded-md px-2 gap-2` #756f6c, with lucide icons at 14px stroke 1.5:
      - house + "Home" (12px; 10px below sm). On the right (`ml-auto`, `-space-x-1`, hidden below sm) are three 16x16 round avatars with a 1px #fafaf9 border: `/assets/img/demos/charlie.jpg`, `/assets/img/demos/jackson.jpg`, `/assets/img/demos/clara-schumann.jpg`.
      - plus + "Create".
    - Workspaces block `mt-1 px-1 pt-1`:
      - label "My workspaces", 10px/15px #756f6c, `px-1.5 mb-1` (9px below sm)
      - row `h-7 px-1.5 gap-2`: icon 16x16 (radius measured 8px; `/assets/img/meta/icon.png`), "Discussing favorite conductor" (12px, truncate, flex-1), "9m" (10px tabular)
      - row "New cloud workspace" (12px weight 500 #2c2826) with "now" (10px #756f6c). Its hidden state is `opacity:0; filter: blur(4px); translate: 0 4px` and it reveals in M7.
  - **Main** (flex-1, bg #fff):
    - Top bar `h-10` (40; h-8 below sm) `border-b` `px-3`. Holds a 14x8 cloud-loader plus "New cloud workspace" (12px weight 500; 9px below sm). Hidden state is `opacity:0; blur(4px)`.
    - Body `px-6 pt-10` (24/40px), content `max-w-md` (448). The block's hidden state is `opacity 0, blur 4px, translate 0 8px`.
      - Status pill: `w-fit rounded-lg (8px) bg #fafaf9 p-3` (12px). Holds a 24x14 cloud-loader and the label at 14px/20px weight 500 #2c2826 (10px below sm). Labels: "Building snapshot" → "Preparing workspace" → "Done".
      - Log `mt-3 h-28` (112px) `px-2` overflow-hidden, mono 12px/18.4px (`leading-[1.15rem]`) #756f6c tabular-nums. Below sm it is 8px / 12.8px line-height, h-20, mt-2.
        - First row (h 18.4) is a right-aligned elapsed timer "0ms" → e.g. "2053ms".
        - Each log line is `› ` (with mr-2) + text, nowrap. The final "sandbox ready" line is #16a249 with a `✓` prefix.
        - Lines: "booting Firecracker microVM", "restoring repository snapshot", "fetching latest from origin/main", "initializing Claude Code", "sandbox ready".
  - **Shortcut video layer**: absolute inset-0 z-20 with a `<video autoplay muted playsinline disablePictureInPicture preload=auto class="size-full object-cover">`, src `/assets/video/cmdn.mp4` (640x360 H.264 + AAC, 1.366s). Opacity transition 250ms ease-out.
  - Cloud-loader: see M8 (SVG source in `/assets/svg/cloud-loader.svg`).
- Link below the card: "Learn more about Cloud" → `/docs/cloud/faq`. 14px weight 500 #2c2826, `underline decoration-border` (#eae8e6), `underline-offset-4`, flex gap 8px, lucide arrow-right 16px. **Hover: decoration-color #2c2826 (150ms); arrow translate-x 4px (200ms).** At 1440 it is at y=2913, w 183.

### 6. "Bring your own subscriptions and keys."
- Body: "Conductor runs the first-party Claude Code, Codex, Cursor, and OpenCode agents under the hood."
- **Demo card** 704x**440** (`sm:aspect-[8/5]`; aspect-video below sm). Inner is `p-6` flex-centered at sm+ (below sm: `p-4`, overflow-y auto). Content column `max-w-lg` (512).
  1. User bubble: `ml-auto max-w-[82%]` (92% below sm), radius 8px, bg #faf7f5, color #594545, 14px/19.25px (leading-snug; 11px below sm), `px-3 py-2`. Text: "get a review from gpt 5.6 sol to see if you can come up with any risks that this might incur or ways we could make it better, and then put up a PR". Measured 420x74.
  2. `mt-8 space-y-8` (32px; 28px below sm). Step **GPT-5.6 Sol**: flex gap 8px, OpenAI mark 16px with mt 2px, color #2c2826 (`/assets/svg/openai-mark.svg`). Name at 12px weight 500 leading-none. Message `mt-1`, 12px/16.5px #756f6c, flex gap 6px:
     - working text: "Reviewing the proposed fix for risks…", shown with a 12px `working.webp` mask spinner
     - complete text: "Found the retry dependency and outlined a safer fix."
     - Tool row `mt-2`, gap 4/6px: lucide file-text 14px stroke 1.5 #756f6c, then "Conductor API" (12px #2c2826), then "create_session" (mono 10px #756f6c).
  3. Second user bubble: "start a new session with fable and ask: is there a way to fix this that doesn't depend on retries? can we ensure the process just works correctly the first time?"
  4. Step **Fable 5**: icon color **#D97757** (`/assets/svg/claude-fable-mark.svg`). Working text "Starting a new session to rethink the fix…"; complete text "Fix ready without retries. Opening the pull request."
  5. Result `mt-8`: flex gap 8px, 12px #16a249, lucide git-pull-request-arrow 14px, then "PR #482 ready for review" (weight 500).
- Any element not yet reached by the phase is rendered with `visibility:hidden` (class `invisible`), so it keeps its layout space and the card never resizes.

### 7. "Conduct from anywhere."
- Body: "Conduct from the desktop app, mobile, or your own integrations to the Conductor API."
- Image card: `rounded-xl border overflow-hidden`, `<img class="h-auto w-full">` `/assets/img/demos/conductor-mobile-dock.jpeg` (1825x862), alt "Conductor in the iPhone app dock". Rendered 702x331.
- Buttons row: `grid grid-cols-3 gap-2` (8px), mono 14px/20px (12px/16px below sm). Each button is h 36 (`h-9`), radius 6px, 1px #eae8e6 border, bg #fff, #2c2826 text, centered. **Hover bg #fafaf9** (transition-colors):
  - "macOS" is a `<button>` that opens the Download dialog
  - "iOS" → https://apps.apple.com/us/app/conductor-build/id6791228564 (target _blank)
  - "API" → `/docs/api`
  - At 1440 each is 229.33 wide, y=4194.

## 8. Testimonials
- Lazy-mounted: a placeholder `section.min-h-[30rem] pb-16 pt-6 md:px-8` is replaced when an IntersectionObserver fires (threshold 0.01). Document height grows from 6121 to 6541 at 1440.
- `section.px-8.py-32` at sm+ (32px sides, 128px top/bottom; py-24 = 96 below sm). `max-w-6xl` (1152, x=144 at 1440).
- Grid: 2 columns from md (528 + 528), `gap-x-24` (96px) at lg (64 below lg), `gap-y-24` (96px). Single column below md.
- Card: an optional `<a class="group block" target=_blank>` wrapping:
  - `blockquote` 24px/32px weight 600 tracking -0.6px #2c2826 text-pretty (20px/28px below sm). Text is wrapped as `“` + quote + `”` with no spaces.
  - Meta row `mt-6` (24px), flex gap 12px, `w-fit`. **Hover (group): opacity 0.7, 150ms.**
    - avatar 40x40 round with a 1px #eae8e6 border
    - name 14px weight 500 #2c2826 + verified badge 16px (`/assets/svg/verified-badge.svg`, currentColor #2c2826) + optional company icon 16px (radius 3px, object-contain), all in a row with gap 4px
    - subtitle 14px #756f6c, truncate
- Entries (in order):
  1. "Conductor Cloud has made me so much more productive and I don't have to keep my Macbook Pro cracked open anymore": **Garry Tan**, verified, company icon `/assets/img/logos/yc.png`, "President & CEO, Y Combinator", avatar `/assets/img/testimonials/garry.jpg`, link https://x.com/garrytan/status/2092062231488061584
  2. "Conductor is arguably as big of a productivity boost as Anthropic is.": **Josh Pigford**, not verified, "Serial founder", `josh.png`, https://x.com/Shpigford/status/2054717330978914719
  3. "It finally feels like I have a build tool that works the way I want it to.": **Brandon Leonardo**, verified, icon `/assets/img/logos/instacart-favicon.png`, "Co-founder, Instacart", `brandon.png`, https://x.com/shiftb
  4. "It took some adjustment, but now I can't imagine building without @conductor_build": **Cole Bemis**, verified, icon `/assets/img/logos/notion.svg`, "Design Engineer, Notion", `cole.jpg`, **no link** (rendered without the `<a>`)
  5. "I'm officially Conductor pilled 🔥": **Brian Lovin**, verified, icon notion.svg, "@brian_lovin", avatar `/assets/img/testimonials/brian-lovin.jpg`, https://x.com/brian_lovin
  6. "This is the future": **Guillermo Rauch**, verified, no icon, "CEO, Vercel", `guillermo.jpg`, https://x.com/rauchg
- Card y-positions at 1440: rows at 4422, 4678 and 4902 (heights 160, 128, 96). Columns at x=144 and x=768.
- The verified badge was not visible in the raw dump measurement, but the JS renders it whenever `verified:true`.
- Footer link `mt-12` (48px): "See what people are saying" → https://x.com/search?q=%40conductor_build&src=typed_query. Same style as "Learn more about Cloud".
- Scroll reveal: M4.

## 9. Changelog
- `section.border-t.bg-white`, `px-8 py-24` at lg (96px top/bottom; sm: px-6 py-24; base: px-4 py-16). `max-w-6xl` (1152). y=5194 to 5696 at 1440.
- `h2` (24px/32px 600 -0.6px) contains the link "Changelog" → `/changelog` (no hover style).
- Quote link `mt-5` (20px): “The speed and fury with which the Conductor team ships is magnificent to behold.” → https://x.com/kennyliu/status/1950364590841483673?s=20. Style is 14px/24px italic #756f6c, `underline decoration-border underline-offset-4`. **Hover color #2c2826.**
- Cards `mt-10` (40px): `md:grid md:grid-cols-3`, gap 16px, each 373.33 wide at 1440. Below md it becomes a horizontal scroller: `flex snap-x snap-mandatory overflow-x-auto -mx-4 px-4 pb-2`, cards `w-[min(82vw,24rem)]` (320px at 390), `snap-start`.
  - Card: `<a>` with 1px #eae8e6 border, **no radius**, bg #fff, padding 24px. **Hover: border-color rgba(44,40,38,.3) (transition-colors 150ms); h3 opacity .7.**
  - Card content: a row (gap 12px) with a version badge and a date, then an h3 with `mt-5` (20px), 16px/24px weight 600, line-clamp 2.
  - Badge: 12px/16px uppercase tracking 0.6px, bg #f8f7f6, 1px #f3ece7 border, color #7d5e59, radius 2px, padding 2px 4px, tabular-nums, 51x22.
  - Cards:
    1. `0.91.0` · "October 15, 2026" · "A (mostly) boring update" → `/changelog/0.91.0-a-mostly-boring-update`
    2. `0.90.0` · "October 2, 2026" · "Conductor for iOS" → `/changelog/0.90.0-conductor-for-ios`
    3. `0.89.1` · "September 29, 2026" · "GPT-6.1 Sol" → `/changelog/0.89.1-gpt-6-1-sol`
  - (These are live data; they will drift as the original ships updates.)
- "View all" `mt-14` (56px) → `/changelog`. 14px #756f6c, inline-flex gap 8px, arrow-right 16px. **Hover color #2c2826; arrow translate-x 4px.**

## 10. CTA: "Be like this guy."
- `section.relative.isolate.mx-auto.flex.max-w-7xl.w-full.items-center.justify-center.overflow-hidden.bg-white`. `min-h-[32rem]` (512) at sm+ and `min-h-[24rem]` (384) below. At 1440 it is 1280 wide, centered (x=80), y=5696.
- Background layer `absolute inset-0 -z-10` with mask `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.12) 3%, rgba(0,0,0,.35) 7%, rgba(0,0,0,.65) 12%, rgba(0,0,0,.88) 16%, #000 20%, #000 100%)`. Layers inside, bottom to top:
  1. `<img>` fill + object-cover: `/assets/img/conductor-orchestra.webp`, alt "A conductor leading an orchestra in front of a packed audience"
  2. `div.absolute.inset-0` bg rgba(0,0,0,.4)
  3. At **xl+ only** (1280+), left and right edge fades, each 96px wide (`w-24`): `linear-gradient(to right, #fff, transparent)` on the left and `to left` on the right.
- Content `flex flex-col items-center px-4`:
  - H2 centered, white, weight 700, tracking -0.025em, 36px/40px (24px/32px below sm): "Be like this guy." `<br>` "Try Conductor."
  - Button `mt-8` (32px) "Download now": 164x40, bg #fff, text #000, 14px weight **700**, `px-5` (20px), radius 6px, shadow-lg, justify-between, gap 8px. The icon slot is 16x16 with two stacked lucide icons:
    - download (`/assets/svg/icon-download.svg`), visible at rest
    - arrow-down (`/assets/svg/icon-arrow-down.svg`), at rest `translate-y-2` (8px) + opacity 0
    - **Hover:** download moves `-translate-y-2` and goes to opacity 0; arrow-down moves to translate 0 and opacity 1. `transition: all 200ms cubic-bezier(.4,0,.2,1)`. Hover bg stays #fff.
  - Opens the Download dialog.

## 11. Footer
- `footer.relative.overflow-hidden.border-t.bg-#fafaf9`, `px-8` at sm (24px below), `pt-16 pb-12` (64/48). Font is sans (see 0.1). Inner is `max-w-6xl` (1152).
- Grid: 4 columns from md (2 below), `gap-x-12` at lg (48px; 32 below), `gap-y-10` (40px). Each column is flex-col gap 12px, with a bracketed heading (14px #756f6c) above a link list (flex-col gap 8px, 14px #2c2826). **Link hover color rgba(44,40,38,.7).**
  - **[Company]:** Team (/join-us#our-team), Blog (/blog), Enterprise (/enterprise), Join us (/join-us)
  - **[Resources]:** Docs (/docs), Changelog (/changelog), Brand kit (/brandkit)
  - **[Legal]:** Privacy (/privacy), Terms (/terms)
  - **[Connect]:** X (https://x.com/conductor_build), YouTube (https://www.youtube.com/@conductor_build), Reddit (https://www.reddit.com/r/conductorbuild), Discord (https://discord.gg/RSrYmstWzy). All `target=_blank`.
- Bottom row `mt-16` (64px), flex-wrap, gap 8px/16px:
  - "© 2026 Melty Labs" (14px #756f6c)
  - "SOC 2 Type II" link → https://trust.conductor.build/. 14px #756f6c, gap 6px, lucide shield-check 16px (`/assets/svg/icon-shield-check.svg`). **Hover color #2c2826.**
- At 1440 the footer spans y=6208 to 6541 (h 333).

## 11b. Download dialog (Base UI Dialog; opened by header Download, "macOS" and "Download now")
- Backdrop: `fixed inset-0 z-50` bg rgba(0,0,0,.5). Opacity transition 200ms cubic-bezier(.4,0,.2,1), starting and ending at opacity 0.
- Popup: fixed and centered (`left-1/2 top-1/2 -translate-1/2`), `w-[calc(100%-2rem)] max-w-md` (448), radius 8px, 1px #eae8e6 border, bg #fff, padding 24px, shadow-lg. Measured 448x294 at 1440. Transitions opacity + scale over 200ms; enter/exit go from scale .95 and opacity 0.
- Contents:
  - Header block `flex-col gap-1.5 mb-4 pr-8`: H2 "Download Conductor" (16px/24px weight 600 #2c2826) and p "Choose the build for your Mac." (14px #756f6c).
  - Primary button (`mb-4`, full width, h 48 via `py-6`). bg #2c2826, text #fff, weight 500, radius 6px, `px-3`, justify-between, hover bg rgba(44,40,38,.9).
    - Left: Apple logo 20x20 (`/assets/svg/apple-logo.svg`) + "Download for Mac" + "Apple silicon" (opacity .7).
    - Right: `kbd` 24x24, radius 6px, 1px rgba(255,255,255,.2) border, bg rgba(255,255,255,.2), with lucide corner-down-left 14px (`/assets/svg/icon-corner-down-left.svg`).
    - **Target URL not captured** (it triggers a download via JS). The Intel link pattern suggests `https://cdn.crabnebula.app/download/melty/conductor/latest/platform/dmg-aarch64`, but this is UNVERIFIED.
  - Secondary link (`mb-6`, full width, h 50): "Join Windows/Linux waitlist" + arrow-right 16px → https://docs.google.com/forms/d/1jPQsC8oLNIyjHW3WOsUxK2XNm0Z-BAzdooZuMs9cbFM/edit. Styling: 1px #eae8e6 border, bg rgba(255,255,255,.5), `backdrop-blur-md` (12px), weight 500, radius 6px. Hover: bg #fafaf9, text #2c2826.
  - Footnote 14px #756f6c: "Mac older than November 2020? " followed by a link "Download for Intel-based Macs" (#2c2826, hover underline) → https://cdn.crabnebula.app/download/melty/conductor/latest/platform/dmg-x86_64
  - Close button: absolute `right-3 top-3`, 28x28, radius 6px, #756f6c, lucide x 16px, sr-only "Close". Hover: bg #fafaf9, text #2c2826.

---

## 12. Motion (all measured or read from the shipped JS/CSS)
Techniques used: CSS transitions, CSS `@keyframes`, React `setInterval` state machines, IntersectionObserver, `requestAnimationFrame`, animated WebP used as CSS `mask-image`, and one `<video>`. **No framer-motion, GSAP or Lottie.**

**Important:** the `animate-in fade-in slide-in-from-bottom-1 / slide-in-from-left-1 / fill-mode-backwards` classes in the markup have **no CSS rules** in the shipped stylesheet (tw-animate-css is not bundled). Measured `animation-name: none` on every one of them. Elements with those classes (multiplayer rows and bubbles, sandbox labels and log lines, orchestration items) **appear instantly** with no fade or slide. The inline `animation-delay: 0/180/360/540/720ms` on multiplayer rows is likewise inert. To be pixel-faithful, do **not** add entrance animations for them.

All effects respect `prefers-reduced-motion: reduce`. In that mode they jump to the final state and timers stop.

| id | element | trigger | behavior |
|---|---|---|---|
| M1 | Hero H1 line 2 scramble | `setInterval` 3000ms from mount, runs forever | Phrases `["in the cloud.", "on your Mac.", "from your iPhone."]`, starting at index 0 with no scramble on mount (`playOnMount:false`). Every 3000ms the index advances (mod 3) and runs the **`use-scramble`** hook with `{speed:0.7, scramble:3, range:[97,122] (a–z), ignore:[" ","."], overdrive:false, step:1, chance:1, seed:1, tick:1, overflow:true}`. Frame gate is `1000/(60*0.7)` = 23.8ms, which at 60Hz rAF gives ticks about every **33ms**. Each tick locks the next character position left to right. A newly reached char shows `3 + rand(0..2)` random lowercase letters before settling, and 1 random already-unlocked position (seed) is re-scrambled per tick. Old text beyond the new length is trimmed one char per tick. Measured duration per transition is about 530–600ms (16–18 ticks). Spaces and periods are never scrambled. Sample frames: "vrom ywur iPhne" → "in tor sk iph" → "in the gbwskm" → "in the clouf." → "in the cloud.". |
| M2 | Hero wordmark | page load | Animated WebP mask `conductor-logo.webp`: 157 frames, 3060ms, **loop count 1** (plays once, then rests on the final frame). Frame delays are 17/34ms with one 357ms hold. |
| M3 | Hero H1 fade | first rAF after hydration | opacity 0 → 1, `transition: opacity 500ms cubic-bezier(0,0,0.2,1)`. |
| M4 | Testimonial cards | IntersectionObserver per card, threshold 0.1, fires once | From `opacity:0; translate: 0 16px` (`translate-y-4`) to `opacity:1; translate:0 0`, `transition: opacity, translate 500ms cubic-bezier(0,0,0.2,1)`, `transition-delay: index*50ms` (0, 50, 100, 150, 200, 250ms). Live samples confirmed intermediate values (e.g. opacity .44 with translateY 8.93px). |
| M5 | "100k+" counter | IntersectionObserver threshold 0.4 | Initial state is 100 ("100k+"). If the section is already intersecting on the observer's first callback, nothing happens. Otherwise, when scrolled into view: rAF tween over **1400ms**, `n = round(100 * (1 - (1-t)^3))` (easeOutCubic), shown as "0" when n=0, else `${n}k+`. Runs once. |
| M6 | Multiplayer demo | IntersectionObserver threshold 0.3 (toggles; leaving the viewport resets) | Loop while visible: wait **1400ms** with all rows showing the typing mask, then show one bubble for **2600ms**, then hide it, and repeat. Bubble sequence counter `o`: composer `o % 5`, message `floor(o/5) % 3`, so the order is Ludwig#1, Wolfgang#1, Clara#1, Johann#1, Frédéric#1, Ludwig#2, and so on. The bubble replaces that row's typing icon (it is absolutely positioned at left 0, vertically centered). It appears/disappears instantly. Measured: first bubble at +1419ms, hidden at +4078ms, next at +5493ms. Typing icon is `typing.webp` (63 frames, 1088ms, infinite loop) used as a mask over `bg-current` #756f6c. |
| M7 | Cloud sandbox demo | IntersectionObserver threshold 0.3 (toggles; leaving resets to phase 0) | Phase durations `[350, 1400, 250, 900, 900, 2800]` ms, so the cycle is 6600ms. Phase 0: empty window. Phase 1: shortcut video layer (opacity 1) playing `cmdn.mp4` (1.366s, autoplay muted). Phase 2: video layer fades to opacity 0 (250ms ease-out) while the content reveals, and the timer starts. Phases 2–3: label "Building snapshot", logs 1–2. Phase 4: "Preparing workspace", logs 1–4. Phase 5: "Done", all 5 logs with the last one green ✓, loader state `live`, timer frozen. The timer text updates every 50ms with `${Math.round(now - start)}ms` (measured final value about 2053ms) and resets to "0ms" at phase 0. Reveals at phase ≥2: sidebar "New cloud workspace" row goes from `opacity 0, blur(4px), translateY 4px` to visible with `transition: opacity, filter, translate 500ms cubic-bezier(0,0,0.2,1)`; top-bar title goes from `opacity 0, blur 4px` over 500ms ease-out; main block goes from `opacity 0, blur 4px, translateY 8px` over 500ms `cubic-bezier(0.2,0,0,1)`. They go back to hidden at phase 0 via the same transition. Measured timeline: empty → shortcut at +358ms → Building +1385 → Preparing +1149 → Done +919 → empty +2803. |
| M8 | Cloud loader (14x8 and 24x14) | while state=`loading` | SVG viewBox 0 0 140 80 with 18 dots r=7.2 at (x,y,delayFrame): (50,10,3.6) (70,10,5.4) (30,30,3.78) (50,30,5.58) (70,30,7.38) (90,30,9.18) (10,50,3.96) (30,50,5.76) (50,50,7.56) (70,50,9.36) (90,50,11.16) (110,50,12.96) (30,70,7.74) (50,70,9.54) (70,70,11.34) (90,70,13.14) (110,70,14.94) (130,70,16.74). Base layer fill `var(--muted-foreground)` at opacity .26 (loading), .72 (done) or 1 (live). Accent layer (loading only) fill `var(--foreground)` with `animation: cloud-loader-dot-shimmer 916.667ms cubic-bezier(0.333,0,0.667,1) infinite`, `transform-box: fill-box; transform-origin: center`, `animation-delay: calc(-(Date.now() % 916.667)ms + delayFrame*16.667ms)`. Keyframes: 0% {opacity 0, scale 0} 10.91% {1, 1.08} 25.45% {.58, .88} 41.82% {.2, .78} 56.36% {0, .72} 100% {0, .72}. Live state: both colors `var(--positive)`, no accent layer. Static markup is in `/assets/svg/cloud-loader.svg`. |
| M9 | Orchestration demo | IntersectionObserver threshold 0.3, **starts once and never resets** | Phase `u` 0→7 then back to 0, looping. Interval for the current phase is 450ms when u=0, 2800ms when u=7, and 500ms otherwise, so the cycle is 6250ms. Visibility (`visibility:hidden` until reached): user bubble u≥1; GPT step u≥2 (shows working text + `working.webp` 12px mask spinner, which is 48 frames/816ms looping; switches to complete text at u≥3); "Conductor API create_session" tool row u≥3; follow-up bubble u≥4; Fable step u≥5 (complete at u≥6); "PR #482 ready for review" u≥7. At u=0 everything is hidden again. Items appear instantly (see note above). |
| M10 | Header nav overflow mask | CSS scroll-driven: `animation: top-nav-scroll-mask-x linear; animation-timeline: scroll(self inline)` | Only visible when the nav overflows horizontally (narrow md widths). Two intersecting linear-gradient masks fade the left and right edges over `1.5rem`. `@property --top-nav-scroll-mask-l-from/-r-from` (length-percentage, initial 100%). Keyframes: l-from 100% → `calc(100% - 1.5rem)` by 10%; r-from `calc(100% - 1.5rem)` until 90% → 100%. Scrollbar hidden. |
| M11 | Hover transitions | hover | Covered in each section. Summary: colors 150ms `cubic-bezier(.4,0,.2,1)`; arrow icons `translate-x-1` (4px) over 200ms; download-icon swap 200ms; tooltip opacity+translate 150ms; testimonial meta opacity .7 over 150ms; changelog h3 opacity .7 (150ms) + border rgba(44,40,38,.3). |
| M12 | Download dialog | click | Backdrop opacity 0→1 over 200ms; popup opacity 0→1 + scale .95→1 over 200ms `cubic-bezier(.4,0,.2,1)`; reversed on close. |
| M13 | Avatar tooltips' local time | `setInterval` 30s | Re-renders the time string. |

No parallax, no marquee, no scroll-linked transforms on page sections. Feature sections themselves have no entrance animation.

---

## 13. 1280 deltas (from `recon/raw-1280.json`; doc height 6438)
Same CSS as 1440 (both xl). Differences come from width only:
- Header grid spans the full 1280 (`max-w-7xl` = viewport), padding 32px.
- App shot: 1216x786.3 at x=32, y=479.3.
- Section y-positions: Trusted 1321.6 (h248), Multiplayer 1569.6 (h640), Sandbox 2209.6 (h684), Orchestration 2893.6 (h684), Anywhere 3577.6 (h613.3), Testimonials 4190.9 (h900, content x=64 to 1216), Changelog 5090.9 (h502), CTA 5592.9 (h512, full 1280 wide with edge fades flush to the viewport edges), Footer 6104.9 (h333).
- Feature column x=288 (section x=256).

## 14. 390 mobile deltas (from `recon/raw-390.json`; doc height 5550; screenshot `recon/original-390-full.png`)
- **Header:** px 16, nav hidden, menu button 36x36 at x=338. Logo link at x=16.
- **Hero:**
  - Section `px-4 pt-20` (16/80). Wordmark 192x29.3 at y=137.
  - H1 at y=198, 358 wide, **26.36px / 39.54px** (= min(30px, 7.4vw − 2.5px); line-height inherits 1.5), letter-spacing -0.659px. Lines: "Run a team of coding agents" / phrase (each line 40px tall).
  - CTA grid is one column: Get Conductor 358x40 at y=310; quote 358 wide, 2 lines (48px), attribution at y=422.
  - Background image 390x544 (min-h 34rem, cover-cropped).
  - App shot `mt-8 mb-10 px-4`: 358x232 at y=474.
- **Trusted:**
  - y=745, h220. Heading 20px/28px, letter-spacing -0.5px.
  - Grid gap 16, cols 77.5, cells 32px tall. Logo heights: Linear 16 (64w), Vercel 14 (70w), Notion 20 (58w), Ramp 20 (75w), YC 78x16 (cell-limited), Square 16, PostHog 20 + 14, Spotify 16.
- **Features (shared):** padding 48px 16px, gap 24. H2 20px/28px -0.5px. Body 14px/20px.
  - Multiplayer y=965 (h441). Avatar stack wraps on the same line at x=280. Demo 358x201, `px-6`.
  - Sandbox y=1406 (h465):
    - Card 358x201. Sidebar 144 wide, title bar px 10.
    - Text sizes: "Conductor" 11px/16.5, Home/Create 10px/15, "My workspaces" 9px/13.5, row text 10px, "9m"/"now" 8px/12, main title 9px/13.5. Home avatars hidden. Top bar h 32. Main padding 32px 12px 0.
    - Status label 10px/15. Log mono 8px/12.8, h 80.
    - "Learn more about Cloud" at y=1804.
  - Orchestration y=1872 (h401):
    - Card is `aspect-video` (358x201) with `overflow-y:auto` and `p-4`. The content is taller than the card, so it scrolls inside the card.
    - Bubbles 11px/15.125px with `max-w-[92%]`. Model names 11px/11px. Messages 11px/15.125. Tool "create_session" 9px/13.5. Result 11px/16.5. Spacing 28px.
  - Anywhere y=2273 (h430). Image 356x168. Buttons 114x36 each, 12px/16px mono.
- **Testimonials:** y=2703, h1488, `py-24` (96) px 32. Single column 326 wide, row gap 96. Quotes 20px/28px -0.5px. Meta unchanged (40px avatar, 14px text). Link at y=4075.
- **Changelog:**
  - y=4191, h466, padding 64px 16px. H2 20px/28px. Quote wraps to 2 lines (48px).
  - Cards row is a horizontal snap scroller: margin 0 −16px, padding 0 16px 8px, gap 16. Cards 320x116 (`min(82vw, 24rem)`), scrollWidth 1023.
  - "View all" at y=4572.
- **CTA:** y=4657, 390x384 (min-h 24rem). Edge fades hidden (<xl). H2 24px/32px weight 700, -0.6px, 2 lines. Button 164x40 at y=4877.
- **Footer:**
  - y=5041, h509, padding 64px 24px 48px. 2-column grid (155 + 155, gap-x 32, gap-y 40). Order is Company and Resources on row 1, Legal and Connect on row 2.
  - Bottom row at y=5482.
- **Original quirk:** at 390 the document `scrollWidth` is **402px**. The invisible (opacity 0) Mozart tooltip in the H2 avatar stack overflows to x=402, so the page can scroll horizontally by 12px. The full-page screenshot is therefore 402px wide. Replicate this only if exact fidelity is required.

---

## 15. Gaps / not measurable
- **Hover states** were derived from the shipped class names plus resolved tokens. They were not captured by synthetically hovering each element; the arithmetic is exact (e.g. `hover:bg-foreground/90` = rgba(44,40,38,.9)).
- **Apple-silicon download URL** is not captured, because the button triggers JS (PostHog event + download). The Intel URL is verified. The aarch64 URL is a guess and marked UNVERIFIED in §11b.
- **Mobile menu open state** was taken from JS source (classes listed in §1), not from a live measurement.
- **Dark theme** was not rendered or measured. The tokens are listed for reference only.
- **Changelog entries, dates, avatar local times and the "100k+" figure** are live data and may change.
- **Verified badge** is rendered from JS (`verified:true`); its 16px size comes from the `size-4` class. It was not in the raw dump's element list.
- **Animated WebP frames** (logo, typing, working) are raster. They are reproduced by reusing the original files as masks, not re-implemented.
- Analytics (PostHog, Cloudflare beacon, rocket-loader) are intentionally excluded.
