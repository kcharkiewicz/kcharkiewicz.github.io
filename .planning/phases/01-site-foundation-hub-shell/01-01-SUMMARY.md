---
phase: 01-site-foundation-hub-shell
plan: 01
subsystem: site-shell
tags: [static-site, css-tokens, theming, favicon, hub-landing, deployment-guards]
dependency_graph:
  requires: []
  provides:
    - .nojekyll (Jekyll bypass guard)
    - shared/theme.css (base dark-theme token system + per-game accent mechanism + shared component CSS)
    - favicon.svg (GT monogram hub favicon)
    - index.html (hub landing page with inline games registry + card renderer)
    - README.md (dev server command + case audit note)
  affects:
    - All subsequent pages link /shared/theme.css
    - Plan 02 consumes .card--no-cover modifier and breadcrumb styles from theme.css
    - Plan 03 consumes .site-breadcrumb breadcrumb component styles
tech_stack:
  added: []
  patterns:
    - CSS custom properties for design tokens (:root base + [data-game] per-game accent override)
    - Inline JS registry array + template literal card renderer (drop-in extensible)
    - CSS-generated breadcrumb separators (li+li::before) — screen-reader safe
    - CSS Grid auto-fill + justify-content:center for single-card centering
key_files:
  created:
    - .nojekyll
    - shared/theme.css
    - favicon.svg
    - index.html
    - README.md
  modified: []
decisions:
  - "auto-fill (not auto-fit) for card grid — keeps cards at natural width, centers single card"
  - "CSS-generated breadcrumb separators — not in markup so screen readers skip the slash"
  - ".card--no-cover modifier collapses cover panel footprint — plan 02 tool cards use this"
  - "data-game attribute selector in theme.css for per-game accent — zero JS, self-documenting"
  - "README.md kept uppercase — docs convention, not a linked site asset, no 404 risk"
metrics:
  duration: "2m 41s"
  completed_date: "2026-06-04"
  tasks_completed: 2
  files_created: 5
---

# Phase 01 Plan 01: Deployment Guards + Shared Theme + Hub Landing Summary

**One-liner:** Walking-skeleton hub with Jekyll bypass guard, CSS custom-property dark-theme token system with jade/gold per-game accent mechanism, GT monogram SVG favicon, and hub landing page rendering a Where Winds Meet card from an inline JS registry.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Deployment guards and shared theme tokens | `3518fe0` | `.nojekyll`, `shared/theme.css`, `README.md` |
| 2 | Hub landing page + favicon | `059fc25` | `favicon.svg`, `index.html` |

---

## What Was Built

### Task 1: Deployment Guards and Shared Theme Tokens

**`.nojekyll`** — Empty file at repo root. Bypasses GitHub Pages Jekyll processing so no files are silently dropped. Must be committed first.

**`shared/theme.css`** — Foundational CSS file consumed by all pages via root-absolute link. Contains:
- `:root` base token set: full dark neutral palette (`#0f1115` bg through `#9a9690` text-secondary), spacing scale (`--space-xs` 4px through `--space-3xl` 64px), typography tokens (`--text-body` through `--text-display`), system font stack with `font-feature-settings: "kern" 1`
- `[data-game="where-winds-meet"]` accent override block (jade `#3fb98f` + gold `#d4af37`) — the provably reusable per-game accent mechanism (THEME-02)
- Global `:focus-visible` ring: `outline: 2px solid var(--color-accent); outline-offset: 2px`
- Shared component styles: `.site-header`, `.site-title`, `.card-grid` (CSS Grid `auto-fill` + `justify-content: center` for single-card centering), `.card` with accent top border + hover transition, `.card__cover`, `.card__body`, `.card__name`, `.card__count`, `.site-footer`
- `.card--no-cover` modifier: collapses `.card__cover` footprint (display:none) for tool cards in plan 02 that carry no cover image
- Accessible breadcrumb styles scoped to `nav[aria-label="Breadcrumb"]` / `.site-breadcrumb`: CSS-generated `li + li::before { content: " / " }` separator (not in markup — screen readers skip it), ancestor link colors, `[aria-current="page"]` leaf using `--color-accent`

**`README.md`** — Documents the `python -m http.server 8080` dev-server command (root-absolute paths require HTTP server, not `file://`) and the `git ls-files | grep -E '[A-Z]'` case audit.

### Task 2: Hub Landing Page + Favicon

**`favicon.svg`** — 32×32 GT monogram badge: `#0f1115` rounded-rect background (rx 6), "G" in `#e8e4d8` (parchment), "T" in `#3fb98f` (jade), `system-ui` font — game-agnostic hub identity.

**`index.html`** — Hub landing page:
- No `data-game` attribute on `<body>` — hub stays neutral (D-01)
- Root-absolute links: `href="/favicon.svg"` and `href="/shared/theme.css"`
- Compact header (`<header class="site-header">`) with `<span class="site-title">Game Tools Hub</span>`
- Main with `<div id="card-grid" class="card-grid"></div>`
- Footer: "Game Tools Hub — personal project"
- Inline games registry: single WWM entry `{ slug, name, toolCount: 1, href: "/games/where-winds-meet/", cover: "/games/where-winds-meet/cover.svg" }`
- `renderCards(items, containerId)`: maps items to `<a class="card">` with cover panel (`<img>`) + card body (name + pluralized count `toolCount !== 1 ? 's' : ''`), assigns to `innerHTML`
- Called on `DOMContentLoaded` — drop-in extensible by inserting one registry entry (HUB-05)

---

## Deviations from Plan

### Auto-fixed Issues

None — no bugs found during execution.

### Plan Observation (documented, not fixed)

**README.md uppercase filename vs acceptance criteria**
- **Found during:** Task 1 verification
- **Issue:** The plan acceptance criteria states "git ls-files over the created files returns zero uppercase-containing names," but the task action explicitly says `Create README.md` (a universal GitHub convention requiring uppercase for auto-display). The plan's own verify command `grep -E '[A-Z]'` on the README.md path will always match the filename itself.
- **Decision:** Kept `README.md` uppercase per universal convention. `README.md` is a documentation file never linked from any HTML page, so it carries zero risk of a GitHub Pages 404 case-mismatch. The intent of the lowercase rule (RESEARCH Pitfall 2) is about linked site assets (`.html`, `.css`, `.svg`). All site assets are all-lowercase.
- **Impact:** None on site functionality or deployment.

---

## Known Stubs

**`/games/where-winds-meet/cover.svg`** — Referenced in the games registry (`cover: "/games/where-winds-meet/cover.svg"`) but not yet created. The file will be created in plan 02. The `<img>` element will show a broken image until then, but the card layout and all other functionality are correct. This is intentional — plan 02 creates the WWM game page and cover art.

Note: The hub renders the WWM card with a broken cover image until plan 02 creates `cover.svg`. The card structure, theming, and registry/renderer pattern are fully functional.

---

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes were introduced. The `renderCards()` function uses only static developer-defined registry data — no URL-derived or user-supplied values are passed to `innerHTML` (T-01-01 mitigation in place).

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `.nojekyll` exists | FOUND |
| `shared/theme.css` exists | FOUND |
| `README.md` exists | FOUND |
| `favicon.svg` exists | FOUND |
| `index.html` exists | FOUND |
| Commit `3518fe0` exists | FOUND |
| Commit `059fc25` exists | FOUND |
| `01-01-SUMMARY.md` exists | FOUND |
