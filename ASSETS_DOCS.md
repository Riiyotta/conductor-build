Source: https://www.conductor.build/

# Docs and changelog media manifest

Generated from `src/content/media-manifest.json`, which `scripts/scrape-content.mjs` writes. That JSON is the complete per-file list: remote URL, local path, kind, bytes, content type and referencing pages. All local paths are relative to `public/`.

## Summary
- References: **342**. Downloaded: **337** (316 images, 21 videos), **1135.5 MB** total. Failed: **5** (404 on origin).
- Content JSON (`src/content/docs/*.json`, `src/content/changelog/*.json`, including `html`, `markdown` and `hero`) already points at these local paths.
- Failed files keep their original remote URL in the content.
- Formats: {'image/png': 291, 'image/webp': 10, 'video/mp4': 21, 'image/gif': 13, 'image/jpeg': 2}

## Folder layout
| folder | files | size | contents |
|---|---|---|---|
| `public/assets/changelog/images/` | 56 | 34.0 MB | Changelog images served by the site itself (`/changelog/*.png`, `.gif`, `.webp`, next/image 800x450 attrs). |
| `public/assets/changelog/media/<version>/` | 261 | 173.1 MB | Changelog media hosted elsewhere (`conductor-marketing.t3.tigrisfiles.io` uploads and `github.com/user-attachments`), one folder per release version. GitHub attachments had no extension, so the extension was added from the content type. |
| `public/assets/docs/images/` | 8 | 2.9 MB | Docs screenshots (from `https://www.conductor.build/docs-assets/images/…`). PNG. Includes the light/dark pair `cloud-computer-graphite-{light,dark}.png`; render the light one. |
| `public/assets/docs/media/` | 3 | 925.4 MB | Docs videos (from `https://melty.t3.storage.dev/…`). MP4, played with `controls playsinline`. |
| `public/assets/docs/youtube/` | 9 | 0.1 MB | YouTube poster frames `<videoId>-sddefault.webp` (from i.ytimg.com, webp) for the 9 distinct lite-youtube embeds. |

## Docs media (all files)
| local | type | size | used by (docs slug) |
|---|---|---|---|
| `/assets/docs/images/cloud-collaboration-chat.png` | image/png | 0.2 MB | cloud |
| `/assets/docs/images/cloud-computer-graphite-dark.png` | image/png | 0.1 MB | cloud |
| `/assets/docs/images/cloud-computer-graphite-light.png` | image/png | 0.1 MB | cloud |
| `/assets/docs/images/git-worktrees-claude-code-workspace.png` | image/png | 0.4 MB | guides/git-worktrees/run-claude-code-with-git-worktrees, guides/parallel-agents/run-multiple-claude-code-sessions |
| `/assets/docs/images/git-worktrees-codex-workspace.png` | image/png | 0.4 MB | guides/git-worktrees/run-codex-with-git-worktrees, guides/parallel-agents/run-multiple-codex-sessions |
| `/assets/docs/images/new-workspace.png` | image/png | 1.7 MB | first-workspace |
| `/assets/docs/images/select-working-directories.png` | image/png | 0.0 MB | guides/repositories/monorepos |
| `/assets/docs/images/sidebar1.png` | image/png | 0.0 MB | concepts/workspaces-and-branches |
| `/assets/docs/media/ConductorAdvancedSetup.mp4` | video/mp4 | 164.1 MB | reference/scripts |
| `/assets/docs/media/ConductorDiffExplainer.mp4` | video/mp4 | 25.9 MB | reference/diff-viewer |
| `/assets/docs/media/workflow.mp4` | video/mp4 | 735.4 MB | concepts/workflow |
| `/assets/docs/youtube/2fkwP_xuE9Q-sddefault.webp` | image/webp | 0.0 MB | guides/issue-to-pr |
| `/assets/docs/youtube/IkkTL21jGW0-sddefault.webp` | image/webp | 0.0 MB | concepts/workspaces-and-branches |
| `/assets/docs/youtube/KSQaIFJvGQQ-sddefault.webp` | image/webp | 0.0 MB | reference/big-terminal-mode |
| `/assets/docs/youtube/MjX10slErMM-sddefault.webp` | image/webp | 0.0 MB | concepts/agent-modes |
| `/assets/docs/youtube/R21ghifdrXg-sddefault.webp` | image/webp | 0.0 MB | reference/scripts/spotlight-testing |
| `/assets/docs/youtube/UDlV5G0V0cM-sddefault.webp` | image/webp | 0.0 MB | concepts/parallel-agents, guides/parallel-agents/run-multiple-claude-code-sessions, guides/parallel-agents/run-multiple-codex-sessions, guides/parallel-agents/run-multiple-cursor-sessions |
| `/assets/docs/youtube/Uz6TfQWFdIg-sddefault.webp` | image/webp | 0.0 MB | guides/use-files-to-copy, reference/files-to-copy |
| `/assets/docs/youtube/VsWWy2kVpa8-sddefault.webp` | image/webp | 0.0 MB | index |
| `/assets/docs/youtube/vMfDRck174s-sddefault.webp` | image/webp | 0.0 MB | reference/harnesses/opencode |

## Changelog videos (all files)
| local | size | post |
|---|---|---|
| `/assets/changelog/media/0.31.3/1768852746133-Clipboard-20260117-203656-672.mp4` | 1.2 MB | 0.31.3-askuserquestion-improvements |
| `/assets/changelog/media/0.36.9/1772243714830-Conductorsnappy.mp4` | 2.5 MB | 0.36.9-performance-improvements |
| `/assets/changelog/media/0.37.0/1772585344123-video.mp4` | 3.2 MB | 0.37.0-manual-mode |
| `/assets/changelog/media/0.39.0/1773449853029-video.mp4` | 0.8 MB | 0.39.0-insta-summarize-command-palette-opus-4-6 |
| `/assets/changelog/media/0.45.0/1775088337448-video.mp4` | 3.6 MB | 0.45.0-file-previews-codex-personalities |
| `/assets/changelog/media/0.46.0/1775441947842-ConductorArchiving.mp4` | 2.4 MB | 0.46.0-bug-fixes-instant-archiving-terminal |
| `/assets/changelog/media/0.49.0/1776907036915-video.mp4` | 6.5 MB | 0.49.0-conductor-allegro-gpt-5-5 |
| `/assets/changelog/media/0.55.0/1779307967770-video.mp4` | 4.4 MB | 0.55.0-per-repo-spotlight-html-previews |
| `/assets/changelog/media/0.62.0/1780691922016-video.mp4` | 17.7 MB | 0.62.0-repo-settings-browser-preview |
| `/assets/changelog/media/0.62.0/1780691923117-video.mp4` | 1.2 MB | 0.62.0-repo-settings-browser-preview |
| `/assets/changelog/media/0.62.0/1780691923531-video.mp4` | 0.3 MB | 0.62.0-repo-settings-browser-preview |
| `/assets/changelog/media/0.63.0/1780949731653-8800ea3d-39d5-45a7-baf1-bdc4d71240d6-Clipboard-20260608-201521-313.mp4` | 4.9 MB | 0.63.0-cursor-support-dispatcher |
| `/assets/changelog/media/0.63.0/1780951829667-e33e58c6-daef-43aa-86bc-87e7fc0d3bf5-Clipboard-20260608-204802-476.mp4` | 6.1 MB | 0.63.0-cursor-support-dispatcher |
| `/assets/changelog/media/0.64.0/1781028245148-53c92d41-315a-4f49-8299-a916e6ac50a5-Clipboard-20260609-180356-502.mp4` | 2.5 MB | 0.64.0-claude-fable-5 |
| `/assets/changelog/media/0.65.0/1781278112622-895268e6-22fd-4b43-a239-44e247960c3f-CleanShot_2026-06-12_at_08.27.48.mp4` | 0.5 MB | 0.65.0-codex-goal-support |
| `/assets/changelog/media/0.65.0/1781286329427-9669f3d9-05ed-4540-96dd-f0d9db92a62d-CleanShot_2026-06-12_at_10.40.21.mp4` | 0.3 MB | 0.65.0-codex-goal-support |
| `/assets/changelog/media/0.66.0/1781641450211-2f61d0db-f5fc-4342-bf6b-b7cbfa04315c-Clipboard-20260616-202400-036.mp4` | 2.0 MB | 0.66.0-create-workspace-from-issue |
| `/assets/changelog/media/0.69.0/1782241182948-2dab283a-463f-49d7-b36a-eaee4b274665-opencode.mp4` | 2.0 MB | 0.69.0-opencode |

## Changelog images
299 files, 145.0 MB. See `src/content/media-manifest.json` for the per-file list.

## Failed downloads (HTTP 404 on origin; these are broken on the live site too, and the content keeps the remote URL)
| remote | post |
|---|---|
| https://github.com/user-attachments/assets/4c405ab0-2584-49a5-876e-bf20ade3ff20 | 0.25.0-workspace-storage-improvements-ai-response-metadata-and-slash-commands |
| https://github.com/user-attachments/assets/e0ee2f88-b979-41e2-9cfa-4eac1f02cce5 | 0.15.1-claude-s-thinking |
| https://github.com/user-attachments/assets/27d78c8d-cf35-4bc9-844a-9a97f0bc62ce | 0.15.0-linear |
| https://github.com/user-attachments/assets/d44ef61d-b7cf-4b86-b2af-ce9d6e59e70b | 0.15.0-linear |
| https://github.com/user-attachments/assets/63b6eeba-e3fc-4910-b576-9b59b2ab2f5a | 0.14.0-command-palette |

## Notes
- `workflow.mp4` (≈735 MB) and `ConductorAdvancedSetup.mp4` (≈164 MB) dominate the total size. Vite copies `public/` into `dist/` verbatim, so consider pointing those two at their remote URLs (in the manifest) instead.
- 10 older changelog posts contain an indented `<video src="…tigrisfiles…">` in their markdown. The live site renders this as **literal escaped text** inside a `<p>`, not as a video. The content `html` reproduces that faithfully and those URLs are not downloaded.
- No fonts are needed beyond CLONE_SPEC.md: docs and changelog use system stacks.
- Icons (lucide, Shiki language icons and the Conductor mark) are stored inline as SVG strings in the content JSON. They are not separate files.
- These pages load no other images. The `/about.webp` request seen on docs pages belongs to the shared download dialog and is already covered by ASSETS.md.
