# https://www.conductor.build (sitemap.xml + Playwright recon specs)

Source: https://www.conductor.build (sitemap.xml + Playwright recon specs) · Local React 18 + Vite + Tailwind v3 clone at http://localhost:5220
Status: **measured-from-live-site** · production approved: **false**
306 routes · 11 templates · 44 unique sections

> Generated from `ia.json` by `build.mjs`. Edit the JSON, not this file.

## Shape of the site

The largest 3 templates (Changelog post, Docs page, Changelog index (paginated)) account for 297 of 306 routes (97%). The remaining 9 routes span 8 templates.

| template | routes | share |
|---|---:|---:|
| Changelog post | 207 | 68% |
| Docs page | 69 | 23% |
| Changelog index (paginated) | 21 | 7% |
| Legal document | 2 | 1% |
| Homepage | 1 | 0% |
| Pricing | 1 | 0% |
| Enterprise contact | 1 | 0% |
| Team plan request | 1 | 0% |
| Prose page (Slack integration) | 1 | 0% |
| Join us (careers) | 1 | 0% |
| Brand kit | 1 | 0% |

## Page chrome

**1 routes carry chrome = `marketing-sans-footer`** — Homepage.

**8 routes carry chrome = `marketing-mono-footer`** — Pricing, Enterprise contact, Team plan request, Prose page (Slack integration), Join us (careers), Brand kit, Legal document.

**69 routes carry chrome = `docs-shell`** — Docs page.

**228 routes carry chrome = `changelog-shell`** — Changelog index (paginated), Changelog post.

## Sections by reuse

How widely a section is shared determines whether it belongs in a shared
component library or stays local to its page.

| section | category | templates | routes | implementation | scope |
|---|---|---:|---:|---|---|
| `shell.header` | SHELL | 11 | 306 | `src/components/Header.jsx` | All 306 routes; on docs routes it only shows at 768px and wider. |
| `shell.download-dialog` | SHELL | 11 | 306 | `src/components/DownloadDialog.jsx` | Reachable from the header Download button on all 306 routes, plus hero/pricing download buttons. |
| `shell.downloading-screen` | SHELL | 11 | 306 | `src/components/DownloadDialog.jsx > DownloadingScreen` | Reachable after a download click on all 306 routes. |
| `shell.footer-mono` | SHELL | 10 | 305 | `src/components/Footer.jsx (mono prop)` | Every route except the homepage (305 routes): standalone pages, docs and changelog. |
| `shell.mobile-menu` | SHELL | 10 | 237 | `src/components/Header.jsx` | All 237 non-docs routes at mobile width; docs routes use shell.docs-subnav and docs.mobile-drawer instead. |
| `changelog.back-link` | CHANGELOG | 1 | 207 | `src/pages/changelog/ChangelogPost.jsx` | All 207 changelog post routes. |
| `changelog.post-entry` | CHANGELOG | 1 | 207 | `src/components/changelog/ChangelogEntry.jsx (variant post)` | All 207 changelog post routes. |
| `shell.docs-subnav` | SHELL | 1 | 69 | `src/components/docs/MobileNav.jsx > MobileSubnav` | The 69 docs routes, below 768px only. |
| `docs.sidebar` | DOCS | 1 | 69 | `src/components/docs/Sidebar.jsx` | The 69 docs routes at 768px and wider. |
| `docs.mobile-drawer` | DOCS | 1 | 69 | `src/components/docs/MobileNav.jsx > MobileDrawer` | The 69 docs routes below 768px. |
| `docs.breadcrumb` | DOCS | 1 | 69 | `src/pages/docs/DocsPage.jsx > Breadcrumb` | All 69 docs routes. |
| `docs.page-title` | DOCS | 1 | 69 | `src/pages/docs/DocsPage.jsx` | All 69 docs routes. |
| `docs.prose-body` | DOCS | 1 | 69 | `src/components/docs/Body.jsx` | All 69 docs routes. |
| `docs.prev-next` | DOCS | 1 | 69 | `src/pages/docs/DocsPage.jsx > PrevNext` | All 69 docs routes. |
| `docs.toc` | DOCS | 1 | 69 | `src/components/docs/Toc.jsx` | The 69 docs routes at 1280px and wider. |
| `docs.search-dialog` | DOCS | 1 | 69 | `src/components/docs/Search.jsx` | All 69 docs routes. |
| `changelog.entry-list` | CHANGELOG | 1 | 21 | `src/components/changelog/ChangelogEntry.jsx` | The 21 changelog index routes (/changelog and pages 2–21). |
| `changelog.pagination` | CHANGELOG | 1 | 21 | `src/components/changelog/ChangelogPager.jsx` | The 21 changelog index routes. |
| `hero.page-header` | HERO | 4 | 4 | `src/components/pages/PageHeader.jsx` | 4 standalone pages: enterprise, team-plan, slack and join-us. |
| `content.prose-article` | CONTENT | 3 | 3 | `src/components/pages/Prose.jsx` | 3 standalone pages: enterprise (intro line), slack and join-us. |
| `proof.trusted-logo-strip` | PROOF | 2 | 2 | `src/components/Logos.jsx` | 2 routes: the homepage and /pricing. |
| `content.legal-prose` | CONTENT | 1 | 2 | `src/components/pages/LegalLayout.jsx` | 2 routes: /privacy and /terms. |
| `shell.footer-sans` | SHELL | 1 | 1 | `src/components/Footer.jsx` | Only the homepage (1 route). |
| `hero.home` | HERO | 1 | 1 | `src/components/Hero.jsx` | Homepage only. |
| `hero.pricing-title` | HERO | 1 | 1 | `src/pages/Pricing.jsx` | /pricing only. |
| `hero.brandkit-header` | HERO | 1 | 1 | `src/pages/Brandkit.jsx` | /brandkit only. |
| `proof.enterprise-logo-grid` | PROOF | 1 | 1 | `src/pages/Enterprise.jsx` | /enterprise only. |
| `proof.testimonials` | PROOF | 1 | 1 | `src/components/Testimonials.jsx` | Homepage only. |
| `features.multiplayer` | FEATURES | 1 | 1 | `src/components/Multiplayer.jsx` | Homepage only. |
| `features.cloud-sandbox` | FEATURES | 1 | 1 | `src/components/Sandbox.jsx` | Homepage only. |
| `features.byok` | FEATURES | 1 | 1 | `src/components/Orchestration.jsx` | Homepage only. |
| `features.anywhere` | FEATURES | 1 | 1 | `src/components/Anywhere.jsx` | Homepage only. |
| `content.changelog-preview` | CONTENT | 1 | 1 | `src/components/Changelog.jsx` | Homepage only. |
| `content.pricing-plans` | CONTENT | 1 | 1 | `src/pages/Pricing.jsx > PlanCard` | /pricing only. |
| `content.pricing-faq` | CONTENT | 1 | 1 | `src/pages/Pricing.jsx` | /pricing only. |
| `content.join-us-apply-card` | CONTENT | 1 | 1 | `src/pages/JoinUs.jsx` | /join-us only. |
| `content.join-us-team-photo` | CONTENT | 1 | 1 | `src/pages/JoinUs.jsx` | /join-us only. |
| `content.join-us-team-cards` | CONTENT | 1 | 1 | `src/pages/JoinUs.jsx > TeamCard` | /join-us only. |
| `content.brandkit-download-card` | CONTENT | 1 | 1 | `src/pages/Brandkit.jsx` | /brandkit only. |
| `content.brandkit-asset-cards` | CONTENT | 1 | 1 | `src/pages/Brandkit.jsx > AssetCard` | /brandkit only. |
| `content.brandkit-about` | CONTENT | 1 | 1 | `src/pages/Brandkit.jsx` | /brandkit only. |
| `conversion.be-like-this-guy` | CONVERSION | 1 | 1 | `src/components/CTA.jsx` | Homepage only. |
| `conversion.enterprise-contact-form` | CONVERSION | 1 | 1 | `src/components/pages/HubSpotForm.jsx` | /enterprise only. |
| `conversion.team-plan-form-scrollbox` | CONVERSION | 1 | 1 | `src/components/pages/HubSpotForm.jsx` | /team-plan only. |

**8 shared sections** appear in more than one template and belong in a component library.

**36 single-use sections** appear in exactly one template. Building these
as "reusable" components up front would be speculative — keep them page-local
until a second caller actually appears.

## Templates

### Homepage — `template.home`

1 route · `/` · chrome: **marketing-sans-footer**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.header` | shared ×11 |
| 2 | SHELL | `shell.mobile-menu` | shared ×10 |
| 3 | HERO | `hero.home` | page-local |
| 4 | PROOF | `proof.trusted-logo-strip` | shared ×2 |
| 5 | FEATURES | `features.multiplayer` | page-local |
| 6 | FEATURES | `features.cloud-sandbox` | page-local |
| 7 | FEATURES | `features.byok` | page-local |
| 8 | FEATURES | `features.anywhere` | page-local |
| 9 | PROOF | `proof.testimonials` | page-local |
| 10 | CONTENT | `content.changelog-preview` | page-local |
| 11 | CONVERSION | `conversion.be-like-this-guy` | page-local |
| 12 | SHELL | `shell.footer-sans` | page-local |
| 13 | SHELL | `shell.download-dialog` | shared ×11 |
| 14 | SHELL | `shell.downloading-screen` | shared ×11 |

### Pricing — `template.pricing`

1 route · `/pricing` · chrome: **marketing-mono-footer**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.header` | shared ×11 |
| 2 | SHELL | `shell.mobile-menu` | shared ×10 |
| 3 | HERO | `hero.pricing-title` | page-local |
| 4 | CONTENT | `content.pricing-plans` | page-local |
| 5 | PROOF | `proof.trusted-logo-strip` | shared ×2 |
| 6 | CONTENT | `content.pricing-faq` | page-local |
| 7 | SHELL | `shell.footer-mono` | shared ×10 |
| 8 | SHELL | `shell.download-dialog` | shared ×11 |
| 9 | SHELL | `shell.downloading-screen` | shared ×11 |

### Enterprise contact — `template.enterprise`

1 route · `/enterprise` · chrome: **marketing-mono-footer**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.header` | shared ×11 |
| 2 | SHELL | `shell.mobile-menu` | shared ×10 |
| 3 | HERO | `hero.page-header` | shared ×4 |
| 4 | CONTENT | `content.prose-article` | shared ×3 |
| 5 | PROOF | `proof.enterprise-logo-grid` | page-local |
| 6 | CONVERSION | `conversion.enterprise-contact-form` | page-local |
| 7 | SHELL | `shell.footer-mono` | shared ×10 |
| 8 | SHELL | `shell.download-dialog` | shared ×11 |
| 9 | SHELL | `shell.downloading-screen` | shared ×11 |

### Team plan request — `template.team-plan`

1 route · `/team-plan` · chrome: **marketing-mono-footer**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.header` | shared ×11 |
| 2 | SHELL | `shell.mobile-menu` | shared ×10 |
| 3 | HERO | `hero.page-header` | shared ×4 |
| 4 | CONVERSION | `conversion.team-plan-form-scrollbox` | page-local |
| 5 | SHELL | `shell.footer-mono` | shared ×10 |
| 6 | SHELL | `shell.download-dialog` | shared ×11 |
| 7 | SHELL | `shell.downloading-screen` | shared ×11 |

### Prose page (Slack integration) — `template.prose-page`

1 route · `/slack` · chrome: **marketing-mono-footer**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.header` | shared ×11 |
| 2 | SHELL | `shell.mobile-menu` | shared ×10 |
| 3 | HERO | `hero.page-header` | shared ×4 |
| 4 | CONTENT | `content.prose-article` | shared ×3 |
| 5 | SHELL | `shell.footer-mono` | shared ×10 |
| 6 | SHELL | `shell.download-dialog` | shared ×11 |
| 7 | SHELL | `shell.downloading-screen` | shared ×11 |

### Join us (careers) — `template.join-us`

1 route · `/join-us` · chrome: **marketing-mono-footer**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.header` | shared ×11 |
| 2 | SHELL | `shell.mobile-menu` | shared ×10 |
| 3 | HERO | `hero.page-header` | shared ×4 |
| 4 | CONTENT | `content.prose-article` | shared ×3 |
| 5 | CONTENT | `content.join-us-apply-card` | page-local |
| 6 | CONTENT | `content.join-us-team-photo` | page-local |
| 7 | CONTENT | `content.join-us-team-cards` | page-local |
| 8 | SHELL | `shell.footer-mono` | shared ×10 |
| 9 | SHELL | `shell.download-dialog` | shared ×11 |
| 10 | SHELL | `shell.downloading-screen` | shared ×11 |

### Brand kit — `template.brandkit`

1 route · `/brandkit` · chrome: **marketing-mono-footer**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.header` | shared ×11 |
| 2 | SHELL | `shell.mobile-menu` | shared ×10 |
| 3 | HERO | `hero.brandkit-header` | page-local |
| 4 | CONTENT | `content.brandkit-download-card` | page-local |
| 5 | CONTENT | `content.brandkit-asset-cards` | page-local |
| 6 | CONTENT | `content.brandkit-about` | page-local |
| 7 | SHELL | `shell.footer-mono` | shared ×10 |
| 8 | SHELL | `shell.download-dialog` | shared ×11 |
| 9 | SHELL | `shell.downloading-screen` | shared ×11 |

### Legal document — `template.legal`

2 routes · `/privacy`, `/terms` · chrome: **marketing-mono-footer**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.header` | shared ×11 |
| 2 | SHELL | `shell.mobile-menu` | shared ×10 |
| 3 | CONTENT | `content.legal-prose` | page-local |
| 4 | SHELL | `shell.footer-mono` | shared ×10 |
| 5 | SHELL | `shell.download-dialog` | shared ×11 |
| 6 | SHELL | `shell.downloading-screen` | shared ×11 |

### Docs page — `template.docs-page`

69 routes · `/docs/{slug-path}` · chrome: **docs-shell**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.header` | shared ×11 |
| 2 | SHELL | `shell.docs-subnav` | page-local |
| 3 | DOCS | `docs.sidebar` | page-local |
| 4 | DOCS | `docs.mobile-drawer` | page-local |
| 5 | DOCS | `docs.breadcrumb` | page-local |
| 6 | DOCS | `docs.page-title` | page-local |
| 7 | DOCS | `docs.prose-body` | page-local |
| 8 | DOCS | `docs.prev-next` | page-local |
| 9 | DOCS | `docs.toc` | page-local |
| 10 | DOCS | `docs.search-dialog` | page-local |
| 11 | SHELL | `shell.footer-mono` | shared ×10 |
| 12 | SHELL | `shell.download-dialog` | shared ×11 |
| 13 | SHELL | `shell.downloading-screen` | shared ×11 |

### Changelog index (paginated) — `template.changelog-index`

21 routes · `/changelog/page/{N}` (2–21) · chrome: **changelog-shell**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.header` | shared ×11 |
| 2 | SHELL | `shell.mobile-menu` | shared ×10 |
| 3 | CHANGELOG | `changelog.entry-list` | page-local |
| 4 | CHANGELOG | `changelog.pagination` | page-local |
| 5 | SHELL | `shell.footer-mono` | shared ×10 |
| 6 | SHELL | `shell.download-dialog` | shared ×11 |
| 7 | SHELL | `shell.downloading-screen` | shared ×11 |

### Changelog post — `template.changelog-post`

207 routes · `/changelog/{version-slug}` · chrome: **changelog-shell**

| # | category | section | |
|---:|---|---|---|
| 1 | SHELL | `shell.header` | shared ×11 |
| 2 | SHELL | `shell.mobile-menu` | shared ×10 |
| 3 | CHANGELOG | `changelog.back-link` | page-local |
| 4 | CHANGELOG | `changelog.post-entry` | page-local |
| 5 | SHELL | `shell.footer-mono` | shared ×10 |
| 6 | SHELL | `shell.download-dialog` | shared ×11 |
| 7 | SHELL | `shell.downloading-screen` | shared ×11 |

## Section reference

### SHELL

_Site chrome and global overlays that appear on many routes: header, mobile menu, footer variants, download dialog._

**`shell.header`** — Sticky 57px marketing header: Conductor mark, nav links (Changelog, Docs, Pricing, Enterprise, Join Us), Sign in, and a dark Download button. The current route's nav link gets aria-current and full foreground colour. On docs routes it is hidden below 768px.

· All 306 routes; on docs routes it only shows at 768px and wider. · appears on 306 routes · implemented by `src/components/Header.jsx`

**`shell.mobile-menu`** — Below 768px, the header's 36px menu button opens a dropdown panel of full-width rows (nav links plus a Download row that opens the download dialog).

· All 237 non-docs routes at mobile width; docs routes use shell.docs-subnav and docs.mobile-drawer instead. · appears on 237 routes · implemented by `src/components/Header.jsx`

**`shell.docs-subnav`** — Docs-only 56px top bar below 768px, translucent white with 8px backdrop blur: Conductor mark + wordmark on the left, search and open-sidebar icon buttons on the right. Replaces the marketing header on small screens.

· The 69 docs routes, below 768px only. · appears on 69 routes · implemented by `src/components/docs/MobileNav.jsx > MobileSubnav`

**`shell.footer-sans`** — Site footer (link columns, copyright, SOC 2 note) rendered in the system sans stack, because the homepage wraps it in a font-mono→sans override.

· Only the homepage (1 route). · appears on 1 routes · implemented by `src/components/Footer.jsx`

**`shell.footer-mono`** — The same footer geometry, links and colours as the homepage, but rendered in real monospace because these routes are not inside the homepage's sans override wrapper.

· Every route except the homepage (305 routes): standalone pages, docs and changelog. · appears on 305 routes · implemented by `src/components/Footer.jsx (mono prop)`

**`shell.download-dialog`** — 448x294 modal to download the Mac app (Apple silicon primary button, Intel link, waitlist row). No enter/exit animation; first open in a page load is delayed ~300ms to match the original's Suspense reveal.

· Reachable from the header Download button on all 306 routes, plus hero/pricing download buttons. · appears on 306 routes · implemented by `src/components/DownloadDialog.jsx`

**`shell.downloading-screen`** — Full-screen black terminal-style overlay shown after any download click: scanlines, box-drawing frame, typewriter text with blinking cursor, number keys open docs/Discord/X.

· Reachable after a download click on all 306 routes. · appears on 306 routes · implemented by `src/components/DownloadDialog.jsx > DownloadingScreen`

### HERO

_The opening block of a page: homepage hero, page title blocks._

**`hero.home`** — Homepage hero: masked sky background, animated-WebP wordmark mask, H1 that scrambles between three phrases every 3s, Get Conductor CTA with a quote, and the baked-frame app screenshot.

· Homepage only. · appears on 1 routes · implemented by `src/components/Hero.jsx`

**`hero.pricing-title`** — Centered single H1 for the pricing page (36px/600), with no lead paragraph.

· /pricing only. · appears on 1 routes · implemented by `src/pages/Pricing.jsx`

**`hero.page-header`** — Left-aligned page header: 36px/600 H1 with tight tracking and a muted 16px lead paragraph, in a 768px column (672px on team-plan).

· 4 standalone pages: enterprise, team-plan, slack and join-us. · appears on 4 routes · implemented by `src/components/pages/PageHeader.jsx`

**`hero.brandkit-header`** — Brand-kit page header in an 836px column: mono uppercase 'Brand kit' eyebrow badge, H1, muted lead, then a short prose intro limited to 65ch.

· /brandkit only. · appears on 1 routes · implemented by `src/pages/Brandkit.jsx`

### PROOF

_Social proof: customer logo strips/grids and testimonials._

**`proof.trusted-logo-strip`** — 'Trusted by 100k+ builders' heading with a count-up number (1400ms easeOutCubic, skipped if in view on load) over an 8-logo grid in a 672px column; Spotify logo tinted green.

· 2 routes: the homepage and /pricing. · appears on 2 routes · implemented by `src/components/Logos.jsx`

**`proof.enterprise-logo-grid`** — Plain 8-logo grid inside the enterprise prose (4 columns, 3 on mobile) with a different logo set (adds Life360 and Reducto), no counter and an untinted Spotify logo, closed by a bottom border.

· /enterprise only. · appears on 1 routes · implemented by `src/pages/Enterprise.jsx`

**`proof.testimonials`** — Grid of 6 testimonial cards with author, handle and verified badge; lazily mounted, each card fades up 16px over 500ms with a 50ms stagger.

· Homepage only. · appears on 1 routes · implemented by `src/components/Testimonials.jsx`

### FEATURES

_Homepage product feature modules, each a titled shell with a live demo or image._

**`features.multiplayer`** — Feature shell 'Ludwig has entered the chat.' with a looping multiplayer chat demo (typing bubbles, avatars with local-time tooltips).

· Homepage only. · appears on 1 routes · implemented by `src/components/Multiplayer.jsx`

**`features.cloud-sandbox`** — Feature shell 'A cloud sandbox for every agent.' with a phased sandbox demo: video, building/preparing/done states, a running timer and a shimmer loader.

· Homepage only. · appears on 1 routes · implemented by `src/components/Sandbox.jsx`

**`features.byok`** — Feature shell 'Bring your own subscriptions and keys.' with a looping orchestration demo that steps through agent/tool phases.

· Homepage only. · appears on 1 routes · implemented by `src/components/Orchestration.jsx`

**`features.anywhere`** — Feature shell 'Conduct from anywhere.' with a static device/dock image and macOS/iOS/API platform buttons.

· Homepage only. · appears on 1 routes · implemented by `src/components/Anywhere.jsx`

### CONTENT

_The substantive body of a standalone page: plans, FAQ, prose articles, brand assets, team cards._

**`content.changelog-preview`** — Homepage changelog teaser: 3 latest-release cards with version badge and date plus a 'View all' arrow link; horizontal scroller on mobile.

· Homepage only. · appears on 1 routes · implemented by `src/components/Changelog.jsx`

**`content.pricing-plans`** — Four plan cards (12px radius) in a 4/2/1-column grid; the Pro card carries a mono 'Most popular' badge; features use └ tree bullets; the Free card's Download opens the download dialog.

· /pricing only. · appears on 1 routes · implemented by `src/pages/Pricing.jsx > PlanCard`

**`content.pricing-faq`** — Static (non-accordion) definition-list FAQ in a 576px column, answers as └ tree-bullet text.

· /pricing only. · appears on 1 routes · implemented by `src/pages/Pricing.jsx`

**`content.prose-article`** — Tailwind-typography article in a 768px column, 40px below the page header: 16px/28px foreground body, headings with hover anchor-link icons, links weight 500 with a 55% underline that fade to 0.8 opacity on hover.

· 3 standalone pages: enterprise (intro line), slack and join-us. · appears on 3 routes · implemented by `src/components/pages/Prose.jsx`

**`content.legal-prose`** — Legal document layout: the same prose article but with no page header and no top margin, its own 800-weight H1 with anchor icon, and section titles as bold paragraphs rather than headings.

· 2 routes: /privacy and /terms. · appears on 2 routes · implemented by `src/components/pages/LegalLayout.jsx`

**`content.join-us-apply-card`** — Dashed-border link card inside the join-us prose with a grey icon tile and arrow, linking out to the jobs page; hover fills with muted/50.

· /join-us only. · appears on 1 routes · implemented by `src/pages/JoinUs.jsx`

**`content.join-us-team-photo`** — Full-width 8px-radius team photo inside the join-us prose.

· /join-us only. · appears on 1 routes · implemented by `src/pages/JoinUs.jsx`

**`content.join-us-team-cards`** — Seven dashed team-member cards (avatar, name, role, short bio with links, X button) under the 'Our team' heading.

· /join-us only. · appears on 1 routes · implemented by `src/pages/JoinUs.jsx > TeamCard`

**`content.brandkit-download-card`** — Muted card with an archive icon tile, title and caption, and a dark 'Download ZIP' button for the full logo pack.

· /brandkit only. · appears on 1 routes · implemented by `src/pages/Brandkit.jsx`

**`content.brandkit-asset-cards`** — Two-column grid of 4 logo preview cards (light and dark panels) each with SVG/PNG download links.

· /brandkit only. · appears on 1 routes · implemented by `src/pages/Brandkit.jsx > AssetCard`

**`content.brandkit-about`** — 'About Conductor' stack: description and short-description cards with copy-to-clipboard buttons (no visual feedback), a facts list, agent-resource links and official links.

· /brandkit only. · appears on 1 routes · implemented by `src/pages/Brandkit.jsx`

### CONVERSION

_Blocks whose job is to capture a lead or a download: CTA band, contact forms._

**`conversion.be-like-this-guy`** — Homepage closing CTA band headed 'Be like this guy.' with a download action.

· Homepage only. · appears on 1 routes · implemented by `src/components/CTA.jsx`

**`conversion.enterprise-contact-form`** — Replica of the HubSpot contact-sales form (names, job title, company email, company name, company size, message) in the HubSpot theme. In the clone it validates locally and never posts anywhere.

· /enterprise only. · appears on 1 routes · implemented by `src/components/pages/HubSpotForm.jsx`

**`conversion.team-plan-form-scrollbox`** — Same HubSpot field set but themed in Andale Mono and placed inside a fixed 450px scroll box that clips the lower half of the form (an original quirk). Local-only in the clone.

· /team-plan only. · appears on 1 routes · implemented by `src/components/pages/HubSpotForm.jsx`

### DOCS

_Fumadocs-style documentation shell parts: sidebar, drawer, breadcrumb, body, TOC, search._

**`docs.sidebar`** — Sticky 268px desktop sidebar: root switcher popover (Reference / How to), search button with ⌘K hint, separators, collapsible folders (150ms) and active-page highlight.

· The 69 docs routes at 768px and wider. · appears on 69 routes · implemented by `src/components/docs/Sidebar.jsx`

**`docs.mobile-drawer`** — Right-side slide-in drawer (85% width, max 380px, 250ms) holding the same nav tree, opened from the docs subnav.

· The 69 docs routes below 768px. · appears on 69 routes · implemented by `src/components/docs/MobileNav.jsx > MobileDrawer`

**`docs.breadcrumb`** — Non-linked breadcrumb of folder names separated by chevrons, 14px muted, horizontally scrollable.

· All 69 docs routes. · appears on 69 routes · implemented by `src/pages/docs/DocsPage.jsx > Breadcrumb`

**`docs.page-title`** — Docs page H1 plus its muted description paragraph.

· All 69 docs routes. · appears on 69 routes · implemented by `src/pages/docs/DocsPage.jsx`

**`docs.prose-body`** — MDX-style body rendered from extracted content: anchored headings, Shiki github-light code blocks with copy button, code tabs, callouts, steps, accordions, tables, image/video frames, YouTube embeds, cards, kbd shortcuts and a few site-specific interactive widgets.

· All 69 docs routes. · appears on 69 routes · implemented by `src/components/docs/Body.jsx`

**`docs.prev-next`** — Two-up previous/next page cards at the bottom of the article.

· All 69 docs routes. · appears on 69 routes · implemented by `src/pages/docs/DocsPage.jsx > PrevNext`

**`docs.toc`** — Right 'On this page' table of contents in the Fumadocs clerk style: scroll-spy with several headings active at once, an SVG track and a 4px dot following the rail.

· The 69 docs routes at 1280px and wider. · appears on 69 routes · implemented by `src/components/docs/Toc.jsx`

**`docs.search-dialog`** — ⌘K / Ctrl+K search overlay (300ms open) with keyboard-navigable result rows, driven in the clone by a local search index instead of the original /api/search endpoint.

· All 69 docs routes. · appears on 69 routes · implemented by `src/components/docs/Search.jsx`

### CHANGELOG

_Changelog listing, pagination and single-post parts._

**`changelog.entry-list`** — Up to 10 changelog articles per page; each has a sticky left meta column (mono version badge linking to the post, date) and a linked 30px title over a markdown body, separated by faint borders.

· The 21 changelog index routes (/changelog and pages 2–21). · appears on 21 routes · implemented by `src/components/changelog/ChangelogEntry.jsx`

**`changelog.pagination`** — Two-row pager: Previous / 'Page N of 21' / Next, then page numbers showing first, last, current ±1 and ellipses.

· The 21 changelog index routes. · appears on 21 routes · implemented by `src/components/changelog/ChangelogPager.jsx`

**`changelog.back-link`** — Muted 'Back to changelog' link with a left arrow above a single post.

· All 207 changelog post routes. · appears on 207 routes · implemented by `src/pages/changelog/ChangelogPost.jsx`

**`changelog.post-entry`** — Single changelog article: the same meta column (unlinked badge) and markdown body as the list, with an unlinked 30px H1 and no border, pager or prev/next.

· All 207 changelog post routes. · appears on 207 routes · implemented by `src/components/changelog/ChangelogEntry.jsx (variant post)`
