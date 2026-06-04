---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-06-04T10:45:19.720Z"
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State: kcharkiewicz.github.io — Game Tools Hub

**Initialized:** 2026-06-04
**Last updated:** 2026-06-04

---

## Project Reference

**Core value:** A dependable GvG jungle spawn timer that works reliably in the browser during real gameplay — the first tool in a personal static game-tools hub.

**Milestone:** v1
**Total phases:** 5
**Current focus:** Phase 1 — Site Foundation + Hub Shell

---

## Current Position

**Active phase:** 1 — Site Foundation + Hub Shell
**Active plan:** None (planning not yet started)
**Phase status:** Not started
**Milestone status:** Not started

**Progress:**

```
Phase 1 [          ] 0%   Not started
Phase 2 [          ] 0%   Not started
Phase 3 [          ] 0%   Not started
Phase 4 [          ] 0%   Not started
Phase 5 [          ] 0%   Not started
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases complete | 0 / 5 |
| Requirements mapped | 28 / 28 |
| Requirements complete | 0 / 28 |
| Plans created | 0 |
| Plans complete | 0 |

---

## Key Decisions Logged

| Decision | Phase | Rationale |
|----------|-------|-----------|
| No build step for v1 | 1 | Light dependencies; plain HTML/CSS/JS; build toolchain is a net liability at this scale |
| Wall-clock anchored timing (Date.now() delta, not tick counting) | 2 | Prevents cumulative drift that causes late alerts in a GvG spawn timer |
| Web Worker for setInterval | 2 | Chrome 88+ throttles hidden-tab intervals to ~1/min; timer is explicitly a second-screen tool |
| Fresh OscillatorNode per beep | 2 | Single-use Web Audio API; reusing a stopped node silences all cycles after the first |
| AudioContext unlocked inside Start-button click handler | 2 | Autoplay policy: context starts suspended; must resume inside a user gesture |
| Namespaced localStorage (gametools.game.tool.key) + try/catch + schema version | 3 | Prevents key collisions; defensive against Safari private mode QuotaExceededError |
| .nojekyll in repo root as first commit | 1 | Jekyll silently drops underscore-prefixed files; must be in place before any asset structure |
| All-lowercase filenames enforced from first commit | 1 | GitHub Pages runs on Linux (case-sensitive); mismatches that work locally cause 404s in production |
| Root-absolute asset paths (/shared/theme.css) | 1 | This is a user/org site at the domain apex; root-absolute paths are safe and consistent at any nesting depth |

---

## Accumulated Context

### Pitfall Watch (Non-Negotiables)

- Timer drift: NEVER count ticks; always compute `remaining = cycleEnd - Date.now()`
- Background throttling: Web Worker owns the setInterval; main thread renders on message receipt
- Audio autoplay: Create or resume AudioContext inside the Start button click handler
- Audio node reuse: Create a new OscillatorNode inside playBeep() every time — never at module level
- localStorage: Wrap ALL calls in try/catch; treat persistence as best-effort; include schemaVersion in stored objects
- Jekyll: .nojekyll committed as the very first file; no underscore-prefixed folders
- Case sensitivity: All filenames all-lowercase; `git config core.ignorecase false`

### Architecture Conventions

- Directory layout: `/index.html`, `/games/where-winds-meet/index.html`, `/games/where-winds-meet/tools/spawn-timer/index.html`
- Shared files: `/shared/theme.css`, `/shared/storage.js`, `/shared/audio.js`
- Hub/game pages use inline JS registry arrays + card renderer (no fetch, no build step)
- Tool pages: three co-located files (index.html, spawn-timer.css, spawn-timer.js + timer.worker.js)
- localStorage key schema: `gametools.<game-slug>.<tool-slug>.<data-key>`

### Blockers

(None — roadmap created, ready to plan Phase 1)

### Todos

- [ ] Run `/gsd:plan-phase 1` to plan Site Foundation + Hub Shell

---

## Session Continuity

**Last session:** 2026-06-04T10:45:19.714Z
**Next action:** Plan Phase 1 (`/gsd:plan-phase 1`)

---

*State initialized: 2026-06-04*
