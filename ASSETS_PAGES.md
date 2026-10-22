Source: https://www.conductor.build/

# Asset manifest: standalone marketing pages
Files live in `public/assets/pages/<page>/` and are served at `/assets/pages/...`. Original origin: `https://www.conductor.build`. All files were downloaded at full original resolution (Next.js `/_next/image?url=X` was resolved to `X`). Assets already present in `public/assets/` (see `ASSETS.md`) are reused and listed at the end, not duplicated.

## /enterprise
| local | original | dims / size | used |
|---|---|---|---|
| pages/enterprise/life360.png | /logos/life360.png | 1200x364 PNG | Logo grid #5, rendered h 24 (20 at 390) with `filter: brightness(0)` |
| pages/enterprise/reducto.svg | /logos/reducto.svg | viewBox 924x163 | Logo grid #7, h 20 (16 at 390) |
| pages/enterprise/fonts/Geist-400.woff2 | https://cdn1.hubspotusercontent-na2.net/googlefonts/fonts/Geist/regular.woff2 | 27 KB | HubSpot form font (only needed if rebuilding the form natively) |
| pages/enterprise/fonts/Geist-700.woff2 | https://cdn1.hubspotusercontent-na2.net/googlefonts/fonts/Geist/700.woff2 | 28 KB | HubSpot form submit button weight 700 |

## /slack
| local | original | dims | used |
|---|---|---|---|
| pages/slack/slack-search.png | /slack/slack-search.png | 1360x944 PNG | Prose image, 768x533 (358x248.5 at 390). Alt "An agent searching Slack from a Conductor chat" |

## /join-us
| local | original | dims | used |
|---|---|---|---|
| pages/join-us/about.webp | /about.webp | 960x540 WebP | "Conductor team" photo, 768x432, r8. (The original preloads it on every page) |
| pages/join-us/guillaume.png | /team/guillaume.png | 200x200 | Team card avatar, 56px (48 at <640) |
| pages/join-us/lewis.png | /team/lewis.png | 512x512 | Team card avatar |
| pages/join-us/tywen.png | /team/tywen.png | 400x400 | Team card avatar |
| pages/join-us/kaden.png | /team/kaden.png | 512x512 | Team card avatar |
| pages/join-us/sam.png | /sam.png | 800x800 | Team card avatar |
| pages/join-us/x-logo.svg | inline SVG (viewBox 0 0 24 24, fill currentColor) | | X link icon in team cards, 12px |
| pages/join-us/icon-arrow-up-right.svg | lucide arrow-up-right (inline) | | Apply card icon, 16px |
| (existing) img/demos/charlie.jpg | /charlie.jpg (md5 identical) | 400x400 | Charlie Holtz avatar |
| (existing) img/demos/jackson.jpg | /jackson.jpg (md5 identical) | 400x400 | Jackson de Campos avatar |

## /brandkit
| local | original | dims | used |
|---|---|---|---|
| pages/brandkit/conductor-letter-dark.svg | /brandkit/conductor-letter-dark.svg | viewBox 115x174 | Preview card 1 (on #fff), h 160. Download "SVG" |
| pages/brandkit/conductor-letter-light.svg | /brandkit/conductor-letter-light.svg | viewBox 115x174 | Preview card 2 (on #282423). Download |
| pages/brandkit/conductor-wordmark-dark.svg | /brandkit/conductor-wordmark-dark.svg | 1750x269 | Preview card 3 (on #fff), 324x49.8. Download |
| pages/brandkit/conductor-wordmark-light.svg | /brandkit/conductor-wordmark-light.svg | 1750x269 | Preview card 4 (on #282423). Download |
| pages/brandkit/conductor-letter-dark.png | /brandkit/conductor-letter-dark.png | 677x1024 | Download "PNG" |
| pages/brandkit/conductor-letter-light.png | /brandkit/conductor-letter-light.png | 677x1024 | Download "PNG" |
| pages/brandkit/conductor-wordmark-dark.png | /brandkit/conductor-wordmark-dark.png | 2400x369 | Download "PNG" |
| pages/brandkit/conductor-wordmark-light.png | /brandkit/conductor-wordmark-light.png | 2400x369 | Download "PNG" |
| pages/brandkit/conductor-brandkit.zip | /brandkit/conductor-brandkit.zip | 68,730 B (the 8 files above) | "Download ZIP" button |
| pages/brandkit/well-known/agent-skills/conductor/SKILL.md | /.well-known/agent-skills/conductor/SKILL.md | 9.3 KB | "Skill" link target (serve at `/.well-known/...` for fidelity) |
| pages/brandkit/well-known/agent-skills/index.json | /.well-known/agent-skills/index.json | 675 B | "Discovery" link target |
| pages/brandkit/icon-file-archive.svg | lucide file-archive | | Download card icon tile, 16px |
| pages/brandkit/icon-copy.svg | lucide copy | | Copy buttons, 14px |
| pages/brandkit/icon-external-link.svg | lucide external-link | | Official links rows, 16px |
| (existing) svg/icon-download.svg | lucide download | | "Download ZIP" button icon |
| (existing) svg/icon-file-text.svg | lucide file-text | | Asset card info header icon, 16px |

## Shared (slack, join-us, privacy, terms)
| local | original | used |
|---|---|---|
| pages/shared/icon-link.svg | lucide link (inline) | Prose heading anchor icon, 14px, opacity 0 → 1 on hover |

## /pricing, /team-plan, /privacy, /terms
No new image assets. Pricing reuses the homepage logo strip files (`img/logos/*`, see ASSETS.md). Team-plan and enterprise forms are HubSpot embeds: script `https://js-na2.hsforms.net/forms/embed/246368856.js`, portal 246368856, region na2, form ids `f1df7d97-c440-4b74-8f51-b020c9616e2f` (enterprise) and `a7817add-03f3-49dc-9ffc-16c10009e49a` (team-plan).

## Head meta per page
| route | title | description |
|---|---|---|
| /pricing | Pricing \| Conductor | Choose the Conductor plan that fits how you and your team work. |
| /enterprise | Enterprise \| Conductor | Conductor is the best way to run multiple coding agents in parallel. Reach out to bring Conductor to your organization. |
| /team-plan | Conductor Teams \| Conductor | Team plans are currently invite-only. If you'd like to bring Conductor to your company, fill out the form below and we'll be in touch soon. |
| /slack | Conductor for Slack \| Conductor | Let the coding agents in your Conductor cloud workspaces search Slack, read threads, and post updates, acting as you. |
| /join-us | Join us \| Conductor | We're building Conductor in San Francisco and hiring engineers and designers to shape the future of AI-native software development. |
| /brandkit | Brand kit \| Conductor | Official Conductor brand assets, product description, and links. |
| /privacy | Privacy notice \| Conductor | How Conductor collects, uses, discloses, and otherwise processes personal data. |
| /terms | Terms of service \| Conductor | Customer terms and conditions for using Conductor. |
