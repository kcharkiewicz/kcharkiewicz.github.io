# Phase 1: Site Foundation + Hub Shell - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a live, bookmarkable static site at kcharkiewicz.github.io with the full URL hierarchy (hub → game → tool), a consistent dark gamer theme, a per-game accent layer, a custom favicon, and a drop-in registry pattern so future games/tools require zero rework.

Covers requirements: SITE-01, SITE-02, HUB-01, HUB-02, HUB-03, HUB-04, HUB-05, THEME-01, THEME-02, THEME-03.

This phase builds the **shell and presentation** only. The spawn timer's actual behavior is Phase 2; in Phase 1 the tool URL exists as a themed placeholder page.

</domain>

<decisions>
## Implementation Decisions

### Carried Forward (locked at roadmap creation — not re-discussed)
- **CF-01:** No build step for v1 — plain HTML/CSS/JS, no SSG/bundler. **⚠ This overrides the Eleventy + Tailwind stack recommended in `CLAUDE.md`.** The governing decision is STATE.md's "build toolchain is a net liability at this scale." Do not introduce Eleventy, Tailwind, or PostCSS in this phase.
- **CF-02:** Directory layout is fixed: `/index.html`, `/games/where-winds-meet/index.html`, `/games/where-winds-meet/tools/spawn-timer/index.html`.
- **CF-03:** Shared assets at `/shared/theme.css`, `/shared/storage.js`, `/shared/audio.js` (only `theme.css` is in scope this phase).
- **CF-04:** Hub/game pages render from inline JS registry arrays + a card renderer — no fetch, no build step. Adding a game/tool = inserting one registry entry (HUB-05).
- **CF-05:** Deployment guards from first commit: `.nojekyll` in repo root, all-lowercase filenames (`git config core.ignorecase false`), root-absolute asset paths (e.g. `/shared/theme.css`) since this is a user/org apex-domain site.

### Theme vibe & accent
- **D-01:** Aesthetic direction is **wuxia ink & jade** in feel, but realized as a **neutral dark base + per-game accent layer** (not a wuxia-flavored base). The shared base theme is neutral dark; Where Winds Meet layers its accent over it. This keeps the hub game-agnostic so future non-wuxia games can each feel distinct (supports THEME-02 / HUB-05).
- **D-02:** Where Winds Meet accent: **jade `#3fb98f` (primary)** + **gold `#d4af37` (secondary)**. Base palette is a neutral dark ink (≈ `#0f1115` background, light parchment-neutral text). Exact neutral token values are Claude's discretion; the WWM accent hex values are locked.
- **D-03:** Theme is expressed as CSS custom properties in `/shared/theme.css` (base tokens) with the per-game accent set/overridden on the game page so the accent mechanism is provably reusable.

### Hub composition
- **D-04:** Landing page is **tools-first**: a compact header (site title) then straight to the game-card grid. No large hero/tagline block.
- **D-05:** Game card content = **cover art + game name + tool count** (e.g. "1 tool"). This is the reusable card template for all future games and must look correct with a single card present.
- **D-06:** WWM cover art is a **styled SVG placeholder** (jade gradient / accent panel with the title), committed as a **drop-in file** (e.g. `/games/where-winds-meet/cover.svg`) that can be swapped for real art later with no code change.

### Navigation pattern
- **D-07:** Wayfinding is a **breadcrumb trail** present on every page, e.g. `Game Tools Hub / Where Winds Meet / Spawn Timer`, with each ancestor segment clickable (HUB-03, HUB-04).
- **D-08:** Breadcrumb root / brand name displayed is **"Game Tools Hub"**.

### Unbuilt-tool handling
- **D-09:** The spawn-timer tool card links to a **real stub page at `/games/where-winds-meet/tools/spawn-timer/`** showing a themed "coming in Phase 2" placeholder. This avoids any 404 (success criterion 3), makes the tool URL bookmarkable now (HUB-04), and proves the full 3-level hierarchy + breadcrumb end-to-end in Phase 1. **Phase 2 replaces this page's body in place** — the URL and breadcrumb already exist.

### Favicon (THEME-03)
- **D-10:** Custom **SVG favicon** reflecting the hub identity. Concept is Claude's discretion but should echo the theme (a simple wind/jade motif or a clean "GT" hub mark). Must be all-lowercase path, root-absolute reference.

### Claude's Discretion
- Exact neutral base token values (background shades, surface/border, text contrast) — must meet WCAG AA (THEME-05 is Phase 2 but base contrast should already be sound).
- Typography choices, card grid column count / responsive breakpoints, hover states, footer presence/content.
- Favicon concept/artwork (per D-10).
- Stub page copy/wording for the "coming soon" placeholder.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs (in-repo)
- `.planning/REQUIREMENTS.md` — full requirement text for SITE-01/02, HUB-01–05, THEME-01–03 (the Phase 1 set).
- `.planning/ROADMAP.md` §"Phase 1" — goal + 5 success criteria that define DONE.
- `.planning/PROJECT.md` — constraints (static-only, light deps, extensibility) and Out-of-Scope boundaries.
- `.planning/STATE.md` §"Key Decisions Logged" / "Architecture Conventions" / "Pitfall Watch" — the locked architecture (CF-01…CF-05 above are drawn from here). **Authoritative over CLAUDE.md where they conflict.**

### Stack-conflict note
- `CLAUDE.md` recommends Eleventy 3 + Tailwind v4 + GitHub Actions build. **This is superseded for v1 by the "no build step" decision (CF-01).** Use plain HTML/CSS/JS. The GitHub Actions / Pages deployment guidance in CLAUDE.md is still relevant *only* insofar as the site must deploy to Pages — but no Eleventy build job is needed; a static-file Pages deploy suffices.

No other external specs/ADRs — requirements fully captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield repo (only `.planning/` and `CLAUDE.md` exist). This phase establishes the foundational assets (`/shared/theme.css`, card renderer, breadcrumb, registry arrays) that Phases 2–5 build on.

### Established Patterns
- Patterns to *establish* (per STATE.md conventions): inline JS registry arrays + card renderer; namespaced asset paths; CSS-custom-property theming with per-game accent override.

### Integration Points
- `/shared/theme.css` becomes the shared style entry point for all later tool pages.
- The spawn-timer stub at `/games/where-winds-meet/tools/spawn-timer/index.html` is the integration seam for Phase 2 (Timer Core replaces its body).

</code_context>

<specifics>
## Specific Ideas

- WWM accent hex locked: jade `#3fb98f`, gold `#d4af37`.
- Breadcrumb example string: `Game Tools Hub / Where Winds Meet / Spawn Timer`.
- Card layout (visual intent): cover-art panel on top, game name, then a small "N tools" line.
- "Looks right with one card" is an explicit acceptance feel for the hub grid — the single WWM card must not look broken/lonely.

</specifics>

<deferred>
## Deferred Ideas

- Status badges ("new"/"beta") on cards — already tracked as HUB-V2-01 (v2).
- Client-side search/filter across tools — HUB-V2-02 (v2), relevant once 6+ tools exist.
- Real WWM cover artwork (replacing the placeholder SVG) — optional follow-up; not a Phase 1 blocker.
- A second real game — architecture must support it (HUB-05) but v1 ships one game end-to-end.

None of these are in Phase 1 scope; discussion stayed within the foundation/shell boundary.

</deferred>

---

*Phase: 1-Site Foundation + Hub Shell*
*Context gathered: 2026-06-04*
