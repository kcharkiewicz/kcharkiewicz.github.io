---
phase: 02-timer-core
plan: 02
subsystem: ui
tags: [vanilla-js, es-modules, web-worker, web-audio, localstorage, performance-now, node-test, state-machine]

# Dependency graph
requires:
  - phase: 02-timer-core
    provides: Single-cycle timer slice (Worker tick, deadline drift correction, gesture-unlocked beep, parsing) and the seams left by plan 02-01
provides:
  - Multi-cycle engine with repeat count + unlimited and a live cycle counter
  - Pause/resume with exact deadline preservation (no time lost)
  - Reset to editable idle
  - Full running/paused/finished visual state model (distinguishable by label + control set, not color alone)
  - Defensive hard-refresh restore (shows remaining + requires a Resume gesture to re-arm audio; no auto-run)
  - Corrupt-localStorage safety (try/catch + schemaVersion → clean idle)
  - Background-tab cycle catch-up with a single beep on return
  - Pure cycle/deadline helpers (cycleLabel, resumeDeadline, isLastCycle, missedCycles, parseRepeat) with node:test coverage
affects: [timer-core, spawn-timer, presets, future-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bounded background catch-up: missedCycles is capped by elapsed/duration; exactly one beep fires on return"
    - "Resume-gesture re-arm: restore shows remaining but requires a user gesture to re-create the AudioContext (autoplay-policy safe)"
    - "Restore anchors pausedAt to the restore moment so the Resume deadline shift preserves displayed remaining"

key-files:
  created:
    - games/where-winds-meet/tools/spawn-timer/cycles.test.js
  modified:
    - games/where-winds-meet/tools/spawn-timer/spawn-timer.js

key-decisions:
  - "updateCycleCounter() uses the exported cycleLabel() pure helper rather than an inline template literal — keeps cycle-label logic DRY and unit-tested"
  - "restoreFromStorage sets state.pausedAt = Date.now() on restore so the Resume deadline shift is computed from the restore moment, correctly preserving displayed remaining through the Resume gesture"
  - "Background catch-up calls playBeep() exactly once in the visibilitychange handler regardless of how many cycles elapsed (Pitfall 2 single-beep cap)"
  - "Hard-refresh restore never auto-runs — it shows remaining + a Resume CTA, satisfying both audio autoplay policy and the not-silent-broken requirement"

patterns-established:
  - "Pure-helper-driven UI: cycle labels and deadline math live in tested pure functions; the render layer only formats their output"
  - "Defensive storage read: JSON.parse in try/catch + schemaVersion check → null → clean idle (never renders raw stored strings to DOM)"
  - "Bounded catch-up math: no unbounded loop on hand-edited cycleEnd; cycleIndex clamped to the finite total"

requirements-completed: [TIMER-02, TIMER-03, TIMER-04, TIMER-06, TIMER-07]

# Metrics
duration: ~5min
completed: 2026-06-04
---

# Phase 2: Timer Core — Plan 02 Summary

**Full multi-cycle spawn timer: repeat/unlimited with live cycle counter, pause/resume with exact deadline preservation, reset, complete state model, defensive hard-refresh restore, corrupt-storage safety, and single-beep background catch-up.**

## Performance

- **Duration:** ~5 min (executor wall-clock)
- **Tasks:** 3 auto tasks executed (4th task is a blocking human-verify checkpoint — passed via live-deploy testing)
- **Files modified:** 1 created, 1 extended

## Accomplishments
- Multi-cycle engine: repeat count + unlimited, live "Cycle N / M" (and "/ ∞") counter, a beep each cycle, then Finished.
- Pause/resume with exact deadline preservation — display freezes on Pause, resumes from the frozen value with no time lost.
- Reset returns to editable idle with config inputs re-enabled.
- Full visual state model: running / paused / finished distinguishable by label + control set (not color alone).
- Defensive hard-refresh restore: shows correct remaining + preserved counter + a Resume CTA (no auto-run); corrupt/`not-json` localStorage loads cleanly without crashing.
- Background-tab cycle catch-up advances the counter to the correct cycle with exactly one beep on return.
- 29/29 new node:test cases green; full suite (with 02-01) 55/55.

## Task Commits

1. **Task 1: Pure cycle + deadline helpers with node:test coverage** — `680db7f` (feat)
2. **Task 2: Multi-cycle engine, pause/resume, reset, cycle counter, full state model** — `96b0eda` (feat)
3. **Task 3: Defensive reload restore + background-tab cycle catch-up** — `3d8d13e` (feat)

_Task 4 (checkpoint:human-verify, blocking) — manual browser checklist — passed via live-deploy testing (user approved 2026-06-04)._

## Files Created/Modified
- `games/where-winds-meet/tools/spawn-timer/cycles.test.js` — node:test coverage of cycleLabel, resumeDeadline, isLastCycle, missedCycles, parseRepeat
- `games/where-winds-meet/tools/spawn-timer/spawn-timer.js` — extended 318→629 lines: multi-cycle engine, pause/resume deadline math, reset, cycle counter, state model, restore + catch-up

## Decisions Made
- `updateCycleCounter()` uses the exported `cycleLabel()` pure helper (DRY, unit-tested).
- Restore sets `pausedAt = Date.now()` so the Resume deadline shift preserves displayed remaining.
- Single-beep cap on background catch-up; bounded missedCycles math (no runaway loop on hand-edited storage).

## Deviations from Plan
None — plan executed exactly as written.

Notes:
- `timer.css` was not modified (all state-visibility + config-dimming rules were already complete from 02-01).
- `index.html` was not modified (all required DOM IDs were already present from 02-01).

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Phase 2 success criteria fully satisfied: the timer is a dependable single/multi-cycle GvG spawn timer, accurate in background tabs, surviving reloads, with audible alerts.
- Ready for the next phase (e.g. presets / localStorage-backed saved timers) to build on the established state model and storage seam.

---
*Phase: 02-timer-core*
*Completed: 2026-06-04*
