# Phase 1: Site Foundation + Hub Shell - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-04
**Phase:** 1-Site Foundation + Hub Shell
**Areas discussed:** Theme vibe & accent, Hub composition, Navigation pattern, Unbuilt-tool handling

---

## Theme vibe & accent

### Q1 — What dark aesthetic should the hub wear?

| Option | Description | Selected |
|--------|-------------|----------|
| Wuxia ink & jade | Ink background, jade/teal + gold accents, brush-stroke feel; atmospheric, on-theme | ✓ |
| Sleek minimal dark | Neutral near-black + one accent, game-agnostic | |
| Neon / cyber gamer | Dark base + saturated neon accents and glow | |

**User's choice:** Wuxia ink & jade.

### Q2 — Wuxia as shared base, or just the WWM accent layer?

| Option | Description | Selected |
|--------|-------------|----------|
| Wuxia is the base | Whole hub wears ink & jade; future games tweak only accent | |
| Neutral base + WWM accent | Neutral dark base; WWM layers jade/gold; each future game its own accent | ✓ |

**User's choice:** Neutral base + WWM accent.
**Notes:** Reconciles the wuxia feel with THEME-02 (per-game accent) and HUB-05 (extensibility). WWM accent locked: jade `#3fb98f`, gold `#d4af37`.

---

## Hub composition

### Q1 — First impression / amount of branding

| Option | Description | Selected |
|--------|-------------|----------|
| Compact header + cards | Small title in header, straight to game cards; tools-first | ✓ |
| Hero + tagline, then cards | Centered hero with name + tagline above cards | |

**User's choice:** Compact header + cards.

### Q2 — What goes on a game card?

| Option | Description | Selected |
|--------|-------------|----------|
| Art + name + tool count | Cover art, name, "N tools"; needs an image asset | ✓ |
| Name + short blurb | Name + one-line description, no image | |
| Name + count, minimal | Name + count on accent-tinted card | |

**User's choice:** Art + name + tool count.

### Q3 — How to handle the WWM cover image

| Option | Description | Selected |
|--------|-------------|----------|
| Styled placeholder now | Themed SVG placeholder, drop-in swappable later; unblocks Phase 1 | ✓ |
| I'll provide the image | Plan assumes a real asset exists | |
| Real image, I'll get it later | Placeholder + follow-up todo | |

**User's choice:** Styled placeholder now (drop-in `cover.svg`, swap later with no code change).

---

## Navigation pattern

### Q1 — Wayfinding style for hub → game → tool

| Option | Description | Selected |
|--------|-------------|----------|
| Breadcrumb trail | Full clickable path; clear orientation, scales with depth | ✓ |
| Logo + back link | Logo home + "← Back to parent" | |
| Logo home + up arrow | Minimal chrome, logo + up-arrow | |

**User's choice:** Breadcrumb trail.

### Q2 — Brand / breadcrumb root name

| Option | Description | Selected |
|--------|-------------|----------|
| Game Tools Hub | Matches project name; descriptive | ✓ |
| GameTools | Shorter wordmark | |
| Home icon only | Icon root, saves space | |

**User's choice:** "Game Tools Hub".

---

## Unbuilt-tool handling

### Q1 — How the WWM page presents the spawn timer before it's built

| Option | Description | Selected |
|--------|-------------|----------|
| Stub page at real URL | Tool card links to a real placeholder page at the canonical URL; no 404, bookmarkable, proves full hierarchy; Phase 2 swaps the body | ✓ |
| Coming-soon card, no link | Disabled card with badge; 3rd level unproven until Phase 2 | |
| Hide until built | Empty "tools coming soon" state, no card | |

**User's choice:** Stub page at real URL.
**Notes:** Directly satisfies success criterion 3 (no 404s) and HUB-04 (bookmarkable tool URL), and validates the breadcrumb at all three levels in Phase 1.

---

## Claude's Discretion

- Exact neutral base palette token values (must meet WCAG AA).
- Typography, card grid columns / breakpoints, hover states, footer.
- Favicon concept/artwork (SVG, theme-echoing — wind/jade motif or hub mark).
- Placeholder/stub page copy.

## Deferred Ideas

- Status badges on cards (HUB-V2-01, v2).
- Client-side tool search/filter (HUB-V2-02, v2).
- Real WWM cover artwork replacing the placeholder SVG (optional follow-up).
- A second real game (architecture supports it; v1 ships one game).
