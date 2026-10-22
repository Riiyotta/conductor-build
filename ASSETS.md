Source: https://www.conductor.build/

# Asset manifest: local file → original URL → where used

Base: `public/assets/` (served at `/assets/...`). Original origin: `https://www.conductor.build`.
Next.js `/_next/image?url=X&w=..` URLs were resolved to the underlying original `X`. The originals were downloaded at full resolution, so render them at the CSS sizes given in CLONE_SPEC.md.

## Fonts
| local | original | used |
|---|---|---|
| fonts/Geist-VariableFont_wght.ttf | /_next/static/immutable/media/Geist_VariableFont_wght-s.p.0ugx-h7ejvw7_.ttf | Declared and preloaded on the original but **never applied**: the page renders `ui-sans-serif, system-ui, sans-serif` (CLONE_SPEC §0.1). Keep it only if you want to match the preload. |

## Images: hero
| local | original | dims | used |
|---|---|---|---|
| img/homepage-hero-background.webp | /homepage-hero-background.webp | 1672x941 | Hero bg (light theme), §2.1 |
| img/homepage-hero-background-night-sky.webp | /homepage-hero-background-night-sky.webp | 1672x941 | Hero bg (dark theme only; unused in light) |
| img/conductor-app-hero-light.webp | /conductor-app-hero-light.webp | 3022x1954 | Hero app screenshot (frame and shadow baked in), §2.3 |
| img/conductor-app-hero-dark.webp | /conductor-app-hero-dark.webp | 3022x1954 | Dark-theme variant (unused in light) |
| img/animations/conductor-logo.webp | /animations/conductor-logo.webp | 496x76, animated, 157 frames, 3060ms, plays once | Hero wordmark, used as CSS mask over white, §2.2 / M2 |

## Images: logo strip (§3)
| local | original | used |
|---|---|---|
| img/logos/linear.svg | /logos/linear.svg | Linear (light) |
| img/logos/linear-light.svg | /logos/linear-light.svg | Linear (dark variant) |
| img/logos/vercel-light.svg | /logos/vercel-light.svg | **Vercel (shown in light theme)** |
| img/logos/vercel.svg | /logos/vercel.svg | Vercel (dark variant) |
| img/logos/notion-wordmark.svg | /logos/notion-wordmark.svg | Notion (light) |
| img/logos/notion-wordmark-dark.svg | /logos/notion-wordmark-dark.svg | Notion (dark variant) |
| img/logos/ramp-wordmark.svg | /logos/ramp-wordmark.svg | Ramp (light) |
| img/logos/ramp-wordmark-light.svg | /logos/ramp-wordmark-light.svg | Ramp (dark variant) |
| img/logos/yc-wordmark-orange.png | /logos/yc-wordmark-orange.png (3208x640) | Y Combinator, mix-blend multiply |
| img/logos/square-wordmark.svg | /logos/square-wordmark.svg | Square (light) |
| img/logos/square-wordmark-light.svg | /logos/square-wordmark-light.svg | Square (dark variant) |
| img/logos/posthog-logomark.svg | /logos/posthog-logomark.svg | PostHog hog mark (light) |
| img/logos/posthog-wordmark.svg | /logos/posthog-wordmark.svg | PostHog wordmark (light) |
| img/logos/posthog-logo-light.svg | /logos/posthog-logo-light.svg | PostHog combined (dark variant) |
| img/logos/spotify-wordmark.png | /logos/spotify-wordmark.png (3432x940) | Spotify, with CSS filter to green |

## Images: testimonials & company icons (§2.2, §8)
| local | original | used |
|---|---|---|
| img/testimonials/frank.jpg | /testimonials/frank.jpg | Hero quote avatar (20px) |
| img/testimonials/garry.jpg | /testimonials/garry.jpg | Garry Tan (40px) |
| img/testimonials/josh.png | /testimonials/josh.png | Josh Pigford |
| img/testimonials/brandon.png | /testimonials/brandon.png | Brandon Leonardo |
| img/testimonials/cole.jpg | /testimonials/cole.jpg | Cole Bemis |
| img/testimonials/brian-lovin.jpg | https://pbs.twimg.com/profile_images/1217652661962661888/WfiUNjzP_200x200.jpg | Brian Lovin |
| img/testimonials/guillermo.jpg | /testimonials/guillermo.jpg | Guillermo Rauch |
| img/logos/yc.png | /logos/yc.png | Garry Tan company icon (16px) |
| img/logos/instacart-favicon.png | https://www.instacart.com/favicon.ico (via next/image) | Brandon company icon |
| img/logos/notion.svg | /logos/notion.svg | Cole and Brian company icon |

## Images: feature demos (§4–7)
| local | original | used |
|---|---|---|
| img/demos/beethoven.jpg | /demos/multiplayer/beethoven.jpg | Ludwig avatar (H2 stack, multiplayer row, mention chip) |
| img/demos/mozart.jpg | /demos/multiplayer/mozart.jpg | Wolfgang |
| img/demos/clara-schumann.jpg | /demos/multiplayer/clara-schumann.jpg | Clara (object-position center 25% in the H2 stack); also the sandbox Home avatars |
| img/demos/bach.jpg | /demos/multiplayer/bach.jpg | Johann |
| img/demos/chopin.jpg | /demos/multiplayer/chopin.jpg | Frédéric |
| img/demos/charlie.jpg | /charlie.jpg | Sandbox sidebar Home avatar 1 |
| img/demos/jackson.jpg | /jackson.jpg | Sandbox sidebar Home avatar 2 |
| img/demos/conductor-app-icon.png | /docs-assets/logo/conductor.png (md5-verified identical) | Sandbox sidebar "Conductor" row icon (20px) |
| img/meta/icon.png | /icon.png (md5-verified identical) | Sandbox "My workspaces" row icons (16px); also the favicon PNG |
| img/demos/conductor-mobile-dock.jpeg | /demos/anywhere/conductor-mobile-dock.jpeg (1825x862) | "Conduct from anywhere" image |
| img/animations/typing.webp | /animations/typing.webp (240x240, 63 frames, 1088ms loop) | Multiplayer typing indicator (mask, 16px) |
| img/animations/working.webp | /animations/working.webp (48 frames, 816ms loop) | Orchestration "working" spinner (mask, 12px) |
| img/animations/setting-up.webp | /animations/setting-up.webp | In the JS mask map; not rendered on the homepage |
| img/animations/typing-detailed.webp | /animations/typing-detailed.webp | In the JS mask map; not rendered on the homepage |
| img/animations/waiting.webp | /animations/waiting.webp | In the JS mask map; not rendered on the homepage |
| video/cmdn.mp4 | /demos/sandbox/cmdn.mp4 (640x360 H.264, 1.366s) | Sandbox demo shortcut video layer (M7) |

## Images: CTA
| local | original | used |
|---|---|---|
| img/conductor-orchestra.webp | /conductor-orchestra.webp (960x540) | "Be like this guy." background, §10 |

## Meta
| local | original | used |
|---|---|---|
| img/meta/favicon.ico | /favicon.ico?favicon.3476jr4lt33r6.ico (256x256, 7 sizes) | `<link rel=icon sizes=256x256 type=image/x-icon>` |
| img/meta/icon.png | /icon.png?icon.1jxify8gcumnm.png (512x512) | `<link rel=icon sizes=512x512 type=image/png>` |
| img/meta/apple-icon.png | /apple-icon.png?apple-icon.1jxify8gcumnm.png (512x512) | `<link rel=apple-touch-icon>` |
| img/meta/opengraph-image.webp | /opengraph-image?e6005c6902b946ec (1200x630 webp) | og:image / twitter:image |

Head meta to copy:
- title: "Conductor - Run a team of coding agents in the cloud"
- description and og:description: "Run coding agents in isolated cloud sandboxes with Conductor Cloud."
- og:image:alt: "Conductor — Run a team of coding agents in the cloud"
- `theme-color` #2c2826 (light) / #eae8e6 (dark)
- `<html lang="en" class="light" style="color-scheme: light">`

## SVG (extracted inline; all use `currentColor`)
| local | origin | used |
|---|---|---|
| svg/conductor-logomark.svg | inline `ConductorLogomark` (viewBox 0 0 115 174) | Header home link, h 28px |
| svg/cloud-loader.svg | inline cloud-loader (viewBox 0 0 140 80, 18 dots) | Sandbox demo loader (M8) |
| svg/openai-mark.svg | inline (viewBox 24) | Orchestration "GPT-5.6 Sol" icon |
| svg/claude-fable-mark.svg | inline (viewBox 24) | Orchestration "Fable 5" icon, color #D97757 |
| svg/verified-badge.svg | inline (viewBox 0 0 22 22) | Testimonial verified badge, 16px |
| svg/icon-arrow-right.svg | lucide arrow-right | Get Conductor, Learn more, See what people are saying, View all, dialog waitlist |
| svg/icon-arrow-left.svg | lucide arrow-left | Sandbox faux title bar |
| svg/icon-arrow-down.svg | lucide arrow-down | "Download now" hover icon |
| svg/icon-download.svg | lucide download | "Download now" rest icon |
| svg/icon-menu.svg | lucide menu | Mobile menu button |
| svg/icon-x.svg | lucide x | Mobile menu close, dialog close |
| svg/icon-panel-left.svg | lucide panel-left | Sandbox faux title bar |
| svg/icon-house.svg | lucide house | Sandbox sidebar "Home" |
| svg/icon-plus.svg | lucide plus | Sandbox sidebar "Create" |
| svg/icon-file-text.svg | lucide file-text | Orchestration "Conductor API" tool row |
| svg/icon-git-pull-request-arrow.svg | lucide git-pull-request-arrow | Orchestration result |
| svg/icon-shield-check.svg | lucide shield-check | Footer "SOC 2 Type II" |
| svg/apple-logo.svg | inline (dialog) | Download dialog primary button (added this run) |
| svg/icon-corner-down-left.svg | lucide corner-down-left | Download dialog kbd hint (added this run) |

Not downloaded (intentionally): the PostHog, Cloudflare beacon and rocket-loader scripts; all JS/CSS bundles (a copy lives in the user's saved `_files` folder).
