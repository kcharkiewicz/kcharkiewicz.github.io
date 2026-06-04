---
phase: 02
slug: timer-core
status: approved
nyquist_compliant: false
nyquist_gate: disabled
wave_0_complete: true
created: 2026-06-04
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

> **Nyquist gate intentionally disabled for this phase** (`workflow.nyquist_validation: false`).
> The timer's core behaviors — countdown rendering, Web Audio beep, Web Worker
> background-tab accuracy, `visibilitychange` recovery, localStorage reload restore — are
> browser-API behaviors that `node:test` cannot exercise without a headless-browser
> toolchain. Adding Playwright/Puppeteer would violate the project's locked constraints
> (no build step, keep dependencies light — see CLAUDE.md). Strategy: the genuinely **pure**
> logic is extracted into exported functions and covered by zero-dependency `node:test`;
> all browser-side behavior is verified by the **blocking** `checkpoint:human-verify` task at
> the end of each plan, with the explicit manual map below.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` + `node:assert/strict` (Node 20 built-in — zero dependencies, no install) |
| **Config file** | none — Node's built-in runner; test files are co-located `*.test.js` ES modules |
| **Quick run command** | `node --test games/where-winds-meet/tools/spawn-timer/duration.test.js` |
| **Full suite command** | `node --test games/where-winds-meet/tools/spawn-timer/*.test.js` |
| **Estimated runtime** | ~1 second (pure-function assertions only) |

---

## Sampling Rate

- **After every task commit:** Run the relevant plan's `node --test` file (duration.test.js for plan 01, cycles.test.js for plan 02).
- **After every plan wave:** Run the full suite (`node --test .../*.test.js`).
- **Before `/gsd:verify-work`:** Full `node:test` suite green AND both blocking human-verify checkpoints approved.
- **Max feedback latency:** ~1 second (automated); manual checkpoints run at end of each plan.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | TIMER-01 | T-02-02 | parseDuration rejects malformed input (null) → Start blocked | unit | `node --test games/where-winds-meet/tools/spawn-timer/duration.test.js` | ✅ created by task | ⬜ pending |
| 02-01-02 | 01 | 1 | TIMER-05, THEME-05 | T-02-01 | textContent-only DOM writes; no innerHTML | manual | n/a (CSS render / contrast — browser) | n/a | ⬜ pending |
| 02-01-03 | 01 | 1 | TIMER-08, ALERT-01, ALERT-02 | T-02-01 | fresh OscillatorNode per beep; textContent display writes | manual | n/a (Web Worker + Web Audio — browser) | n/a | ⬜ pending |
| 02-02-01 | 02 | 2 | TIMER-02, TIMER-06 | T-02-02 | parseRepeat validates repeat count; cycleLabel pure | unit | `node --test games/where-winds-meet/tools/spawn-timer/cycles.test.js` | ✅ created by task | ⬜ pending |
| 02-02-02 | 02 | 2 | TIMER-02, TIMER-03, TIMER-06, TIMER-07 | T-02-01 | state via dataset.state only; textContent counter writes | manual | n/a (pause/resume/reset state model — browser) | n/a | ⬜ pending |
| 02-02-03 | 02 | 2 | TIMER-04 | T-02-04 | defensive try/catch + schemaVersion on localStorage read; no raw stored string to DOM | manual | n/a (reload restore + background catch-up — browser) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*None — `node:test` is built into Node 20 (no framework install). Test files are created
inline by Task 1 of each plan (`duration.test.js`, `cycles.test.js`). Existing toolchain
(Node 20, already confirmed live in Phase 1) covers all automatable requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Glanceable real-time countdown render | TIMER-05, THEME-05 | CSS sizing/contrast + DOM rendering — needs a real browser viewport | Serve statically; at 375px & 1280px the countdown reads large, tabular, high-contrast, no digit jitter, no horizontal scroll. |
| Beep at end of every cycle incl. first + on a repeat run | ALERT-01, ALERT-02 | Web Audio API + autoplay gesture policy — no headless audio without a browser | Run 0:05; confirm beep at zero; run again (no refresh) — confirms fresh oscillator (classic "silent second run" bug). |
| Background-tab timing accuracy (2+ min) | TIMER-08 | Web Worker throttling behavior only manifests in a real backgrounded tab | Start 3:00, switch tabs 2+ min, return — remaining accurate within ~1s of wall clock. |
| Pause/resume with exact time preservation; reset; full state model | TIMER-02, TIMER-03, TIMER-06, TIMER-07 | Interactive state transitions + visual state — browser-only | Repeat 3 run: counter 1/3→3/3 with beep each; pause freezes, resume continues with no lost time; reset returns to editable idle; Unlimited → "Cycle X / ∞"; states distinguishable without relying on color alone. |
| Hard-refresh restore + corrupt-storage safety + background cycle catch-up | TIMER-04 | localStorage persistence across reload + visibilitychange — browser-only | Refresh mid-cycle → restores remaining + "Resume" CTA (no auto-run); set key to `not-json` + reload → loads cleanly in idle; background 2 min → counter advances to correct cycle, exactly 1 beep on return. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify OR a justified manual-only entry (browser-API behavior)
- [x] Sampling continuity: each plan opens with an automated pure-function task; browser behavior gated by a blocking human-verify checkpoint
- [x] Wave 0 covers all MISSING references (none — node:test built-in)
- [x] No watch-mode flags (`node --test` runs once and exits)
- [x] Feedback latency < 2s (automated suite ~1s)
- [x] Nyquist gate disabled with documented rationale (browser-API phase; no headless-browser toolchain per CLAUDE.md constraints)

**Approval:** approved 2026-06-04 (manual-verification contract; Nyquist gate intentionally off)
