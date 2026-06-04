---
phase: 02-timer-core
reviewed: 2026-06-04T15:03:10Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - games/where-winds-meet/tools/spawn-timer/spawn-timer.js
  - games/where-winds-meet/tools/spawn-timer/timer.worker.js
  - games/where-winds-meet/tools/spawn-timer/index.html
  - games/where-winds-meet/tools/spawn-timer/timer.css
  - games/where-winds-meet/tools/spawn-timer/duration.test.js
  - games/where-winds-meet/tools/spawn-timer/cycles.test.js
  - package.json
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: fixed
remediation:
  fixed: [CR-01, CR-02, WR-01, WR-02, WR-03, WR-04]
  fixed_at: "2026-06-04"
  deferred: [IN-01, IN-02]
  deferred_reason: "Info-level, out of --fix scope; IN-01 not reachable for static single-page deploy, IN-02 is a UX nicety"
  commits: [8d29578, 8ffed5e, 42e4f51, b314787, 7f6c9c0, cae472b]
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-04T15:03:10Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the complete phase-02 timer-core implementation: state machine, Web Worker tick delivery, AudioContext beep, localStorage persistence, multi-cycle engine, pause/resume, reset, reload restore, and background catch-up. The overall architecture is sound and the principal patterns (deadline-anchored timing via `Date.now()`, fresh `OscillatorNode` per beep, Worker-owned interval, schemaVersion-gated storage restore) are correctly implemented.

Two blockers found. The more serious one is a stored-value type-confusion bug in `restoreFromStorage()` that can leave the timer in a permanently broken display state when localStorage holds a non-numeric `cycleEnd`. The second is an `innerHTML` injection in the breadcrumb script that violates the threat model's explicit T-02-01 mitigation requirement; while the values are currently static literals, the pattern is wrong.

Four warnings cover: a focus-ring suppression that removes keyboard accessibility on inputs, a missing check for the state-machine invariant violated during the `'finished'` reload restore path, an error-message style that is visually indistinguishable from helper text, and an unused function reference left from a refactor.

---

## Critical Issues

### CR-01: `restoreFromStorage` assigns unvalidated `cycleEnd` from localStorage — broken display on tampered/corrupt storage

**File:** `games/where-winds-meet/tools/spawn-timer/spawn-timer.js:421-425`

**Issue:** `loadTimerState()` only validates that `schemaVersion === SCHEMA_VERSION`. It does not validate field types. The subsequent restore block assigns `state.cycleEnd = saved.cycleEnd || Date.now()` (line 425). If `saved.cycleEnd` is a non-numeric string (e.g. `"abc"`, or any value that is truthy-but-not-a-number), the `|| Date.now()` fallback is skipped and the string is stored in `state.cycleEnd`. Every subsequent `state.cycleEnd - Date.now()` produces `NaN`. `NaN <= 0` is `false`, so `handleCycleEnd()` is never called and the timer ticks forever. `updateDisplay(NaN)` → `formatRemaining(NaN)` → `Math.ceil(NaN/1000)` = `NaN` → `"NaN".padStart(2, '0')` = `"NaN"` → the display shows `"NaN:NaN"` for the life of the page.

This is reachable by T-02-04 (hand-edited localStorage) and by T-02-07 (hand-edited `cycleEnd`). The threat model specifically calls these out as mitigation targets. The schema version check is insufficient by itself.

The same unvalidated-assign pattern applies to `state.durationMs` (line 421) and `state.cycleIndex` (line 422). A string `durationMs` passed to `missedCycles()` produces `NaN`, bypassing the `durationMs <= 0` guard (since `NaN <= 0` is `false`) and causing `Math.floor(NaN)` = `NaN` cycles to advance — effectively `NaN` added to `cycleIndex`, corrupting the counter.

**Fix:** Add numeric validation after JSON parse in `loadTimerState()`, or validate at the assignment site in `restoreFromStorage()`:

```javascript
function isValidSavedState(data) {
  return (
    typeof data.cycleEnd   === 'number' && isFinite(data.cycleEnd)  && data.cycleEnd > 0 &&
    typeof data.durationMs === 'number' && isFinite(data.durationMs) && data.durationMs > 0 &&
    typeof data.cycleIndex === 'number' && Number.isInteger(data.cycleIndex) && data.cycleIndex >= 0 &&
    typeof data.totalCycles === 'number' && Number.isInteger(data.totalCycles) && data.totalCycles >= 1 &&
    typeof data.unlimited  === 'boolean'
  );
}

function loadTimerState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.schemaVersion !== SCHEMA_VERSION) return null;
    if (!['running', 'paused', 'finished', 'idle'].includes(data.phase)) return null;
    if (data.phase !== 'idle' && !isValidSavedState(data)) return null;
    return data;
  } catch (e) {
    return null;
  }
}
```

This ensures any malformed or attacker-controlled record falls through to a clean idle start, satisfying T-02-04 and T-02-07.

---

### CR-02: `renderBreadcrumb` in `index.html` uses `innerHTML` with interpolated values — violates T-02-01

**File:** `games/where-winds-meet/tools/spawn-timer/index.html:92-99`

**Issue:** The inline `<script>` block builds HTML via template literals and writes it with `.innerHTML` (line 99). The `item.href` and `item.label` values are interpolated directly into the HTML string:

```javascript
return `<li><a href="${item.href}">${item.label}</a></li>`;
// and:
document.getElementById(containerId).innerHTML = `<ol>${listItems}</ol>`;
```

The threat model (T-02-01) explicitly requires: *"Write all computed/parsed/announced values with `textContent` only; never `innerHTML`."* The plan acceptance criteria assert *"no `innerHTML` assignment of computed/parsed values anywhere in spawn-timer.js"* — and the same principle applies to all scripts on this page.

Although `breadcrumbItems` is currently a static developer-defined array, the pattern is architecturally wrong. Future edits adding dynamic data (e.g. pulling the game name from a data attribute) would silently inherit an XSS sink. Additionally, the `<nav>` already contains a correctly rendered static breadcrumb in the HTML (lines 16-22) that serves as the server-side default; the script then redundantly replaces it with a dynamically generated equivalent using the unsafe pattern.

**Fix:** Remove the `renderBreadcrumb` function entirely and delete the `DOMContentLoaded` script that calls it. The static breadcrumb already in the HTML (lines 16-22) is correct and requires no JavaScript. If a dynamic breadcrumb renderer is genuinely needed, use `textContent` and `createElement` + `appendChild`:

```javascript
// Safe DOM construction — no innerHTML
function renderBreadcrumb(items, containerId) {
  const nav = document.getElementById(containerId);
  const ol = document.createElement('ol');
  items.forEach((item, i) => {
    const li = document.createElement('li');
    if (item.href !== null) {
      const a = document.createElement('a');
      a.href = item.href;         // href is URL-safe (developer-controlled)
      a.textContent = item.label; // label via textContent
      li.appendChild(a);
    } else {
      const span = document.createElement('span');
      span.setAttribute('aria-current', 'page');
      span.textContent = item.label;
      li.appendChild(span);
    }
    ol.appendChild(li);
  });
  nav.replaceChildren(ol);
}
```

The simplest fix is to delete the script block and keep only the static HTML breadcrumb.

---

## Warnings

### WR-01: `.timer__input:focus { outline: none }` removes keyboard focus indicator

**File:** `games/where-winds-meet/tools/spawn-timer/timer.css:171-172`

**Issue:**

```css
.timer__input:focus { border-color: var(--color-accent); outline: none; }
```

The `outline: none` removes the browser's native focus ring for `:focus`, which fires for both mouse clicks and keyboard Tab navigation. `theme.css` provides a `:focus-visible` ring (`outline: 2px solid var(--color-accent); outline-offset: 2px`) but `:focus-visible` applies only to keyboard navigation, and this `:focus` rule (higher specificity for `.timer__input`) overrides it with `outline: none`. The net result: keyboard users navigating to the Duration or Repeat inputs with Tab see only a border-color change, losing the accessible `outline-offset` ring from `theme.css`. The plan requirement (02-01-PLAN.md) explicitly states *"do NOT redefine `:focus-visible` ring"*; this rule breaks that guarantee by suppressing the ring via `:focus`.

**Fix:** Replace the `:focus` rule with `:focus-visible` so mouse clicks are unaffected and keyboard focus retains the global ring from `theme.css`:

```css
/* Remove outline only for pointer-initiated focus — keyboard focus inherits theme.css ring */
.timer__input:focus:not(:focus-visible) { outline: none; }
.timer__input:focus-visible { border-color: var(--color-accent); }
/* Or simply: */
.timer__input:focus { border-color: var(--color-accent); }
/* and remove outline: none entirely — the theme.css :focus-visible rule handles the ring */
```

The minimal fix is to delete `outline: none` from this rule.

---

### WR-02: `restoreFromStorage` does not lock config inputs on `'finished'` reload path — re-entrant state mismatch

**File:** `games/where-winds-meet/tools/spawn-timer/spawn-timer.js:439-449`

**Issue:** When the restored `saved.phase === 'finished'`, the restore block calls `unlockConfigInputs()` (line 447) and `setTimerState('finished')` (line 448). This matches the finished-state contract. However, `state.cycleEnd` is never set in the finished path — it remains `null` (the module default, line 155). If the user clicks the Start button immediately after the restored finished state, `btnStart` fires, validation succeeds, and the Start handler sets a new `state.cycleEnd`. This is correct behaviour.

The actual bug: in the finished restore path the `cycleEnd` is left as `null`, but `state.durationMs` and `state.cycleIndex` are restored from the saved record. If any code path reads `state.cycleEnd` while in the finished state (e.g. a stale Worker message arriving after the restore), it would compute `null - Date.now()` = `NaN`, calling `handleCycleEnd()` unconditionally (since `NaN <= 0` is false — but see CR-01). More concretely: if the user hard-refreshes while the timer is in `finished` state, the restore sets `data-state="finished"` but the Worker was never running (not started), so no ticks will arrive. The null `cycleEnd` is safe in practice. However, for defensive correctness, set `state.cycleEnd = null` explicitly and add a `stopWorker()` call at the top of `restoreFromStorage()` to ensure no stale worker from a previous state could fire.

The more practical sub-bug: the finished-restore path does not show `inputDuration.value` populated with the previous duration, so the display restores to `00:00` but the Duration input is blank. The user has no visual cue what duration was used. This is a UX regression from the running-restore path which also shows the countdown value.

**Fix:**

```javascript
} else if (saved.phase === 'finished') {
  state.durationMs  = saved.durationMs  || 0;
  state.cycleIndex  = saved.cycleIndex  || 0;
  state.totalCycles = saved.totalCycles || 1;
  state.unlimited   = !!saved.unlimited;
  state.cycleEnd    = null;  // explicit — no active deadline in finished state
  // Restore duration input so user sees what the previous config was
  if (state.durationMs > 0) {
    inputDuration.value = formatRemaining(state.durationMs);
  }
  timerDisplay.textContent = '00:00';
  updateCycleCounter();
  unlockConfigInputs();
  setTimerState('finished');
}
```

---

### WR-03: `handleCycleEnd` in the non-last-cycle path does not reset the display before the next cycle ticks begin

**File:** `games/where-winds-meet/tools/spawn-timer/spawn-timer.js:335-341`

**Issue:** In the non-final-cycle branch of `handleCycleEnd()`:

```javascript
state.cycleIndex++;
state.cycleEnd = Date.now() + state.durationMs;
saveTimerState({ ...state, phase: 'running' });
updateCycleCounter();
// (no updateDisplay call here)
```

The display is not reset at the cycle boundary. The next Worker tick arrives within 0–100ms and calls `updateDisplay(remaining)`, which shows the new remaining time. In practice the gap is imperceptible. But there is a window (up to 100ms) where the display still shows `00:00` (or slightly negative value from the final tick) before the Worker tick resets it. More importantly, `announceToScreenReader('Cycle N complete')` fires at the start of `handleCycleEnd()` before the cycle advances, which is correct. However, the display after the beep momentarily shows the prior "00:01" or "00:00" value, then jumps to the new cycle's full duration on the next tick — this could look like a glitch. An explicit `updateDisplay(state.durationMs)` immediately after `state.cycleEnd = Date.now() + state.durationMs` would make the transition crisp.

**Fix:**

```javascript
} else {
  state.cycleIndex++;
  state.cycleEnd = Date.now() + state.durationMs;
  saveTimerState({ ...state, phase: 'running' });
  updateCycleCounter();
  updateDisplay(state.durationMs); // reset display immediately at new cycle start
}
```

---

### WR-04: `.timer__error` styled identically to `.timer__helper` — validation errors invisible to sighted users

**File:** `games/where-winds-meet/tools/spawn-timer/timer.css:136-143`

**Issue:** The error span:

```css
.timer__error {
  display: block;
  font-size: var(--text-label);
  color: var(--color-text-secondary);   /* ← same color as .timer__helper */
  min-height: 1.4em;
  margin-top: var(--space-xs);
}
```

Uses exactly the same `color: var(--color-text-secondary)` as `.timer__helper` (line 129–135). When an error message appears (e.g. "Enter a duration to start."), it is visually indistinguishable from the "MM:SS or seconds" helper text above it — same size, same color, same weight. Users who are not looking closely may miss the error entirely and be confused why Start does not work. The `role="alert"` attribute on the span handles screen readers, but the visual contract is broken.

**Fix:** Give `.timer__error` a distinct color. Using the existing token system there is no dedicated error color token yet, so either add one to `theme.css` or use a concrete value for now:

```css
.timer__error {
  display: block;
  font-size: var(--text-label);
  color: #e05c5c;   /* or add --color-error to theme.css tokens */
  min-height: 1.4em;
  margin-top: var(--space-xs);
}
```

---

## Info

### IN-01: `stopWorker()` sends a stop message but never terminates the Worker — Worker reference held forever

**File:** `games/where-winds-meet/tools/spawn-timer/spawn-timer.js:273-277`

**Issue:**

```javascript
function stopWorker() {
  if (worker) {
    worker.postMessage({ cmd: 'stop' });
  }
}
```

`stopWorker()` pauses the Worker's interval but the Worker thread itself remains alive and the `worker` reference is never nulled or terminated. The Worker is reused across cycles and resets (intentional design: `startWorker()` sends a new `{ cmd: 'start' }` to the existing worker). This is correct for normal operation. However, if the page navigates away from the timer tool (within a SPA or iframe), the Worker is not explicitly terminated. For the current deployment (single-page static file, full page unload on navigation), this is not a practical problem — the browser reclaims all worker threads on page unload.

**Note for future phases:** If this page is ever embedded or if soft-navigation is added, add `worker.terminate()` on route teardown and set `worker = null`.

---

### IN-02: `parseDuration` accepts up to `999:59` (≈16.6 hours) — no upper-bound guard

**File:** `games/where-winds-meet/tools/spawn-timer/spawn-timer.js:28-29`

**Issue:** The MM:SS regex `/^(\d{1,3}):(\d{2})$/` allows up to 3 digits in the minutes field (up to `999:59` = 59,999,000ms ≈ 16.6 hours). For a GvG jungle spawn timer, a duration of several hours is nonsensical and may indicate a typo or user confusion. There is no product requirement for an upper bound, but accepting absurdly large values silently is a usability hazard.

The raw-seconds path has the same issue: `"999999"` → 999,999,000ms ≈ 11.5 days.

**Note:** This is not a security issue (the value is a number; it does not reach the DOM as raw input). It is a UX concern.

**Fix (optional):** Add an upper-bound check in `parseDuration` — e.g. reject values above 3,600,000ms (60 minutes), which is generous for any GvG spawn cycle:

```javascript
const total = mins * 60 + secs;
if (total <= 0 || total > 3600) return null; // max 60:00
return total * 1000;
```

---

_Reviewed: 2026-06-04T15:03:10Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
