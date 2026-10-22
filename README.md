# Conductor clone — information architecture

Local React 18 + Vite + Tailwind v3 replica of https://www.conductor.build, for local reference only (it reuses Conductor's branding, copy and assets — don't deploy it publicly). Run it with `npm install && npm run dev` → http://localhost:5220.

## IA files

| file | edit? | what it is |
|---|---|---|
| `ia.json` | **hand-edit this only** | Source of truth: categories, every section defined once, 11 templates covering all 306 sitemap routes, `implementedBy` links to the real components |
| `IA.md` | generated — don't edit | Readable IA: site shape, chrome partition, sections by reuse, per-template tables |
| `matrix.csv` | generated — don't edit | Section × template matrix for a spreadsheet |
| `validate.mjs` / `build.mjs` | copied from the ia-builder skill | Generic scripts driven entirely by `ia.json` |

After changing routes or sections, edit `ia.json` and re-run:

```bash
node validate.mjs && node build.mjs
```

## What the data shows

- **97% of routes come from 3 data-driven templates.** Changelog posts (207), docs pages (69) and the paginated changelog index (21) cover 297 of 306 routes. The other 9 routes are 8 hand-built standalone pages, which is where most of the per-page layout work sits.
- **8 sections are shared and 36 are page-local.** The header, download dialog and post-download screen appear on all 306 routes. The mono footer appears on 305 routes and the mobile menu on the 237 routes outside the docs. Of the content blocks, only the page header (4 routes), prose article (3) and the "Trusted by" logo strip (homepage + pricing) are reused.
- **The footer has two variants.** It renders in sans only on the homepage. The other 305 routes render it in real monospace (measured on standalone, docs and changelog pages), so `shell.footer-sans` and `shell.footer-mono` are separate sections.
- **The docs shell replaces the site chrome on small screens.** Below 768px the marketing header and mobile menu give way to the docs subnav and drawer, which is why `shell.mobile-menu` covers 237 routes, not 306.

## Validator notes (expected, not errors)

`validate.mjs` reconciles every hard invariant: 306 routes, 11 templates, no undefined or unused sections. It prints six informational notes because some scope sentences contain numbers that aren't route counts: screen widths (768px, 1280px) and the changelog page range "2–21". The scope text is correct; don't "fix" those numbers to match the computed route counts.

## Not in the IA

- The clone's 404 route is not in the sitemap, so it is not counted.
- `/blog` and its 4 posts (`/blog/sign-in-with-chatgpt`, `/blog/claude-subscription-update`, `/blog/cmd-joins-conductor`, `/blog/series-a`) exist on the original and are built here, but they are not in the sitemap, so they are not in `ia.json` (306 routes) or the design-repo yet. The footer's Blog link points to them.
- The 5 GitHub images that 404 on the live site are kept as remote URLs and stay broken, as on the original.
- The enterprise and team-plan forms are local-only replicas and never post to HubSpot.
