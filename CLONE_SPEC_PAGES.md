Source: https://www.conductor.build/

# Conductor standalone marketing pages: clone spec

Routes: `/pricing`, `/enterprise`, `/team-plan`, `/slack`, `/join-us`, `/brandkit`, `/privacy`, `/terms`.
This file only covers what **differs** from `CLONE_SPEC.md` (homepage). Tokens, header, footer geometry, the Download dialog and the "Trusted by" strip are all defined there.

Measured on 2026-10-22 with a standalone Playwright 1.63 Chromium (headless, macOS). Each page was loaded at 1440x900, 1280x900 and 390x844. Values come from getComputedStyle and getBoundingClientRect, from real `hover()` before/after diffs, from clicks (dialog, copy, form submit), from `document.getAnimations()`, and from the shipped CSS rules.

Recon files:
- Raw dumps: `recon/pages/raw/<page>-{1440,1280,390}.json`, `<page>-deep.json` (prose CSS, hover diffs), `probe.json` (fonts, mobile header, forms, copy button), `<page>-main.html` (live DOM of `<main>`).
- **Verbatim copy:** `recon/pages/content/<page>.html` holds cleaned `<main>` markup per page, with Tailwind classes kept, inline SVGs replaced by `<icon name="lucide-name"/>` and `?dpl=` stripped. Use these as the source of truth for long copy (FAQ, legal text, bios), rather than re-typing.
- Screenshots: `recon/pages/<page>-1440.png`, `recon/pages/<page>-390.png` (full page).
- Assets: `public/assets/pages/<page>/...`, mapped in `ASSETS_PAGES.md`.

---

## 0. Cross-page differences vs the homepage (read first)

### 0.1 Layout shell
The subpages use a different shell than the homepage:

```
<main class="flex flex-1 flex-col">            (font-family computes MONO here; body is mono)
  <header class="sticky z-40 font-sans" style="top:0">  (same header as homepage, see below)
  <main class="bg-background font-sans">        (page content, sans)
    <section class="site-container py-16 md:py-24"> ...page...
  <footer class="... font-mono ...">           (the footer is NOT wrapped in the sans wrapper)
```

- **FOOTER RENDERS IN REAL MONO ON ALL 8 SUBPAGES.** Computed `font-family` is `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` for `[Company]`, link text, "© 2026 Melty Labs" and "SOC 2 Type II". On the homepage the same footer renders sans because of the `--font-mono` override wrapper (CLONE_SPEC §0.1). Footer geometry, colors, links and hovers are otherwise identical: 1440 → h 333, padding 64/32/48; 390 → h 509, padding 64/24/48, 2 columns of 155 with gap-x 32.
  - Implementation: give the Footer a `mono` prop, or render subpages outside the homepage's sans wrapper.
- **Header:**
  - Markup is `header.sticky.z-40.font-sans` > `div.border-b.border-border.bg-background` > grid. Height is 57 (56 + 1px border). Same links, positions and Download button as homepage §1.
  - The header element itself is transparent. The white bg and border are on the inner div, which is visually identical to the homepage.
  - **Active nav state** (new): the current route's link gets `aria-current="page"` and color `#2c2826` (instead of rgba(44,40,38,.7)). Measured active on `/pricing` (Pricing), `/enterprise` (Enterprise) and `/join-us` (Join Us). No link is active on team-plan, slack, brandkit, privacy or terms. Weight stays 400 with no underline.
  - Measured hovers: nav link color rgba(44,40,38,.7) → #2c2826; Download button bg #2c2826 → rgba(44,40,38,.9).
  - Mobile (390): same as homepage. Menu button 36x36 at x=338,y=10, `aria-label="Open menu"`.
- **`.site-container`** (page section): `margin-inline:auto; max-width: var(--site-content-width)` with padding 96px 32px at md+ and 64px 16px below md.
  - Default content width is **900px**: at 1440 the section is x=270, w=900, and inner content spans x=302 to 1138 (836 wide).
  - Pricing overrides it with `[--site-content-width:80rem]`, which is **1280px**: at 1440 the section is x=80 and content is x=112 to 1328 (1216 wide).
  - At 1280 the pricing section is full width with content at x=32 to 1248. The 900 container is unchanged at 1280 (x=190).
- Page content starts at y=57 (directly under the header). The first heading top is at y=153 (1440) or y=121 (390).

### 0.2 Shared "PageHeader" block (enterprise, team-plan, slack, join-us, brandkit)
```
<div class="max-w-3xl mx-auto">   (team-plan: max-w-2xl; brandkit: "max-w-5xl mx-auto max-w-3xl" → renders 836 wide)
  <h1 class="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
  <p  class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
```
- h1: 36px/40px, weight 600, letter-spacing -0.9px, #2c2826, mb 16. At 390: 30px/36px, -0.75px.
- p: 16px/24px #756f6c, max-width 672. At 390: 14px/24px.
- Box at 1440 (max-w-3xl): x=336, w=768, h1 y=153, p y=209. Team-plan (max-w-2xl): x=384, w=672.

### 0.3 Shared "Prose" article (slack, join-us, enterprise intro, brandkit intro, privacy, terms)
`<article class="prose prose-sm mt-10 w-full !max-w-3xl mx-auto font-sans sm:prose">`. This is fumadocs / Tailwind Typography. It is 768 wide at x=336 at 1440, and 358 wide at 390. `mt-10` = 40px, except on privacy and terms, which have no PageHeader and no mt.

- **Font:** computed `Geist, -apple-system, "system-ui", "Segoe UI", sans-serif, ui-sans-serif, system-ui, sans-serif`. **There is no `Geist` @font-face** (only `geistSans`, which is unused) and Geist is not installed. A DOM width test gave the prose stack 389.14px, matching `ui-sans-serif, system-ui` (389.14px) exactly. So it **renders the same system sans as the rest of the site**. Use the global sans stack.
- Colors: body #2c2826 (prose body is foreground, not muted); headings #2c2826; list markers #756f6c; blockquote text #756f6c with border #eae8e6.

| element | sm:prose (≥640) | prose-sm (<640) |
|---|---|---|
| base p | 16px/28px, margin 20px 0 | 14px/24px (24.0001), margin 16px 0 |
| h1 (privacy/terms) | 36px/40px **800**, mb 32, mt 0 | 30px/36px 800, mb 24 (measured) |
| h2 | 24px/32px **700**, margin 48px 0 24px | 20px/28px 700, margin 32px 0 16px |
| strong | 600, #2c2826 | same |
| em | italic 400 | same |
| a (not `[data-card]`) | **500**, #2c2826, underline 1px (computed thickness 1px; CSS says 1.5px), offset 2.88px (CSS `3.5px`; computed 2.88px because the fumadocs override is applied later), decoration-color `color(srgb .1725 .1569 .149 / .55)` = **rgba(44,40,38,.55)**, `transition: opacity .2s`. **Hover: opacity .8** (measured). | 14px |
| ul / ol | margin 20px 0, padding-left 26px; disc / decimal | margin 16px 0, padding-left 22px |
| li | margin 8px 0, padding-left 6px | margin 4px 0 |
| ::marker | #756f6c, weight 400 | same |
| nested p inside li | margin 12px 0 | |
| blockquote | border-left 4px #eae8e6, padding-left 16px, margin 25.6px 0, italic **500**, #756f6c, with curly quotes added via `::before` open-quote / `::after` close-quote | padding-left 15.56, margin 18.67 |
| img | margin 32px 0 | margin 24px 0 |

- **Heading anchors:** each h1/h2 is `h? .flex.scroll-m-28.flex-row.items-center.gap-2` with an `id`. It holds `<a data-card href="#id" class="peer">Text</a>` followed by a lucide `link` icon 14x14 (`size-3.5`, stroke #756f6c, `opacity-0 transition-opacity peer-hover:opacity-100`, 150ms cubic-bezier(.4,0,.2,1)).
  - **The anchor text computes weight 500** (prose `a` rule), even though h1 is 800 and h2 is 700. That is the rendered weight. It has no underline and does not fade on hover.
  - Measured hover: icon opacity 0 → 1. Icon file: `/assets/pages/shared/icon-link.svg`.
- `.not-prose` children opt out of all of the above.

### 0.4 New tokens / colors (beyond CLONE_SPEC §0.2)
| token / value | where |
|---|---|
| `--secondary` = #fafaf9 (same as muted) | pricing outline button hover bg (`hover:bg-secondary`) |
| muted/50 = rgba(250,250,249,.5) | join-us "Apply to join us" card hover bg |
| muted/80 = rgba(250,250,249,.8) | brandkit link rows hover bg (resting bg is #fafaf9, so hover is slightly *lighter*) |
| `#F5F5F5` (literal `bg-[#F5F5F5]`) | join-us apply-card icon tile |
| `#282423` (literal `bg-[#282423]`) | brandkit dark preview panels |
| foreground/55 = rgba(44,40,38,.55) | prose link underline color |
| `font-mono` badge: tip-secondary #f8f7f6 bg, #f3ece7 border, #7d5e59 text | pricing "Most popular" and brandkit "Brand kit" eyebrow. On subpages `font-mono` renders **real mono** (ui-monospace…) |
| HubSpot form: label #212d3a rgb(33,45,58); input border #959494 rgb(149,148,148); required `*` and error #e51520 rgb(229,21,32); submit bg #000 | enterprise / team-plan iframe forms |

Radii used: 2px (brandkit eyebrow `rounded-xs`), 4px (`rounded-sm` file-name chips, join-us X button), 6px (buttons, fact rows), 8px (`rounded-lg` cards, pricing badge measured 8px), 12px (pricing plan cards). Shadows: none on any of these pages (other than the shared Download dialog).

### 0.5 Motion on these pages
`document.getAnimations()` after a full scroll on every page returned only the header's `top-nav-scroll-mask-x` (CLONE_SPEC M10). There are no entrance or scroll animations, no IntersectionObserver reveals, and no transforms. Only these move:
- Pricing "Trusted by **100k+**" counter (same component as the homepage, M5). It **only animates when the strip starts off-screen**:
  - At 1440 the strip is at y=701 (inside the 900 viewport), so it stays static.
  - At 390 it is below the fold. Measured samples every 100ms after scrolling it into view: 17k+, 34k+, 49k+, 62k+, 72k+, 80k+, 87k+, 91k+, 95k+, 98k+, 99k+, then 100k+ at about 1.2s, consistent with the 1400ms easeOutCubic tween.
- Hover transitions listed per page. Pricing buttons have **no transition class**, so their hover is instant. Others use `transition-colors` 150ms cubic-bezier(.4,0,.2,1), prose links use opacity .2s ease, and anchor icons use opacity 150ms.

### 0.6 Shared components summary
| component | used on |
|---|---|
| Header (with active state) | all |
| Footer (**mono** variant) | all |
| Download dialog (CLONE_SPEC §11b) | header Download on all pages; pricing "Free → Download" button (click verified; opens the identical 448x294 dialog) |
| `.site-container` | all (900 default; 1280 on pricing) |
| PageHeader (h1 + muted lead) | enterprise, team-plan, slack, join-us, brandkit (+ eyebrow badge) |
| Prose article | slack, join-us, enterprise (intro line), brandkit (intro p, `text-muted-foreground` class but prose body color wins → #2c2826), privacy, terms |
| "Trusted by 100k+ builders" logo strip (homepage §3, identical incl. counter and Spotify green filter) | pricing |
| Logo grid variant (8 logos, different set, inside prose) | enterprise |
| HubSpot embedded form | enterprise, team-plan |
| `└` tree-bullet list (`grid grid-cols-[auto_1fr] gap-x-2`) | pricing plan features and FAQ answers |

---

## 1. `/pricing`
Title "Pricing | Conductor". Meta description "Choose the Conductor plan that fits how you and your team work." Document height: 1440 → 3086, 1280 → 3086, 390 → 5390. Footer at y=2753 (1440) and y=4881 (390).

### 1.1 Layout
`section.site-container.py-16.md:py-24.[--site-content-width:80rem]` gives content x=112 to 1328 at 1440 (1216 wide), x=32 to 1248 at 1280, and x=16 to 374 at 390.
1. **H1 "Pricing"**: centered, 36px/40px weight 600, letter-spacing -0.9px, #2c2826, y=153. At 390: 30px/36px, -0.75px, y=121.
2. **Plans grid**: `div.mx-auto.mt-10.max-w-7xl > div.grid.gap-5.md:grid-cols-2.lg:grid-cols-4`. Gap 20px, top y=233 (40px below the h1).
   - 1440: 4 columns of 289px at x=112/421/730/1039. All cards are 412 tall (`h-full`, the grid stretches them).
   - 1280: same 289 columns at x=32/341/650/959.
   - md (768–1023): 2 columns, from the classes.
   - 390: 1 column, 358 wide. Cards at y=197/581/993/1355 with heights 364/392/342/402 and 20px gaps.
3. **Trusted strip** (identical to homepage §3, including the counter and the Spotify green filter): wrapper `div.mt-10.sm:mt-14` (56px), `section.px-4.pb-16.pt-6`. At 1440 it is at y=701, 1216x248, logo grid 672 wide at x=384. At 390: y=1797, h 220.
4. **FAQ** `section[aria-label="Pricing FAQ"].px-8.pt-8.text-sm.sm:pt-10` (pt 40; 32 at 390), y=949 (1440).
   - Inner `div.mx-auto.max-w-xl` (576, x=432 at 1440; at 390 x=48 w=294 because px-8 stays).
   - `dl.space-y-6` (24px between items). FAQ height at 1440: 1668.
   - The page ends after the FAQ, then 96px section padding, then the footer.

### 1.2 Plan card
`section.relative.flex.h-full.flex-col.rounded-xl.border.border-border.bg-background.p-6`. Radius 12, 1px #eae8e6 border, white, padding 24, **no shadow, no hover**. Inner width 239 at 1440 and 308 at 390.
- `h2.text-lg.font-semibold.tracking-tight`: 18px/28px weight 600, letter-spacing -0.45px, #2c2826 (card y+25).
- `div.mt-4.min-h-12` (16px gap, min height 48) holding `p.flex.items-baseline.gap-1.text-3xl.font-semibold.tracking-tight`: price at 30px/36px weight 600, -0.75px. The suffix span `text-sm font-normal tracking-normal text-muted-foreground` is 14px/20px #756f6c, baseline-aligned, with a 4px gap.
- `div.mt-6` (24) holding the button. `h-9 w-full` (36 tall), `px-3 py-4`, radius 6, 12px/16px **weight 700**, centered, `gap-2`.
  - **Dark** (Pro / Teams / Enterprise): `<a>` bg #2c2826, text #fff. **Hover bg rgba(44,40,38,.9)**, measured and instant (no transition).
  - **Outline** (Free "Download"): `<button>` 1px #eae8e6 border, bg #fff, text #2c2826. **Hover bg #fafaf9** (`hover:bg-secondary`), measured and instant. **Click opens the Download dialog** (verified: "Download Conductor / Choose the build for your Mac.", 448x294 centered).
- `div.mt-8` (32) holding:
  - Optional `p.mb-3.text-xs.font-medium.text-foreground`: 12px/16px weight 500, mb 12.
  - `ul.space-y-2.5` (10px gap). Each `li.grid.grid-cols-[auto_1fr].gap-x-2.text-xs.leading-5.text-muted-foreground` is 12px/20px #756f6c. The `<span aria-hidden>└</span>` glyph is 12px wide, then 8px gap, then the text column (219px at 1440).
- **"Most popular" badge** (Pro card only): `div.absolute.-top-3.left-5`, so it sits 12px above the card top and 20px from the card's left border edge. Measured at 1440: x=442, y=222, 111.9x22.
  - Mono (`ui-monospace…`) 12px/16px, uppercase, letter-spacing 0.6px (`tracking-wider`), #7d5e59 on #f8f7f6, 1px #f3ece7 border, padding 2px 8px. Radius measured **8px**.

Copy (exact):
| card | price | suffix | button → href | lead | items |
|---|---|---|---|---|---|
| Free | $0 | – | "Download" (button → Download dialog) | – | Run multiple coding agents in parallel / Local workspaces on your Mac / Integrate with the newest frontier and open source models / Bring your own subscriptions and keys |
| Pro (+badge "Most popular") | $50 | /mo | "Get Pro" → https://app.conductor.build/pro | Everything in Free, plus: | Conductor Cloud and a bunch of cloud workspace hours / Live collaboration with up to 5 Pro users / Conductor API / Conductor mobile app |
| Teams | $60 | /mo/user | "Get Teams" → https://app.conductor.build/teams?interval=monthly | Everything in Pro, plus: | Live collaboration for teams of any size / Admin portal / Centralized billing |
| Enterprise | Custom | – | "Learn more" → /enterprise | Everything in Teams, plus: | Data processing agreement (DPA) / Purchase-order billing / SAML SSO, SCIM / Custom security and privacy settings / SLA and dedicated support channels |

### 1.3 FAQ (static, **not an accordion**; no toggles, no buttons)
Each item is `<div><dt class="font-semibold text-foreground">Q</dt><dd class="mt-1 grid grid-cols-[auto_1fr] gap-x-2 text-muted-foreground"><span aria-hidden>└</span><div class="space-y-3"><p>…</p></div></dd></div>`.
- dt: 14px/20px weight 600 #2c2826.
- dd: 4px below. The `└` glyph is 14px wide, then an 8px gap, then the answer column (554 wide at 1440). Answers are 14px/20px #756f6c, with 12px between paragraphs. `<em>` is italic.
- Answer links: `a.underline.underline-offset-4.hover:text-foreground`. Color #756f6c, underline color = currentColor, offset 4px, all `target=_blank`. **Hover: color and underline → #2c2826** (measured; no transition class, so instant).
- Questions in order (answers verbatim in `recon/pages/content/pricing.html`):
  1. How do I get access to Cloud workspaces?
  2. What are the differences between Pro, Teams, and Enterprise plans? (3 paragraphs that start "Our *Pro plan*", "Our *Team plan*", "Our *Enterprise plan*")
  3. Can I have both a Pro plan and a Team plan? (2 paragraphs)
  4. Do I have to use API keys to set up inference in cloud workspaces?
  5. Do I have to pay an additional fee for cloud workspaces?
  6. How are cloud workspaces different from local workspaces? (2 paragraphs)
  7. What are the hardware specs of the sandboxes?
  8. What comes pre-installed on the sandboxes?
  9. Where can I learn more about Vercel sandboxes? Links: https://vercel.com/docs/sandbox (the text is the URL) and "close collaboration with Vercel" → https://vercel.com/customers/how-conductor-moved-parallel-coding-agents-from-the-laptop-to-the-cloud-with-vercel-sandbox
  10. Where are cloud workspaces hosted? Link: "us-east-1 region" → https://vercel.com/docs/regions
  11. Does Conductor have access to my data in cloud workspaces?
  12. Can you explain why data privacy is different between Cloud and Local Conductor? (2 paragraphs)
  13. Has Conductor completed a SOC 2 Type II audit? Link: "trust.conductor.build" → https://trust.conductor.build/
  14. Can I use my own cloud machines instead of Conductor's? Link: https://www.conductor.build/enterprise (the text is the URL)
- Curly apostrophes are used (Pro’s, Teams’, It’s, don’t, you’ll, Conductor’s).

### 1.4 Assets
Only the homepage logos are used (`/assets/img/logos/*`, mapped in homepage §3). No new assets.

---

## 2. `/enterprise`
Title "Enterprise | Conductor". Meta description "Conductor is the best way to run multiple coding agents in parallel. Reach out to bring Conductor to your organization." Document height: 1440 → 1613, 390 → 1871. Footer at y=1280 (1440) and y=1362 (390).

### 2.1 Sections (1440 geometry; 390 in brackets)
1. **PageHeader** (§0.2, max-w-3xl, x=336, w=768):
   - h1 "Conductor Enterprise", y=153 [121].
   - Lead "Conductor is the best way to run multiple coding agents in parallel. Reach out to bring Conductor to your organization." y=209, 2 lines (672 max) [y=173, 3 lines, 14px/24px].
2. **Prose article** `mt-10` (y=297 [285]):
   - `<p>Trusted by builders at</p>`: prose p 16px/28px #2c2826, mb 20 [14px/24px, mb 16].
   - **Logo grid** `div.not-prose.mb-10.border-b.border-border.pb-10` (40px bottom padding, then a 1px #eae8e6 bottom border, then a 40px margin). y=345, h 145.
   - Inner `div.mx-auto.grid.max-w-2xl.grid-cols-3.gap-4.sm:grid-cols-4.sm:gap-6`: 672 wide at x=384, 4 columns of 150, gap 24, 2 rows. At 390 it is 3 columns, gap 16, 3 rows.
   - Cells `flex h-8 items-center justify-center sm:h-10` (40 tall; 32 at 390). Rendered logo boxes (w x h at 1440 [390]):

| # | logo | class | 1440 | 390 | file |
|---|---|---|---|---|---|
| 1 | Linear | h-4 sm:h-6 | 96x24 | 64x16 | /assets/img/logos/linear.svg |
| 2 | Vercel | h-3.5 sm:h-5 | 100.6x20 | 70.4x14 | /assets/img/logos/vercel-light.svg |
| 3 | Notion | h-5 sm:h-8 | 92.2x32 | 57.6x20 | /assets/img/logos/notion-wordmark.svg |
| 4 | Ramp | h-5 sm:h-6 | 90.4x24 | 75.3x20 | /assets/img/logos/ramp-wordmark.svg |
| 5 | Life360 | h-5 sm:h-6, **`filter: brightness(0)`** | 79.4x24 | 66.2x20 | /assets/pages/enterprise/life360.png (1200x364) |
| 6 | Square | h-4 sm:h-6 | 95.7x24 | 63.8x16 | /assets/img/logos/square-wordmark.svg |
| 7 | Reducto | h-4 sm:h-5 | 113.4x20 | 90.7x16 | /assets/pages/enterprise/reducto.svg (924x163) |
| 8 | Spotify | h-4 sm:h-6, **no filter here** (renders in the file's own black, unlike pricing/home) | 88.6x24 | 59.1x16 | /assets/img/logos/spotify-wordmark.png |

   This grid differs from the homepage strip: there is no heading counter, the set includes Life360 and Reducto instead of YC and PostHog, and Spotify has no green filter. No hover effects.
3. **Contact form** `section#contact-sales.not-prose.-mt-4.-mb-12.md:-mb-16.scroll-mt-24`: margins -16 top, -64 bottom (-48 below md). y=514 [518].
   - Contains `<div class="hs-form-frame" data-region="na2" data-form-id="f1df7d97-c440-4b74-8f51-b020c9616e2f" data-portal-id="246368856">` plus the script `https://js-na2.hsforms.net/forms/embed/246368856.js` (Next `strategy="afterInteractive"`).
   - HubSpot injects a borderless `<iframe title="Form" scrolling="no">` at 100% width and sets the wrapper height inline: **768x734 at 1440, 358x828 at 390**.
   - **Content inside the iframe is cross-origin.** It was measured by evaluating inside the frame with Playwright.

### 2.2 HubSpot form (enterprise): measured inside the iframe (iframe-local px, 1440)
- Form padding 40px on all sides. Fonts: **Geist** (woff2 served by HubSpot: `cdn1.hubspotusercontent-na2.net/googlefonts/fonts/Geist/{regular,700}.woff2`, local copies in `/assets/pages/enterprise/fonts/`). Line-height `normal`.
- Field label: 16px/21px weight 400, #212d3a (rgb 33,45,58), mb 10. Required `*` is #e51520 directly after the text.
- Inputs: height 43, padding 10, 1px solid #959494, radius 3, bg #fff, text 16px #212d3a. Placeholder (if any) rgba(0,0,0,.64). Rows are 20px apart (label y40 → input y71 → next label y134).
  - **Hover:** `box-shadow: 0 0 2px 0 #959494`.
  - **Focus:** `box-shadow: 0 0 3px 0 #959494`. Border is unchanged.
- Fields, in order:
  1. Row 1, two columns of 329 with a 30 gap: **First name\*** (`0-1/firstname`) and **Last name\*** (`0-1/lastname`).
  2. **Job title\*** (`0-1/jobtitle`), 688 wide.
  3. **Company email\*** (`0-1/email`, type email).
  4. **Company name\*** (`0-2/name`).
  5. **Company size\***: dropdown-select (`0-2/company_size`), rendered as a read-only text input with a 12x6 down-caret (CSS triangle, border-top 6px #212d3a) at the right, 20px from the edge. Options: `1-10`, `11-50`, `51-100`, `101-500`, `500+`. Has a search box (`showDropdownSearch:true`).
  6. **Anything else you'd like to share?** (optional, `0-2/message`): label is a rich-text span 14px #2c2826 on #fff. Textarea h 64.
- **Submit** button "Submit": right-aligned (x=624 to 728, y=649), 104x45, bg #000, text #fff, 16px weight 700, padding 12px 24px, radius 3. **Hover: no change** (measured).
- **Validation** (clicked Submit with an empty form): each required field shows "Please complete this required field." in #e51520 at 16px. Input borders do not change. Screenshot: `recon/pages/raw/enterprise-form-errors.png`.
- **Post-submit** (from the form definition, not submitted live): "**Form submitted**" (30px, bold, line-height 125%) followed by "Thank you, we'll be in touch soon."
- 390: inputs 278 wide at x=40, all fields single column (first and last name stack), submit becomes full width (278x45), iframe 828 tall.
- **Build recommendation:** embed the real HubSpot form (portal 246368856, form id above, region na2) for exact fidelity. If you rebuild it natively, use the values above. Raw definition: `forms-na2.hsforms.com/embed/v4/render-definition/246368856/<formId>`.

---

## 3. `/team-plan`
Title "Conductor Teams | Conductor". Meta description "Team plans are currently invite-only. If you'd like to bring Conductor to your company, fill out the form below and we'll be in touch soon." Not linked from the nav. Document height: 1440 → 1176, 390 → 1308. Footer at y=843 (1440) and y=799 (390).

1. **PageHeader** with **max-w-2xl** (672 wide, x=384 at 1440):
   - h1 "Conductor Teams", y=153 [121].
   - Lead "Team plans are currently invite-only. If you'd like to bring Conductor to your company, fill out the form below and we'll be in touch soon." y=209 (2 lines) [173, 3 lines].
2. `article.prose.prose-sm.mt-10.!max-w-2xl` > **`div.h-[450px].overflow-y-auto`** > `div.hs-form-frame.not-prose.-mt-10` (form id **a7817add-03f3-49dc-9ffc-16c10009e49a**, same portal and script).
   - The iframe is 672x692 at 1440 (358x798 at 390) and starts at y=257 because of the -40 margin.
   - **The form lives in a 450px-tall scroll box** (y=297 to 747 at 1440). The negative margin clips the iframe's own 40px top padding, so "First name" sits flush at the box top (y≈297). The rest of the form (message textarea, Submit) **is only reachable by scrolling inside the box**. In the screenshot the "Anything else…" label is cut at the box bottom. This is an original quirk; replicate it for fidelity.
3. **HubSpot form (team-plan)**: same fields, options, validation, submit and post-submit text as §2.2, but the theme font is **`'andale mono', times`** (renders as Andale Mono on macOS). Because of that, labels are 16px with 18px line-height, inputs are **40px** tall, two columns of 281 with a 30 gap, textarea 58, submit 106x42 at x=526 to 632. Colors, borders, radii and hover/focus shadows are identical to §2.2.

---

## 4. `/slack`
Title "Conductor for Slack | Conductor". Meta description "Let the coding agents in your Conductor cloud workspaces search Slack, read threads, and post updates, acting as you." Document height: 1440 → 1975, 390 → 1922. Footer at y=1642 (1440) and y=1413 (390). No interactive pieces beyond the links and heading anchors.

PageHeader (max-w-3xl):
- h1 "Conductor for Slack", y=153.
- Lead "Let the coding agents in your Conductor cloud workspaces search Slack, read threads, and post updates, acting as you." y=209.

Prose article (`mt-10`, y=297) at 1440 [390]. Copy verbatim in `recon/pages/content/slack.html`.
| y | element |
|---|---|
| 297 [285] | p (4 lines, 768x112) "Conductor runs coding agents like Claude Code and Codex in parallel, … Everything runs as you, with your Slack permissions." |
| 441 [477] | `<img>` (no class) 768x533.1 [358x248.5], margin 32 [24], **no radius, no border**. File `/assets/pages/slack/slack-search.png` (1360x944). Alt "An agent searching Slack from a Conductor chat" |
| 1022 [757.5] | h2#connect-slack "Connect Slack" (anchor-link pattern §0.3) |
| 1078 [801.5] | ol with 3 items: "**Download Conductor**(link → `/`) and sign in." / "Open **Settings → MCP servers**, select **Slack**, and click **Connect**." / "Authorize in your browser. Slack shows the permissions you're granting and confirms the connection, and Conductor shows Slack as **Connected**." |
| 1226 [993] | p "Slack tools are picked up when a cloud workspace starts. …" (contains **Settings → MCP servers** in strong) |
| 1358 [1145] | h2#privacy-and-support "Privacy and support" |
| 1414 | p with links "Privacy Notice" → /privacy and "Terms of Service" → /terms |
| 1518 [1325] | p "Questions? Email support@conductor.build." (mailto link) |

All prose links: weight 500, rgba(44,40,38,.55) underline, hover opacity .8 over 200ms (measured).

---

## 5. `/join-us`
Title "Join us | Conductor". Meta description "We're building Conductor in San Francisco and hiring engineers and designers to shape the future of AI-native software development." Document height: 1440 → 3377, 390 → 4319. Footer at y=3044 (1440) and y=3810 (390). The footer link "Team" → `/join-us#our-team` targets the h2 id below.

PageHeader:
- h1 "Join Conductor", y=153.
- Lead "We're building Conductor in San Francisco and hiring engineers and designers to shape the future of AI-native software development." y=209.

Prose article (`mt-10`, y=297). Verbatim copy, including every bio link URL, is in `recon/pages/content/join-us.html`.

### 5.1 Sequence (1440 y)
1. p (y=297, 3 lines): "Conductor lets you run a team of coding agents on your Mac. We've grown 10x since January and raised $24M …"
2. **Apply card** (y=413, 768x74; [390: y=437, 358x90]). `a.not-prose.my-8.flex.items-center.gap-3.rounded-lg.border.border-border.border-dashed.p-3.text-sm.transition-colors.hover:bg-muted/50` → https://www.ycombinator.com/companies/conductor/jobs (target _blank).
   - Margin 32 0, padding 12, gap 12, **1px dashed #eae8e6**, radius 8.
   - **Hover bg rgba(250,250,249,.5)** over 150ms (measured).
   - Icon tile: 48x48, radius 6, bg **#F5F5F5**, centered lucide arrow-up-right 16px stroke #756f6c (`/assets/pages/join-us/icon-arrow-up-right.svg`).
   - Text column: "Apply to join us" at 14px/20px **700** #2c2826, then `p.pt-1` (4px top padding) "We're looking for exceptional engineers and designers to work with us in SF." at 14px/20px #2c2826.
3. h2#our-plan "Our plan" (y=535), followed by 2 paragraphs.
4. **blockquote** (y=776.6, 768x56): 4px left border #eae8e6, padding-left 16, italic 500 #756f6c, curly quotes from CSS. Text: “A huge amount of my work now is wildly parallelized, in a way I've never had to worry about before. It's been a while since a dev tool has changed my life [like Conductor did].” Look up any attribution in the content file.
5. 3 more paragraphs (y=858, 934, 1038).
6. **Team photo** `img.h-auto.w-full.rounded-lg` at y=1154.2: 768x432 [358x201.4], radius 8, margin 32 [24]. File `/assets/pages/join-us/about.webp` (960x540). Alt "Conductor team".
   - **Note:** the original loads `/about.webp` on *every* page (it shows up in each page's network log; probably a preload or prefetch). It is only displayed here.
7. h2#our-team "Our team" (y=1634).
8. p "One reason we started Conductor …" and p "We work in person about five days a week in San Francisco. Learn more about [what it's like working at Conductor](https://conductor-build.notion.site/What-It-s-Like-Working-at-Conductor-29da076bd0f2808bad97e3a4b876c01a) and [see what we've been building](https://x.com/search?src=typed_query&q=%40conductor_build)." Both links are `target=_blank`.
9. **7 team cards** (y=1870 onwards, each separated by 16px margin, `first:mt-0 last:mb-0`).

### 5.2 Team card
```
article.not-prose.my-4.rounded-lg.border.border-border.border-dashed.p-4   (1px dashed #eae8e6, r8, pad 16)
 └ div.flex.items-start.gap-3                                             (gap 12)
    ├ img.aspect-square.w-12.sm:w-14.rounded-md.object-cover               (56x56 at ≥640, 48x48 below; r6)
    └ div.min-w-0.flex-1.space-y-3.text-sm.leading-6.text-muted-foreground  (14px/24px #756f6c, 12px between blocks)
       ├ div (name row): text-base font-medium (16px/24px 500)
       │   ≥640: flex flex-wrap items-center gap-x-1.5 (6) gap-y-1
       │   <640: block; name on its own line (mb 2), then role row
       │  ├ span "Name" #2c2826
       │  └ span.flex.items-center.gap-1.5.text-muted-foreground (#756f6c)
       │      ├ span.hidden.sm:inline "·"
       │      ├ span "Role"
       │      └ a[aria-label="<Name> on X"] 20x20 r4, X logo svg 12x12 fill currentColor
       │            hover: bg #fafaf9 + color #2c2826, 150ms (measured)
       └ div.space-y-3 > p…  (bio) links: weight 400, color inherit (#756f6c), underline
             decoration #eae8e6, offset 2px; hover decoration #756f6c (measured)
```

| # | name | role | X | avatar (local) | card h @1440 |
|---|---|---|---|---|---|
| 1 | Charlie Holtz | CEO and Co-Founder | x.com/charlieholtz | /assets/img/demos/charlie.jpg (identical to /charlie.jpg, md5-verified) | 202 |
| 2 | Jackson de Campos | CTO and Co-Founder | x.com/jacksondecampos | /assets/img/demos/jackson.jpg (md5-verified) | 166 |
| 3 | Guillaume Sabran | Founding Engineer | x.com/guisabran | /assets/pages/join-us/guillaume.png | 94 |
| 4 | Lewis Ellis | Engineer | x.com/NotTuxedoSam | /assets/pages/join-us/lewis.png | 94 |
| 5 | Tywen Kelly | Engineer | x.com/tywenk | /assets/pages/join-us/tywen.png | 118 |
| 6 | Kaden Hyatt | Engineer | x.com/kaden_hyatt | /assets/pages/join-us/kaden.png | 118 |
| 7 | Sam Lehman | Founding Ops | x.com/splehman | /assets/pages/join-us/sam.png | 190 |

- Alt text: "Portrait of <Name>". All X links use `target=_blank rel="noopener noreferrer"`. X icon: `/assets/pages/join-us/x-logo.svg`.
- Card heights at 390: 372, 336, 144, 144, 192, 192, 408.

---

## 6. `/brandkit`
Title "Brand kit | Conductor". Meta description "Official Conductor brand assets, product description, and links." Document height: 1440 → 3099, 390 → 4455. Footer at y=2766 (1440) and y=3946 (390). Content width is 836 (x=302 to 1138 at 1440). Verbatim markup: `recon/pages/content/brandkit.html`.

### 6.1 Header block (`div.max-w-5xl.mx-auto.max-w-3xl`, renders 836 wide)
- **Eyebrow badge** "Brand kit" at y=156, 80.4x22, mb 24. Mono 12px/16px uppercase, letter-spacing 0.6px, #7d5e59, bg #f8f7f6, 1px #f3ece7 border, radius **2px** (`rounded-xs`), padding 2px 4px. Same look as the homepage changelog badge, but in real mono.
- h1 "Conductor brand assets", y=202 (PageHeader style).
- Lead "Official Conductor brand assets, product description, and links.", y=258.
- `div.prose.prose-sm.mt-6.max-w-3xl.sm:prose` (24px). Its p is 16px/28px **#2c2826** (prose body color beats the muted class) and is limited to the prose default **65ch = 655px**. Text: "Official product description, links, and logo files for Conductor. The downloadable ZIP includes light and dark SVG and PNG files for the letter mark and wordmark." y=306, 2 lines [390: 14px/24px, 4 lines].

### 6.2 Download card (y=394, 836x90)
- Container: `mt-8 rounded-lg border border-border bg-muted p-5` (32 top margin, bg #fafaf9, 1px #eae8e6, radius 8, padding 20).
- Inner layout: `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`.
- Left: `flex items-start gap-3` holding:
  - Icon tile 40x40, radius 6, 1px border, bg #fff, with lucide file-archive 16px #2c2826 (`/assets/pages/brandkit/icon-file-archive.svg`).
  - h2 "Brand kit download" (16px/24px 600 #2c2826) and p "Light and dark SVGs, plus PNG exports." (14px/20px #756f6c, mt 4).
- Right: **"Download ZIP"** `<a download href="/brandkit/conductor-brandkit.zip">`. 139.2x40 (h-10), px 12, 14px/20px weight 500, bg #2c2826, text #fff, radius 6, gap 8, with lucide download 16px first. **Hover bg rgba(44,40,38,.9)** (measured, instant). At 390 it is full width (316x40) below the text. Local file: `/assets/pages/brandkit/conductor-brandkit.zip` (68,730 bytes; contains the 8 SVG/PNG files listed below).

### 6.3 Asset cards: `div.mt-12.grid.gap-6.md:grid-cols-2` (48 top margin, 24 gap)
- 1440: 2x2 grid of 406x411 cards at x=302/732, y=532/967. 390: 1 column, 358x411, at y=616/1051/1486/1921.
- Card: `section.overflow-hidden.rounded-lg.border.border-border.bg-background`.
  - **Preview** `div.flex.min-h-64.items-center.justify-center.p-10` (min height 256, padding 40). bg is **#fff** for "Dark" variants and **#282423** for "Light" variants.
    - Letter mark: `img.h-40.w-auto`, rendered 105.7x160.
    - Wordmark: `img.h-auto.w-full.max-w-lg`, rendered 324x49.8.
  - **Info** `div.border-t.border-border.bg-background.p-5` (1px top border, padding 20).
    - `div.mb-4.flex.items-start.gap-2`: lucide file-text 16px #756f6c (mt 2), then h2 (14px/20px 600 #2c2826) and p (12px/16px #756f6c, mt 4).
    - `div.grid.gap-2`: rows `flex items-center justify-between gap-3`.
      - Filename chip: `span.truncate.rounded-sm.bg-muted.px-2.py-1.text-xs.text-muted-foreground` (radius 4, padding 4px 8px, 12px/16px, h 24).
      - Link "SVG" / "PNG": `a[download]`, 12px/16px #2c2826, `underline-offset-4`. **Hover adds an underline** (measured, instant).

| # | h2 | p | preview bg | preview file | rows (chip → link) |
|---|---|---|---|---|---|
| 1 | Conductor Letter mark | Dark. Use on light backgrounds. | #fff | conductor-letter-dark.svg | `conductor-letter-dark.svg` → SVG; `conductor-letter-dark.png · 677 x 1024` → PNG |
| 2 | Conductor Letter mark | Light. Use on dark backgrounds. | #282423 | conductor-letter-light.svg | `conductor-letter-light.svg` / `conductor-letter-light.png · 677 x 1024` |
| 3 | Conductor Wordmark | Dark. Use on light backgrounds. | #fff | conductor-wordmark-dark.svg | `conductor-wordmark-dark.svg` / `conductor-wordmark-dark.png · 2400 x 369` |
| 4 | Conductor Wordmark | Light. Use on dark backgrounds. | #282423 | conductor-wordmark-light.svg | `conductor-wordmark-light.svg` / `conductor-wordmark-light.png · 2400 x 369` |

- All files are in `/assets/pages/brandkit/`. The original hrefs are `/brandkit/<file>`; serve them at the same path or rewrite to the local path. Alt text: "Letter mark preview" / "Wordmark preview".

### 6.4 "About Conductor" (`section.mt-12`, y=1426)
- h2 "About Conductor": 20px/28px 600, mb 12.
- `div.grid.gap-3` (12) containing:
  1. **Description card** (836x254). `section.rounded-lg.border.border-border.bg-background.p-4` (padding 16, radius 8).
     - Head `mb-3 flex items-center justify-between`: h3 "Description" (14px/20px 600) and a **copy button**.
     - Body `space-y-4 text-sm leading-6 sm:text-base`: 16px/24px #756f6c [390: 14px/24px], 16px between paragraphs. Three paragraphs:
       - "Conductor is a Mac app for running coding agents in parallel. Developers create isolated workspaces for Claude Code, Codex, and Cursor, see what each agent is doing, then review and merge the changes."
       - "Each workspace gets its own branch, git worktree, run environment, and shared context folder, so multiple tasks can move at once without crowding the main repository."
       - "Conductor is a Y Combinator Summer 2024 company based in San Francisco, building developer tools for teams working with AI coding agents."
  2. `div.grid.items-start.gap-3.md:grid-cols-2` (two columns of 412 at 1440):
     - **Short description** card (412x126) with a copy button. Body `p.text-sm.leading-6` (14px/24px #756f6c): "Conductor is a Mac app for running Claude Code, Codex, and Cursor agents in parallel across isolated workspaces."
     - **Facts** card (412x394). h3 mb 12, then `dl.grid.gap-2` (8). Each row is `flex rounded-md bg-muted px-3 py-2.5 text-sm` (40 tall, radius 6, padding 10px 12px) with an inner `grid grid-cols-[7rem_1fr] gap-4`: dt #756f6c (112 wide), dd #2c2826 truncated. Rows: Product: Conductor / Category: Developer tools / AI / Platform: Mac app / Agents: Claude Code, Codex, and Cursor / Founded: 2024 / YC batch: Summer 2024 / Location: San Francisco.
  3. **Agent resources** card (836x190):
     - h3 mb 12, then `p.mb-3.text-sm.leading-6` muted: "Agents can discover the Conductor skill from the site root or load the skill markdown directly."
     - `grid gap-2` of link rows `flex items-center gap-3 rounded-md bg-muted px-3 py-2.5 text-sm transition-colors hover:bg-muted/80` (40 tall). Each row: `span.w-24` (96) muted label, then `code.font-mono.text-xs` (mono 12px/16px #2c2826, truncated).
       - "Skill" → `/.well-known/agent-skills/conductor/SKILL.md`
       - "Discovery" → `/.well-known/agent-skills/index.json`
     - Local copies: `/assets/pages/brandkit/well-known/agent-skills/...`. For a faithful clone, serve them at `public/.well-known/...`.
  4. **Official links** card (836x330). Rows are 60 tall, `justify-between`. Left: `div.font-medium` title (14px/20px 500 #2c2826) over a `code` URL (mono 12px/16px #756f6c). Right: lucide external-link 16px #756f6c.
     - Website (`https://www.conductor.build`) → `/`
     - Docs (`https://www.conductor.build/docs`) → `/docs`
     - Changelog (`https://www.conductor.build/changelog`) → `/changelog`
     - YC profile (`https://www.ycombinator.com/companies/conductor`) → that URL, target _blank
- **Row hover** (Agent resources and Official links): bg #fafaf9 → **rgba(250,250,249,.8)** over 150ms (measured).

### 6.5 Copy buttons (interactive)
- Markup: `button.inline-flex.size-8.rounded-md.border.border-border.bg-background.text-muted-foreground.transition-colors.hover:bg-muted.hover:text-foreground`, with `aria-label` and `title` set to "Copy description" or "Copy short description". It holds a lucide copy icon 14px (`/assets/pages/brandkit/icon-copy.svg`).
- Size and style: 32x32, radius 6, 1px #eae8e6 border, bg #fff, icon color #756f6c. **cursor: default** (not pointer).
- **Hover: bg #fafaf9, color #2c2826, 150ms** (measured).
- **Click:** writes the text to the clipboard (verified). Short description copies the single sentence. Description copies the 3 paragraphs joined with `\n\n`.
- **No visual feedback:** no icon swap, no "Copied" text, no toast, and aria-label unchanged. Sampled at 50ms, 300ms, 1s and 2.5s after the click with the mouse moved away; the button returned to its rest style.

### 6.6 390 quirk
At 390 the About grid's cards render **483.9px wide** (they overflow the 358 column). Document `scrollWidth` is **500** and the page scrolls horizontally. Likely cause: a long `code` URL in a grid item without `min-w-0`. The 390 screenshot is therefore 500 wide. Replicate only if exact fidelity is required.

---

## 7. `/privacy` and `/terms` (shared **LegalProse** layout)
Neither page has a PageHeader or a badge. The structure is `section.site-container` > `article.prose.prose-sm.w-full.!max-w-3xl.mx-auto.font-sans.sm:prose`, with **no mt-10**. The article is 768 wide at x=336 (1440) and 358 at x=16 (390). All typography follows §0.3.
- The h1 (anchor pattern) is at y=153 [121]: 36px/40px **800** container, anchor text weight 500, mb 32. At 390: 30px/36px, mb 24.
- **Section titles are bold paragraphs (`<p><strong>…</strong></p>`), not headings.** There are no h2/h3 elements.
- The only interactive pieces are the h1 anchor icon (hover opacity 0 → 1) and prose links (hover opacity .8).
- Copy: the full legal text is too long to inline. Use `recon/pages/content/privacy.html` and `recon/pages/content/terms.html` verbatim (clean semantic `p/strong/em/ul/ol/li/a` markup).

### 7.1 `/privacy`
- Title "Privacy notice | Conductor". Meta description "How Conductor collects, uses, discloses, and otherwise processes personal data."
- Document height: 1440 → 12070, 390 → 17394. Footer at y=11737 (1440).
- h1#privacy-notice "Privacy Notice".
- First p: "**Last Updated**: June 12, 2026".
- Element counts: 104 p, 45 strong, 9 ul (disc), 60 li, 9 links.
- **Nested lists:**
  - A first `p` inside an `li` gets margin 20px 0 12px.
  - A nested `ul` gets margin 12px 0 (padding-left 26).
  - Nested `p` gets margin 12px 0 (x=400 at 1440).
- Links include https://www.conductor.build, "click here", "Digital Advertising Alliance", https://optout.aboutads.info/…, https://www.youradchoices.com/, "Network Advertising Initiative", https://thenai.org/how-to-opt-…, and humans@conductor.build (mailto).
- Last p has margin 20px 0 0.

### 7.2 `/terms`
- Title "Terms of service | Conductor". Meta description "Customer terms and conditions for using Conductor."
- Document height: 1440 → 16758, 390 → 26350. Footer at y=16425 (1440).
- h1#customer-terms-and-conditions "Customer Terms and Conditions" (wraps to 2 lines at 390: 72 tall).
- First p: `<em>`Last Modified: March 30, 2026`</em>`. Then "**Welcome to Conductor**", then the intro paragraphs.
- Then a single long `ol` (decimal, markers #756f6c), y=745 to 16309 at 1440. It has 13 li, and each li contains many p elements with bold lead-ins.
- Element counts: 87 p, 104 strong, 1 em.
- Only 2 links, e.g. "Privacy Notice" → /privacy.

---

## 8. 1280 deltas (all pages)
The page CSS is identical to 1440 (both xl). The 900px `.site-container` pages are only shifted: the section is at x=190 and content starts at x=222. Document heights are unchanged (enterprise 1613, team-plan 1176, slack 1975, join-us 3377, brandkit 3099, privacy 12070, terms 16758). Pricing is described in §1.1. The header spans the full 1280.

## 9. Gaps / not measurable
- **HubSpot iframes** are third-party and cross-origin. Their internals were measured through Playwright frame access.
  - The **dropdown's open state** (option list styling, search box) was not opened or measured. Options come from the form definition JSON.
  - **Post-submit** content comes from the definition and was not submitted live, to avoid creating leads.
  - The team-plan font `'andale mono', times` depends on the OS: Andale Mono on macOS, Times fallback elsewhere.
- **md breakpoint (768–1023)** was not measured directly. Behavior there (pricing 2 columns, brandkit asset grid 2 columns, About 2 columns, footer 4 columns) is taken from classes.
- **Hover states were measured** by real `hover()` before/after diffs on the first instance of every distinct link and button class. Remaining duplicates are assumed identical.
- The **mobile menu** open state on subpages is the same component as homepage §1. It was not re-measured here.
- **Dark theme** was not rendered. The `dark:` logo variants exist in the markup but are hidden in light mode.
- Downloaded `/brandkit/*.png` and `.zip` are served with a `download` attribute. The original ZIP's internal file list was verified locally.
- **Live data:** the "100k+" count, legal "Last Updated" dates and the team list may drift.
- Screenshots were taken with headless Chromium at deviceScaleFactor 1. The 390 brandkit screenshot is 500px wide because of the original's overflow (§6.6).
