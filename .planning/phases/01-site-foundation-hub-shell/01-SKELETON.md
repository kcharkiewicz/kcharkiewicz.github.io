# Walking Skeleton — kcharkiewicz.github.io (Game Tools Hub)

**Phase:** 1
**Generated:** 2026-06-04

## Capability Proven End-to-End

A visitor can land on the deployed hub at https://kcharkiewicz.github.io, click the Where Winds Meet game card, reach the WWM game page, click the Spawn Timer tool, land on its bookmarkable stub page, and navigate back up via breadcrumb at every level — all dark-themed with the jade accent, served as static files from GitHub Pages with zero 404s.

This is the thinnest end-to-end slice that exercises the full stack: file authoring → root-absolute asset linking → inline-registry rendering → the full 3-level URL hierarchy → GitHub Pages "Deploy from a branch" delivery.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | None — plain HTML/CSS/JS, no build step | CF-01 / STATE.md: a build toolchain is a net liability at this scale; overrides CLAUDE.md's Eleventy+Tailwind recommendation for v1 |
| Templating / rendering | Inline JS registry arrays + template-literal `renderCards()` per page; no fetch, no SSG | CF-04: adding a game/tool = one array entry (HUB-05); no async failure points for a 3-page site |
| Styling | Single shared `/shared/theme.css` with CSS custom-property tokens; per-game accent via `[data-game]` attribute override | CF-03 / D-03: one token source of truth; accent layer is provably reusable for future games |
| Navigation | JS-injected breadcrumb (`<nav aria-label="Breadcrumb">`) per non-root page; CSS-generated separators | D-07 / D-08 / RESEARCH Pattern 3: DRY wayfinding without a build step; screen-reader-safe separators |
| Data layer | None (no DB, no backend) — all content is static, in-page registry data | PROJECT.md constraint: static-only GitHub Pages; localStorage (presets) arrives in Phase 3 |
| Deployment target | GitHub Pages, user/org apex-domain site, "Deploy from a branch" (main, /root) | SITE-01 / RESEARCH: no Actions build job needed for static files; root-absolute paths are safe at the apex domain |
| Directory layout | Fixed: `/index.html`, `/games/<game>/index.html`, `/games/<game>/tools/<tool>/index.html`; shared at `/shared/`; assets root-absolute, all-lowercase | CF-02 / CF-05 / STATE.md Architecture Conventions |
| Deployment guards | `.nojekyll` at repo root (first asset guard); all-lowercase filenames enforced by convention (NOT `core.ignorecase false` on Windows) | CF-05 / RESEARCH Pitfalls 1 & 2 |

## Stack Touched in Phase 1

- [x] Project scaffold — no framework/build; repo structure + `.nojekyll` + shared theme tokens (`shared/theme.css`) + `README.md` dev-run note
- [x] Routing — directory-index URL hierarchy: `/`, `/games/where-winds-meet/`, `/games/where-winds-meet/tools/spawn-timer/`
- [x] Data — static inline registry arrays (games on the hub, tools on the game page); no DB read/write applies to a static no-backend site (deferred to Phase 3 localStorage)
- [x] UI — inline `renderCards()` renders cards from the registry; JS-injected breadcrumb; per-game accent applied via `data-game`
- [x] Deployment — live on GitHub Pages at kcharkiewicz.github.io ("Deploy from a branch"), with a documented `python -m http.server 8080` local-run command

> Note: "DB read/write" from the generic skeleton checklist is N/A here — the project's static-only constraint (PROJECT.md) means there is no data layer in Phase 1. Client-side persistence (localStorage) is introduced in Phase 3, layered on this skeleton without changing any decision above.

## Out of Scope (Deferred to Later Slices)

- Any timer behavior, inputs, or controls — the spawn-timer page is a themed stub (D-09); Phase 2 replaces its body in place at the same URL.
- Audio, alerts, presets, localStorage — Phases 2–4.
- Responsive/touch hardening and Screen Wake Lock — Phase 5 (THEME-04); Phase 1 only ensures shells do not break on narrow viewports.
- Status badges, search/filter on cards — v2 (HUB-V2-01/02).
- Real WWM cover artwork — the `cover.svg` placeholder is drop-in swappable with no code change (D-06).
- A second real game — the registry pattern supports it (HUB-05) but v1 ships one game end-to-end.
- Build toolchain (Eleventy/Tailwind/PostCSS), custom 404 page, custom domain/DNS.

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions (no framework, root-absolute paths, shared theme tokens, fixed directory layout, Deploy-from-a-branch):

- **Phase 2 — Timer Core:** replace the spawn-timer stub body in place with the drift-corrected Web Worker timer, glanceable display, cycle counter, state UI, and first-and-subsequent-cycle audio (adds `spawn-timer.css`, `spawn-timer.js`, `timer.worker.js` co-located at the tool path).
- **Phase 3 — Preset Manager:** named preset CRUD via defensive namespaced `localStorage` (`/shared/storage.js`), layered onto the timer page.
- **Phase 4 — Audio Controls:** volume/mute + bundled sound selection (`/shared/audio.js`), both persisted.
- **Phase 5 — Second-Screen Polish:** responsive layout, large touch targets (THEME-04), and Screen Wake Lock on the timer page.
