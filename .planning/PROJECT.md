# kcharkiewicz.github.io — Game Tools Hub

## What This Is

A personal, statically-hosted (GitHub Pages) hub of companion tools for video games. A landing page lists the games supported; each game has its own page collecting the tools for it. It starts with a single game — *Where Winds Meet* — and a single tool, and is built to grow game-by-game and tool-by-tool over time.

## Core Value

The hosted tools must work reliably in the browser during real gameplay — the first one being a dependable GvG jungle spawn timer. If the rest of the site is bare, a tool that actually helps mid-match is the thing that matters.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Hub landing page that lists supported games and links to each game's page
- [ ] A *Where Winds Meet* game page that collects its tools
- [ ] GvG Jungle Spawn Timer: user sets a duration and a repeat count, clicks start, it counts down and repeats up to N cycles
- [ ] Timer plays an audible alert at the end of each cycle (usable without looking at the screen)
- [ ] Saved, named timer presets persisted in the browser (e.g. "Camp A = 3:00")
- [ ] Gamer/themed visual style (dark, stylized) shared across the hub and game pages
- [ ] Site deploys to GitHub Pages and is reachable at kcharkiewicz.github.io
- [ ] Architecture makes adding a new game page and a new tool straightforward (no rework)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Accounts / user login — tools are personal and local; no identity needed
- Backend / server / database — static hosting only; all state lives in the browser
- Live multi-user / guild sync of timers — explicitly deferred; would force an external backend and is not needed for personal use
- Additional games beyond *Where Winds Meet* in v1 — the architecture supports them, but v1 ships one game end-to-end
- Visual flash / browser-notification alerts in v1 — sound is the chosen alert; others can be added later

## Context

- Target host is GitHub Pages at the user repository `kcharkiewicz.github.io`, so the site is served as static files (HTML/CSS/JS) with no server-side runtime.
- The first tool targets *Where Winds Meet* GvG (Guild vs Guild), where the user wants to track jungle spawns by running a repeating countdown they configure themselves (duration + number of repeats), rather than syncing to in-game state.
- Tools are used live during play, often as a second screen, so attention-grabbing alerts (sound) and a fast, low-friction UI matter more than visual polish.
- The site is intended to accumulate more games and more tool types over time (calculators, generators, trackers/counters, reference/lookup), so structure and reuse matter from the start.

## Constraints

- **Tech stack**: Must run as static files on GitHub Pages — no backend, server-side code, or database.
- **Persistence**: Any saved state (presets) must use client-side storage (e.g. localStorage); no remote storage.
- **Dependencies**: Keep dependencies light — a personal site that should stay easy to maintain and deploy.
- **Extensibility**: Adding a new game page or a new tool should not require restructuring existing pages.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static GitHub Pages site, no backend | Personal tools, free hosting, simplest to maintain | — Pending |
| Hub → per-game pages structure | Scales cleanly as more games are added | — Pending |
| First tool: configurable repeating countdown timer (duration + repeat count) | Matches how the user wants to track GvG jungle spawns; no game integration required | — Pending |
| Sound as the v1 alert mechanism | Usable without watching the screen during play | — Pending |
| Presets stored in browser (localStorage) | No accounts/backend needed; persists for the single user | — Pending |
| Gamer/themed dark visual style | Fits the game-companion context | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-04 after initialization*
