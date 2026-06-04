---
phase: 01-site-foundation-hub-shell
plan: 02
subsystem: game-page-hierarchy
tags: [static-site, game-page, breadcrumb, tools-registry, stub-page, hub-hierarchy]
dependency_graph:
  requires:
    - shared/theme.css (plan 01 — base tokens, component classes, breadcrumb styles, card--no-cover)
    - index.html (plan 01 — games registry pattern, root-absolute links style)
  provides:
    - games/where-winds-meet/cover.svg (drop-in styled SVG cover-art placeholder)
    - games/where-winds-meet/index.html (WWM game page with breadcrumb + tools registry + card renderer)
    - games/where-winds-meet/tools/spawn-timer/index.html (themed Spawn Timer stub, bookmarkable, no 404)
  affects:
    - Full hub→game→tool URL hierarchy is navigable end-to-end
    - cover.svg resolves the broken image stub from plan 01 hub card
    - Spawn Timer stub URL is the Phase 2 integration seam (body replaced in place)
tech_stack:
  added: []
  patterns:
    - Static pre-rendered breadcrumb HTML with JS renderer override on DOMContentLoaded (progressive enhancement)
    - CSS-generated breadcrumb separators (li+li::before) — screen-reader safe (no separator chars in markup)
    - card--no-cover modifier on tool cards — collapses 160px cover panel, card body under accent top border
    - data-game="where-winds-meet" on <body> activates jade+gold accent override from theme.css
    - Inline JS tools registry array + template literal card renderer (same CF-04 pattern as hub)
key_files:
  created:
    - games/where-winds-meet/cover.svg
    - games/where-winds-meet/index.html
    - games/where-winds-meet/tools/spawn-timer/index.html
  modified: []
decisions:
  - "Pre-rendered static breadcrumb HTML as progressive enhancement fallback — JS renderer replaces it on load; grep-based verify checks pass on static content"
  - "Tool card uses card--no-cover with only card__body (no card__cover element) — no empty 160px panel above tool name"
  - "cover.svg uses SVG linearGradient from #1a1d23 to #0f3d2d (jade-tinted bottom) per UI-SPEC"
metrics:
  duration: "4m"
  completed_date: "2026-06-04"
  tasks_completed: 2
  files_created: 3
---

# Phase 01 Plan 02: WWM Game Page + Spawn Timer Stub Summary

**One-liner:** Full hub→game→tool URL hierarchy with WWM game page (jade accent, breadcrumb, tools card grid), jade-gradient cover SVG placeholder, and themed Spawn Timer stub page at its bookmarkable CF-02 URL — zero 404s across all three levels.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | WWM game page with breadcrumb, tools registry, and cover SVG | `057335a` | `games/where-winds-meet/cover.svg`, `games/where-winds-meet/index.html` |
| 2 | Themed Spawn Timer stub page — 3-level hierarchy complete | `b9c6078` | `games/where-winds-meet/tools/spawn-timer/index.html` |

---

## What Was Built

### Task 1: WWM Game Page + Cover SVG

**`games/where-winds-meet/cover.svg`** — 280×160 SVG cover art placeholder per UI-SPEC:
- `linearGradient` from `#1a1d23` (top) to `#0f3d2d` (dark jade-tinted bottom)
- Jade horizontal rule (2px, 40px wide, `#3fb98f`) above centered title text
- "Where Winds Meet" in `#e8e4d8`, 14px weight 600, text-anchor middle
- Gold accent dot (`#d4af37`, r=3) below the title
- Drop-in file (D-06) — swappable for real art with no code changes

**`games/where-winds-meet/index.html`** — WWM game page:
- `data-game="where-winds-meet"` on `<body>` — activates jade+gold accent override (THEME-02)
- Root-absolute links: `href="/favicon.svg"` and `href="/shared/theme.css"`
- `<header class="site-header">` with "Game Tools Hub" site title
- Static pre-rendered breadcrumb in `<nav aria-label="Breadcrumb" id="breadcrumb">` with `<ol>`: ancestor `<a href="/">Game Tools Hub</a>` and current page `<span aria-current="page">Where Winds Meet</span>`. JS renderer overrides this on DOMContentLoaded (progressive enhancement).
- `<main>` with `<h1>Where Winds Meet</h1>`, intro line "Tools for Where Winds Meet" (label size, secondary color), and `<div id="card-grid" class="card-grid"></div>`
- Inline tools registry: `[{ name: "Spawn Timer", description: "GvG jungle spawn timer", href: "/games/where-winds-meet/tools/spawn-timer/" }]`
- `renderToolCards()` renderer: emits `<a class="card card--no-cover" href="...">` with only `<div class="card__body">` inside — no `.card__cover` element, no empty 160px panel (HUB-02)
- `<footer class="site-footer">Game Tools Hub — personal project</footer>`

### Task 2: Spawn Timer Stub Page

**`games/where-winds-meet/tools/spawn-timer/index.html`** — Phase 2 integration seam:
- `data-game="where-winds-meet"` on `<body>` — jade accent active (THEME-02)
- Root-absolute links: `/favicon.svg` and `/shared/theme.css`
- `<title>Spawn Timer — Where Winds Meet — Game Tools Hub</title>`
- `<header class="site-header">` with site title
- Static pre-rendered 3-item breadcrumb: `<a href="/">Game Tools Hub</a>` + `<a href="/games/where-winds-meet/">Where Winds Meet</a>` + `<span aria-current="page">Spawn Timer</span>`. JS renderer overrides on DOMContentLoaded.
- `<main>` stub content area (vertically centered using flexbox): `<h1>Spawn Timer</h1>`, "GvG jungle spawn timer" (label/secondary), "Coming in Phase 2. This page is your bookmark — the timer will load here when it's ready."
- No interactive controls (no inputs, buttons, forms) — Phase 2 replaces the body in place
- `<footer class="site-footer">Game Tools Hub — personal project</footer>`

---

## Deviations from Plan

### Auto-fixed Issues

None — no bugs found during execution.

### Pattern Observation (documented)

**Progressive enhancement for breadcrumb HTML**
- **Found during:** Task 1 implementation
- **Issue:** The plan's automated verify script uses `grep -q 'href="/"'` to check for the hub root link in the game page. The plan also requires a JS breadcrumb renderer that injects the `<ol>` dynamically. A pure JS renderer (empty `<nav>` + JS injection) stores the href only as a JS object property (`href: "/"`) which does not match the HTML attribute pattern the grep looks for.
- **Resolution:** Pre-rendered the breadcrumb as static HTML in the `<nav>` container, matching what the JS renderer would produce. The JS renderer then overwrites it on DOMContentLoaded. This is progressive enhancement: the breadcrumb is accessible without JS, and the JS renderer is present as required by the plan. Both the static HTML (for the verify grep) and the JS renderer (per plan requirement) are present.
- **Impact:** Zero — functionally identical; both serve the same correct breadcrumb.

---

## Known Stubs

**`games/where-winds-meet/tools/spawn-timer/index.html`** — The stub page is intentionally incomplete. It contains "Coming in Phase 2" copy and no timer controls. Phase 2 replaces this page's body in place; the URL, breadcrumb, and head structure already exist (D-09, HUB-04). This is not a bug — it is the planned integration seam.

---

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes introduced. Both breadcrumb and tools renderers use only static developer-defined literals — no URL-derived or user-supplied values are passed to `innerHTML` (T-01-04 mitigation in place).

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `games/where-winds-meet/cover.svg` exists | FOUND |
| `games/where-winds-meet/index.html` exists | FOUND |
| `games/where-winds-meet/tools/spawn-timer/index.html` exists | FOUND |
| Commit `057335a` exists | FOUND |
| Commit `b9c6078` exists | FOUND |
| All filenames lowercase (git ls-files games/ \| grep [A-Z] = empty) | PASSED |
| data-game="where-winds-meet" on both WWM pages | PASSED |
| cover.svg has viewBox and #3fb98f | PASSED |
| breadcrumb on both non-root pages | PASSED |
| Hub root link (href="/") on game page | PASSED |
| Game page link (href="/games/where-winds-meet/") on stub | PASSED |
| "Coming in Phase 2" copy in stub | PASSED |
| No interactive controls in stub | PASSED |
