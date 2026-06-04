---
phase: 02-timer-core
plan: 01
subsystem: ui
tags: [vanilla-js, es-modules, web-worker, web-audio, performance-now, node-test, tailwind]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Game hub shell, shared theme tokens, where-winds-meet game page and tool slot
provides:
  - Single-cycle spawn-timer slice (duration input → Start → glanceable countdown → beep + jade flash at zero)
  - Web Worker tick source (background-tab-accurate interval)
  - Deadline-anchored drift correction using performance.now()
  - Gesture-unlocked AudioContext with fresh-OscillatorNode-per-beep
  - parseDuration + formatRemaining pure functions with node:test coverage
  - Module seams for plan 02-02 (stub pause/resume listeners, single-cycle handleCycleEnd, saveTimerState deadline shape)
affects: [02-02, timer-core, spawn-timer]

# Tech tracking
tech-stack:
  added: [node:test (built-in), package.json with type=module]
  patterns:
    - "Worker owns the tick; main thread owns deadline math and render"
    - "Fresh OscillatorNode per beep (never reuse a stopped node)"
    - "textContent-only DOM writes for all computed/parsed values (no innerHTML)"
    - "Pure functions exported for node:test; DOM/Worker/Audio wiring guarded behind runtime entry"

key-files:
  created:
    - games/where-winds-meet/tools/spawn-timer/index.html
    - games/where-winds-meet/tools/spawn-timer/timer.css
    - games/where-winds-meet/tools/spawn-timer/spawn-timer.js
    - games/where-winds-meet/tools/spawn-timer/timer.worker.js
    - games/where-winds-meet/tools/spawn-timer/duration.test.js
    - package.json
  modified: []

key-decisions:
  - "Web Worker drives the tick interval so background-tab throttling does not slow the countdown; main thread recomputes remaining from a fixed deadline via performance.now()"
  - "A fresh OscillatorNode is created for every beep — reusing a stopped node is the classic cause of a silent second run"
  - "All computed/parsed/announced values are written with textContent only (never innerHTML) to close the XSS surface (T-02-01)"
  - "Added root package.json with type=module so node --test can import the ES module test file; not served as a static asset"

patterns-established:
  - "Worker-owns-tick / main-owns-math: timer.worker.js posts {type:'tick'}; spawn-timer.js derives remaining from deadline"
  - "Pure-function + runtime-guard split: parseDuration/formatRemaining are importable for tests; side-effecting wiring runs only in the browser entry"
  - "Deferred-cycle seam: handleCycleEnd uses totalCycles=1 and saveTimerState writes the deadline shape plan 02-02 reads on reload"

requirements-completed: [TIMER-01, TIMER-05, TIMER-08, ALERT-01, ALERT-02, THEME-05]

# Metrics
duration: ~5min
completed: 2026-06-04
---

# Phase 2: Timer Core — Plan 01 Summary

**Single-cycle spawn timer: duration input → Worker-driven glanceable countdown → fresh-oscillator beep + jade flash at zero, with drift correction via performance.now() and node:test-covered parsing.**

## Performance

- **Duration:** ~5 min (executor wall-clock)
- **Tasks:** 3 auto tasks executed (4th task is a blocking human-verify checkpoint — deferred)
- **Files created:** 6

## Accomplishments
- End-to-end single-cycle countdown: enter `MM:SS`/seconds, Start, watch a large glanceable countdown tick to zero, hear a single ~880Hz beep, see a brief jade flash, reach finished state.
- Web Worker tick source keeps time accurate when the tab is backgrounded; remaining is recomputed from a fixed deadline (no accumulated drift).
- Gesture-unlocked AudioContext with a fresh OscillatorNode per beep (second run beeps correctly).
- Inline validation: empty/invalid duration blocks Start with exact inline copy.
- 26/26 node:test cases green for parseDuration + formatRemaining.

## Task Commits

1. **Task 1: Extract parseDuration + formatRemaining with node:test coverage** — `8c3ce11` (feat)
2. **Task 2: Fill in timer markup and component CSS** — `4c2fb32` (feat)
3. **Task 3: Wire single-cycle engine — Worker ticks, gesture-unlocked beep, countdown** — `f99e3d0` (feat)

_Task 4 (checkpoint:human-verify, blocking) is the manual browser checklist — see Issues Encountered._

## Files Created/Modified
- `games/where-winds-meet/tools/spawn-timer/index.html` — Timer markup: `.timer` root with `data-state`, display, config inputs, controls, sr-only announcer
- `games/where-winds-meet/tools/spawn-timer/timer.css` — Component styles on shared theme tokens; `clamp(56px,22vw,112px)` countdown sizing; jade flash keyframe
- `games/where-winds-meet/tools/spawn-timer/spawn-timer.js` — State machine, Worker wiring, AudioContext gesture unlock, fresh-oscillator beep, duration parsing, display render
- `games/where-winds-meet/tools/spawn-timer/timer.worker.js` — `setInterval` tick source posting `{ type: 'tick' }`
- `games/where-winds-meet/tools/spawn-timer/duration.test.js` — node:test coverage of parseDuration + formatRemaining
- `package.json` — Root `type: module` so `node --test` loads the ESM test file

## Decisions Made
- Worker owns the tick; main thread owns deadline math and render — survives background throttling.
- Fresh OscillatorNode per beep — avoids the silent-second-run bug.
- `textContent`-only writes for all computed values — closes the XSS surface (T-02-01, T-02-02).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added root package.json with `type: module`**
- **Found during:** Task 1 (pure-function extraction + node:test)
- **Issue:** Repo had no package.json, so `node --test` could not load the ES module test file.
- **Fix:** Added minimal `package.json` (`"type": "module"`, `"engines": {"node": ">=20"}`) at repo root.
- **Files modified:** package.json
- **Verification:** `node --test duration.test.js` runs and passes 26/26. File is not served as a static asset; no GitHub Pages impact.
- **Committed in:** Task 1 commit chain

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for the test harness to run. No scope creep; no third-party packages added.

## Issues Encountered
**Manual-verification checkpoint deferred.** Task 4 is a blocking `human-verify` gate (browser checklist: beep/flash, second-run beep, inline validation, 2-min background accuracy, responsive layout). At the user's direction the browser test was deferred to be performed alongside plan 02-02's checklist at the end of the phase. Implementation is complete and unit-tested; manual sign-off is pending.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Ready for plan 02-02 to layer on: repeat/unlimited + cycle counter, pause/resume with exact deadline preservation, reset, full visual state model, hard-refresh restore, and background-tab cycle catch-up.
- Seams in place: stub pause/resume listeners, `handleCycleEnd` single-cycle path (`totalCycles=1`), and `saveTimerState` deadline shape for reload restore.
- **Open item:** manual browser checklist for 02-01 still to be run (deferred to phase end).

---
*Phase: 02-timer-core*
*Completed: 2026-06-04*
