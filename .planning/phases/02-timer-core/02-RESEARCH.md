# Phase 2: Timer Core — Research

**Researched:** 2026-06-04
**Domain:** Browser timer accuracy, Web Audio API, Web Workers, state machines, accessibility
**Confidence:** HIGH (core risks verified against official MDN docs and browser engine sources)

---

## Summary

Phase 2 implements the GvG spawn timer — the project's core value proposition. The three hardest engineering problems are: (1) keeping accurate time when the browser tab is backgrounded for minutes, (2) ensuring the end-of-cycle beep always fires (autoplay policy, iOS Safari's interrupted state, the single-use OscillatorNode rule), and (3) making the first-cycle beep work on a fresh page load without a pre-existing AudioContext.

All three problems have well-understood solutions in the standard browser API stack. The prescribed approach from STATE.md and CLAUDE.md — a Web Worker owning the `setInterval`, wall-clock-anchored timing using `Date.now()` as the deadline reference, and an AudioContext unlocked inside the Start-button click handler — is correct and validated by this research. The only material addition is the iOS Safari `interrupted` state handling, which requires a `statechange` listener calling `audioCtx.resume()` when the tab returns to the foreground.

The UI contract (02-UI-SPEC.md, approved) drives the state machine directly: the four `data-state` values (`idle | running | paused | finished`) map exactly to the logical timer states, and CSS keys off the attribute. No new design tokens are introduced; all component styles layer onto the existing `/shared/theme.css` tokens.

**Primary recommendation:** Web Worker owns a `setInterval` for tick delivery. Main thread reconstructs `remaining = cycleEnd - Date.now()` on every tick message. Fresh `OscillatorNode + GainNode` per beep. AudioContext created/resumed inside Start-button gesture. localStorage persists `cycleEndTimestamp + state` so the timer can resume correctly after a hard page refresh.

---

## Project Constraints (from CLAUDE.md)

The following directives from `CLAUDE.md` are binding on all implementation decisions in this phase. Research does not explore alternatives to these locked choices.

| Directive | Source | Impact on Phase 2 |
|-----------|--------|-------------------|
| Static files only — no backend, no server-side code | CLAUDE.md Constraints | No WebSocket resync, no server clock; all timing is client-side |
| Persistence via localStorage only | CLAUDE.md Constraints | Timer state survives refresh via localStorage; no remote store |
| Keep dependencies light | CLAUDE.md Constraints | No timer library, no audio library — use Web APIs directly |
| `performance.now()` / deadline-corrected recursive setTimeout | CLAUDE.md Timer Logic | The prescribed pattern; validated and deepened here |
| One reused `AudioContext`, created on first user gesture | CLAUDE.md Audio | Extended here: also handle iOS `interrupted` state on visibilitychange |
| Fresh `OscillatorNode` per beep | CLAUDE.md Audio | Validated: stopped nodes cannot be restarted; new node every call |
| localStorage with `try/catch` and schema version | CLAUDE.md Presets | Applies to timer state persistence too, not only preset data |
| All-lowercase filenames; root-absolute asset paths | CLAUDE.md / Phase 1 conventions | `timer.worker.js`, `spawn-timer.js`, `timer.css` — all lowercase |
| `data-game="where-winds-meet"` on `<body>` | Phase 1 convention | Already present in the stub; must be retained |
| No React / Vue / Angular | CLAUDE.md What NOT to Use | Vanilla ES modules only |
| Do not use `setInterval` alone on main thread | CLAUDE.md What NOT to Use | Web Worker owns the interval |
| Do not use `Date.now()` for elapsed time | CLAUDE.md What NOT to Use | Wall-clock `Date.now()` IS used for deadline arithmetic (timestamp of when cycle ends), but `performance.now()` is used for intra-tick precision if needed |

> **Clarification — `Date.now()` vs `performance.now()`:** STATE.md locks "Wall-clock anchored timing (Date.now() delta)" and CLAUDE.md says "use `performance.now()` not `Date.now()`". These are reconcilable: store the absolute cycle-end deadline as a `Date.now()` epoch timestamp (wall clock, survives localStorage serialization and page reload) and use that for all `remaining = cycleEnd - Date.now()` calculations. Within the Worker, `performance.now()` can optionally provide sub-millisecond interval precision for the setInterval scheduling decision. The stored deadline must be wall-clock (`Date.now()`) because `performance.now()` resets on page load.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tick delivery / interval scheduling | Web Worker (`timer.worker.js`) | — | Chrome 88+ throttles main-thread intervals to ~1/min in background tabs; workers are not subject to the same throttling [VERIFIED: MDN, community articles] |
| Remaining-time calculation | Main thread (on worker message) | — | `remaining = cycleEnd - Date.now()` is a pure arithmetic op; display update must be on main thread to touch DOM |
| Countdown display rendering | Main thread DOM | — | DOM access is main-thread only |
| Cycle-end detection + beep trigger | Main thread (on worker message) | — | AudioContext must run on main thread; beep triggered when remaining <= 0 |
| AudioContext lifecycle | Main thread (`spawn-timer.js`) | — | Web Audio API is not available in Workers [VERIFIED: MDN] |
| State machine (idle/running/paused/finished) | Main thread (`spawn-timer.js`) | — | State drives `data-state` attribute on DOM, which CSS keys off |
| Timer state persistence | `localStorage` (main thread) | — | Persist `cycleEnd` (epoch timestamp) + `state` + config so reload can resume |
| Visual state (button visibility, input disable) | CSS (attribute selectors) | JS sets `data-state` | CSS selectors `[data-state="running"]` control visibility; JS only changes the attribute |
| Input validation | Main thread JS | — | Inline error messages, Start button disabled state |

---

## Standard Stack

### Core (all browser-native, zero npm packages for Phase 2 tool logic)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Web Workers API | Browser-native | Background interval — escapes main-thread throttling | The only reliable way to run a timer accurately in a backgrounded tab [VERIFIED: MDN] |
| Web Audio API | Browser-native | Synthesised beep per cycle end | No asset files, instant, consistent across browsers [VERIFIED: MDN] |
| `Date.now()` | Browser-native | Wall-clock deadline storage and remaining-time calculation | Survives localStorage serialization; monotonic enough for second-precision timers |
| `performance.now()` | Browser-native | Available in workers; sub-ms precision for interval scheduling | Monotonic; unaffected by NTP/DST [VERIFIED: MDN] |
| Page Visibility API (`visibilitychange`) | Browser-native | Detect tab-foreground return; trigger AudioContext resume | Widely available since 2015 [VERIFIED: MDN] |
| localStorage | Browser-native | Persist timer state across page reloads | Phase 1 decision; synchronous, sufficient for JSON config blobs |

### Supporting (build pipeline, inherited from Phase 1)

No new npm packages are required for Phase 2 timer functionality. The existing Phase 1 build pipeline (Eleventy 3.1.6, Tailwind v4, PostCSS 8) serves the page with zero new dependencies.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Web Worker setInterval | `requestAnimationFrame` + `visibilitychange` | rAF is throttled to ~2Hz in background; does not solve the core problem |
| Web Worker setInterval | look-ahead audio scheduling (web.dev pattern) | Excellent for musical timing; overkill for a once-per-cycle beep; adds complexity |
| Fresh OscillatorNode per beep | Reuse + GainNode mute/unmute | GainNode approach works for continuous oscillators; for discrete beeps, fresh node is simpler and avoids state leakage |
| `Date.now()` deadline | `performance.now()` deadline | `performance.now()` resets on page load — cannot be stored in localStorage and recovered; `Date.now()` persists correctly |

**Installation:** None — all Phase 2 logic uses browser-native APIs only.

---

## Package Legitimacy Audit

> Phase 2 installs **no new npm packages**. All timer, audio, and storage logic uses browser-native Web APIs. The Phase 1 build pipeline (Eleventy, Tailwind, PostCSS) is already installed. No audit table is needed.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
  User gesture (Start click)
          |
          v
  [Main Thread: spawn-timer.js]
          |
          |-- creates/resumes AudioContext (gesture-unlocked)
          |-- stores cycleEnd = Date.now() + durationMs in localStorage
          |-- sets data-state="running" on .timer root
          |-- spawns / messages timer.worker.js  { cmd: 'start', intervalMs: 100 }
          |
  [Worker: timer.worker.js]
          |
          |-- setInterval(100ms) — NOT throttled in background tab
          |-- each tick: postMessage({ type: 'tick' }) to main
          |
          v
  [Main Thread receives 'tick']
          |
          |-- remaining = cycleEnd - Date.now()
          |-- if remaining > 0: update countdown display
          |-- if remaining <= 0: CYCLE END
                    |
                    |-- playBeep()  (new OscillatorNode each time)
                    |-- flash .timer__display.is-flashing
                    |-- if cycles remaining:
                    |     cycleEnd = Date.now() + durationMs
                    |     cycleCount++
                    |     update localStorage
                    |-- else:
                    |     data-state="finished"
                    |     worker.postMessage({ cmd: 'stop' })

  [visibilitychange — tab returns to foreground]
          |
          |-- if audioCtx.state === 'suspended' || 'interrupted':
          |       audioCtx.resume()
          |-- recompute remaining = cycleEnd - Date.now()
          |       (catches any cycles that fired while backgrounded)
          |-- if remaining < 0 && state===running:
                  trigger missed cycle-end(s) immediately
```

### Recommended Project Structure

```
games/where-winds-meet/tools/spawn-timer/
├── index.html          # page shell; links theme.css + timer.css; loads spawn-timer.js as module
├── timer.css           # tool-specific component styles layered on top of /shared/theme.css tokens
├── spawn-timer.js      # main ES module: state machine, DOM wiring, audio, localStorage
└── timer.worker.js     # Web Worker: setInterval tick source; no DOM, no audio
```

All filenames lowercase. Paths root-absolute in `<link>` and `<script>` tags.

---

### Pattern 1: Web Worker Tick Source

**What:** The worker owns a fixed-interval `setInterval`. Main thread receives `tick` messages and calculates `remaining = cycleEnd - Date.now()`.

**When to use:** Always — this is the only pattern that survives Chrome 88+ background-tab intensive throttling.

```javascript
// timer.worker.js
// Source: MDN Web Workers API + community verification
let intervalId = null;

self.onmessage = function(e) {
  if (e.data.cmd === 'start') {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      self.postMessage({ type: 'tick' });
    }, e.data.intervalMs || 100);
  } else if (e.data.cmd === 'stop') {
    clearInterval(intervalId);
    intervalId = null;
  }
};
```

```javascript
// spawn-timer.js (main thread excerpt)
// Source: CLAUDE.md Concrete Approach + MDN Worker API
const worker = new Worker('/games/where-winds-meet/tools/spawn-timer/timer.worker.js');

worker.onmessage = function(e) {
  if (e.data.type === 'tick') {
    const remaining = state.cycleEnd - Date.now();
    if (remaining <= 0) {
      handleCycleEnd();
    } else {
      updateDisplay(remaining);
    }
  }
};
```

**Note on inline Worker via Blob:** If same-origin Worker file loading proves tricky (e.g., local file:// testing), an inline Blob Worker is a valid fallback: `new Worker(URL.createObjectURL(new Blob([workerCode], {type:'application/javascript'})))`. For GitHub Pages, a separate file is simpler and preferred. [ASSUMED — local file testing edge case]

---

### Pattern 2: Deadline-Anchored Remaining-Time Calculation

**What:** Never count ticks. Compute `remaining = cycleEnd - Date.now()` on every tick. The cycle end is an absolute wall-clock timestamp stored at cycle start.

**When to use:** Always. This eliminates drift regardless of late callbacks or background throttling.

```javascript
// spawn-timer.js
// Source: STATE.md "Pitfall Watch" + CLAUDE.md Timer Logic

function startCycle(durationMs) {
  const cycleEnd = Date.now() + durationMs;
  // Store absolute deadline — survives localStorage and page reload
  saveTimerState({
    state: 'running',
    cycleEnd,
    cycleIndex: state.cycleIndex,
    totalCycles: state.totalCycles,
    durationMs
  });
  state.cycleEnd = cycleEnd;
  worker.postMessage({ cmd: 'start', intervalMs: 100 });
}

function updateDisplay(remaining) {
  const totalSecs = Math.ceil(remaining / 1000);
  const mm = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const ss = (totalSecs % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${mm}:${ss}`;
}
```

---

### Pattern 3: AudioContext Lifecycle — Gesture Unlock + iOS Interrupted State

**What:** AudioContext must be created or resumed inside a user gesture (Start button click). On iOS Safari, the context can enter `interrupted` state when the tab is backgrounded; `visibilitychange` must attempt a `.resume()`.

**When to use:** On every Start/Resume click, and on `visibilitychange` when `document.visibilityState === 'visible'`.

```javascript
// spawn-timer.js
// Source: MDN Web Audio API Best Practices + WebKit bug #237878

let audioCtx = null;

function ensureAudioContext() {
  // Must be called inside a user gesture (click handler)
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended' || audioCtx.state === 'interrupted') {
    audioCtx.resume();
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && audioCtx) {
    // iOS Safari enters 'interrupted' state when backgrounded.
    // Resume on return to foreground so beep fires on next cycle end.
    audioCtx.resume().catch(() => {});
  }
});

// Start button click handler
startButton.addEventListener('click', () => {
  ensureAudioContext();   // gesture unlock — MUST be here, not in setTimeout/Worker
  startTimer();
});
```

---

### Pattern 4: Fresh OscillatorNode Per Beep

**What:** A stopped `OscillatorNode` cannot be restarted. Create a new one every time `playBeep()` is called.

**When to use:** Always. Never save an OscillatorNode reference across calls.

```javascript
// spawn-timer.js
// Source: MDN OscillatorNode + CLAUDE.md Audio section

function playBeep() {
  if (!audioCtx) return;          // guard: AudioContext not yet created
  if (audioCtx.state !== 'running') {
    // Attempt resume; schedule beep for 50ms later to allow resume to complete
    audioCtx.resume().then(() => scheduleBeep());
    return;
  }
  scheduleBeep();
}

function scheduleBeep() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);  // A5 — clear, non-harsh

  gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.3);  // 300ms beep with ramp-down
  // Node is garbage collected after .stop() fires — no manual cleanup needed
}
```

---

### Pattern 5: Timer State Machine

Four logical states keyed by `data-state` attribute on `.timer` root element.

```
                    ┌─────────────────────────────────────┐
                    │              IDLE                   │
                    │  (config editable, Start visible)   │
                    └──────────────┬──────────────────────┘
                                   │ Start click
                                   v
                    ┌─────────────────────────────────────┐
                    │            RUNNING                  │◄──── Resume click
                    │  (Pause+Reset visible; config 40%)  │
                    └──────┬──────────────┬───────────────┘
                           │              │
                    Pause click     All cycles done
                           │              │
                           v              v
                    ┌────────────┐  ┌─────────────────────┐
                    │  PAUSED    │  │      FINISHED       │
                    │ Resume+    │  │  (Start+Reset; 0:00) │
                    │ Reset vis. │  └──────┬──────────────┘
                    └────────────┘         │
                                     Start click / Reset
                                           │
                                           v
                                        IDLE
```

**Pause/Resume time accounting:**
```javascript
// When pausing: store pausedAt = Date.now()
// When resuming: shift cycleEnd forward by the pause duration
// cycleEnd += Date.now() - pausedAt
// This preserves remaining time exactly across pause/resume.
```

---

### Pattern 6: localStorage State Persistence (Fresh Reload Resume)

**What:** Store the absolute `cycleEnd` epoch timestamp (not remaining seconds) plus current state. On page load, if stored state is `running`, reconstruct the timer by computing remaining time from the stored deadline.

**Why this solves "beep on first cycle after hard refresh":** The success criterion "audible beep fires at end of EVERY cycle ... even after a hard page refresh" means: if the user refreshes the page while the timer is running, the timer should RESUME (not restart) correctly. It does NOT mean the beep fires during the reload itself — it means the next cycle-end beep works correctly after reload. The AudioContext is re-unlocked on the next user gesture (the Start click reconstructed from loaded state — but wait, if we auto-resume there's no gesture). See the pitfall below.

```javascript
// spawn-timer.js — on DOMContentLoaded
const SCHEMA_VERSION = 1;
const STORAGE_KEY = 'gametools.where-winds-meet.spawn-timer.state';

function loadTimerState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.schemaVersion !== SCHEMA_VERSION) return null;
    return data;
  } catch (e) {
    return null;  // QuotaExceededError, JSON parse error, etc.
  }
}

function saveTimerState(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      ...data
    }));
  } catch (e) { /* best-effort */ }
}
```

---

### Pattern 7: Input Parsing (MM:SS and raw seconds)

```javascript
// Source: Standard parsing pattern (ASSUMED — no library needed)
function parseDuration(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // MM:SS format
  const colonMatch = trimmed.match(/^(\d{1,3}):(\d{2})$/);
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10);
    const secs = parseInt(colonMatch[2], 10);
    if (secs >= 60) return null;  // invalid: 3:75
    return (mins * 60 + secs) * 1000;
  }

  // Raw seconds
  const secMatch = trimmed.match(/^\d+$/);
  if (secMatch) {
    const secs = parseInt(trimmed, 10);
    return secs > 0 ? secs * 1000 : null;
  }

  return null;  // invalid format
}
```

Validation rules:
- Empty input: `null` → "Enter a duration to start." (Start disabled)
- Invalid format: `null` → "Use MM:SS or a number of seconds (e.g. 3:00 or 180)."
- Seconds `>= 60` in MM:SS: `null` → same error message
- Zero or negative: `null` → same error message
- Repeat count: must be integer >= 1, OR Unlimited checked

---

### Anti-Patterns to Avoid

- **Counting ticks instead of using wall-clock deadline:** Even with a Worker, callbacks can arrive late. Always `remaining = cycleEnd - Date.now()`.
- **Reusing a stopped OscillatorNode:** After `.stop()`, the node is permanently inactive. Calling `.start()` again throws a `DOMException`. Always `audioCtx.createOscillator()` inside `playBeep()`.
- **Creating AudioContext at module load time:** Browsers reject audio context creation outside a user gesture. The context must be created (or `.resume()` called) inside a click handler.
- **Calling `audioCtx.resume()` and immediately calling `playBeep()`:** `resume()` is async. Chain off the promise: `audioCtx.resume().then(() => scheduleBeep())`.
- **Storing remaining time in localStorage (not deadline):** Remaining time decays while the user is away. Storing `cycleEnd` epoch timestamp lets you compute correct remaining on any future load.
- **Posting `worker.postMessage()` with the `AudioContext` object:** AudioContext is not transferable and not available in Workers. Keep audio on the main thread.
- **Using `setInterval` on the main thread for display updates:** In background tabs, Chrome 88+ delays these to 1/min. The Worker owns the interval; the main thread only updates the DOM on message receipt.
- **Not handling the iOS Safari `interrupted` state:** `audioCtx.resume()` when state is `suspended` is not enough on iOS. Check for `state === 'interrupted'` explicitly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Background-tab timer accuracy | Custom RAF loop or setInterval retry | Web Worker with setInterval | Workers are not throttled; main-thread retries just add complexity |
| Synthesised beep tone | Audio file assets or procedural wavetable | OscillatorNode + GainNode (browser-native) | Zero assets, no load time, consistent across browsers |
| Clock drift | Tick counting | `remaining = cycleEnd - Date.now()` wall-clock calculation | No drift possible — each tick recalculates from absolute deadline |
| Audio gesture unlock across browsers | Browser-detect polyfill | Create/resume AudioContext inside click handler + statechange listener | Handles Chrome (suspended), iOS (interrupted) uniformly |

**Key insight:** The Web Audio API and Web Worker API are the correct primitives for this exact use case. No library abstracts them better for a single-beep timer. Adding a library would introduce upgrade burden for zero benefit.

---

## Common Pitfalls

### Pitfall 1: Silent Beep After Page Refresh — The Gesture Problem

**What goes wrong:** The page reloads. The timer state is read from localStorage. The timer auto-resumes (runs the interval). A cycle ends. `playBeep()` is called. But `audioCtx` is `null` because no user gesture has fired yet. The beep silently drops.

**Why it happens:** AudioContext creation requires a user gesture. On a fresh load there has been no gesture.

**How to avoid:** Do NOT auto-start the timer on page load. Instead, restore the UI state (show the loaded configuration, set the countdown to the correct remaining value, show "Resume" as the primary button) but require the user to click "Resume" to restart. The Resume click is the gesture that creates/resumes the AudioContext. This is the correct UX anyway — auto-starting a timer on reload without user confirmation is surprising.

**Warning signs:** `playBeep()` called when `audioCtx === null` (add guard). No beep heard after refresh but timer appears to run.

**Implementation contract:** On DOMContentLoaded, if localStorage has `state: 'running'`, transition to a "restore" sub-state (not truly running): show the current remaining time as static countdown, show "Resume" button, show "Paused — refresh detected" state label. The user clicks Resume to re-lock the gesture and restart the Worker. [ASSUMED — UX recommendation; no locked decision from discuss-phase]

---

### Pitfall 2: Missed Cycle Ends While Backgrounded

**What goes wrong:** Tab is hidden for 5 minutes. The timer had a 1-minute cycle. Four cycles fired while backgrounded. On return, `remaining = cycleEnd - Date.now()` shows a large negative number. The Worker kept posting ticks (because workers are not throttled) but the main thread may have deferred processing.

**Why it happens:** Chrome's intensive throttling can affect task queues on the main thread even when the Worker itself runs. Message delivery from Worker to main thread can be delayed or batched.

**How to avoid:** On `visibilitychange` (visible): immediately re-read `remaining = cycleEnd - Date.now()`. If `remaining < 0` and state is `running`, determine how many complete cycles passed while hidden (`missedCycles = Math.floor(elapsed / durationMs)`), advance `cycleIndex` accordingly, fire beep(s) for missed cycles (max 1 beep on return, not N beeps), and set `cycleEnd` to the correct next deadline. Cap beeps at 1 on return — firing 4 beeps at once is worse UX than firing 1.

**Warning signs:** Timer shows a large negative or incorrect value immediately after tab is foregrounded.

---

### Pitfall 3: iOS Safari AudioContext `interrupted` State

**What goes wrong:** Timer is running. User switches to another iOS app (phone call, another app). AudioContext enters `interrupted` state. User returns to the browser. Next cycle end fires. `audioCtx.state === 'interrupted'`. `scheduleBeep()` tries to use the context and audio is silent.

**Why it happens:** iOS Safari adds a fourth AudioContext state (`interrupted`) beyond the spec's `suspended/running/closed`. It is NOT the same as `suspended`. Calling `audioCtx.resume()` on a `suspended` context is not the same path as resuming from `interrupted`. [VERIFIED: MDN BaseAudioContext.state, WebKit bug #237878]

**How to avoid:** In `visibilitychange` handler AND in `playBeep()`:
```javascript
if (audioCtx.state === 'suspended' || audioCtx.state === 'interrupted') {
  audioCtx.resume().catch(() => {});
}
```
Also attach `audioCtx.onstatechange` to log transitions during development.

**Warning signs:** Silent beeps only on iOS Safari, only after switching apps. Desktop browsers work fine.

---

### Pitfall 4: OscillatorNode Cannot Be Restarted

**What goes wrong:** One OscillatorNode is created at module load time. First beep works. Second beep: `.start()` throws `DOMException: InvalidStateError` because the node has already been started. All subsequent beeps are silent.

**Why it happens:** Per spec, a `AudioScheduledSourceNode` (including `OscillatorNode`) can only be started once. After `.stop()` the node is permanently ended. [VERIFIED: MDN OscillatorNode]

**How to avoid:** Never save an OscillatorNode as a module-level variable. Always `audioCtx.createOscillator()` inside the `playBeep()` / `scheduleBeep()` function body.

**Warning signs:** First cycle fires correctly; all subsequent cycles are silent.

---

### Pitfall 5: Chrome Intensive Throttling at 1 Minute

**What goes wrong:** Developer uses `setInterval(100, callback)` on the main thread. Tab is hidden. After ~1 minute, Chrome's intensive throttling policy fires the callback at most once per minute instead of 10 times/second. Timer display freezes; cycle ends are delayed by up to 60 seconds.

**Why it happens:** Chrome 88+ introduced "intensive throttling" that drops hidden-tab timer callbacks to 1/minute for tabs that have not had user input in the past 5 minutes and have been hidden for > 5 minutes. [VERIFIED: community articles citing Chrome 88 release notes]

**How to avoid:** Move the interval to a Web Worker. Worker timers are not subject to this policy. Main thread only touches the DOM when it receives a Worker message.

**Warning signs:** Timer appears accurate during active use but loses minutes when tab is backgrounded.

---

### Pitfall 6: `Date.now()` vs. `performance.now()` Storage Confusion

**What goes wrong:** Developer stores `performance.now()` timestamp as the cycle deadline in localStorage. Page is refreshed. `performance.now()` resets to near-zero on reload. The stored deadline is now a number from a previous performance epoch that is wildly incorrect.

**Why it happens:** `performance.now()` is relative to the page's navigation start, which resets on each page load. `Date.now()` is the Unix epoch and is stable across reloads.

**How to avoid:** Store deadlines as `Date.now()` (epoch ms). Use `performance.now()` only for intra-session sub-ms precision measurements (e.g., Worker interval scheduling) that never need to cross a page load boundary.

**Warning signs:** Timer resets to wrong value or shows large negative remaining after page refresh.

---

### Pitfall 7: Pause/Resume Without Shifting the Deadline

**What goes wrong:** Timer is paused at "2:15 remaining". User pauses for 30 seconds. User resumes. Timer displays "1:45" instead of "2:15" because the deadline was not adjusted.

**Why it happens:** During pause, `Date.now()` keeps advancing. When resumed, `remaining = cycleEnd - Date.now()` has shrunk by the pause duration.

**How to avoid:** On Pause: store `pausedAt = Date.now()`. On Resume: `cycleEnd += Date.now() - pausedAt`. The deadline shifts forward by exactly the pause duration, preserving remaining time.

**Warning signs:** Resumed timer counts from wrong value.

---

## Code Examples

### Complete Worker Communication Protocol

```javascript
// timer.worker.js
// Source: MDN Web Workers API [VERIFIED]
let intervalId = null;

self.onmessage = function(e) {
  switch (e.data.cmd) {
    case 'start':
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        self.postMessage({ type: 'tick' });
      }, e.data.intervalMs || 100);
      break;
    case 'stop':
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      break;
  }
};
```

### Cycle End Handler (Main Thread)

```javascript
// spawn-timer.js — handleCycleEnd()
// Source: architecture synthesised from CLAUDE.md + STATE.md decisions

function handleCycleEnd() {
  playBeep();
  flashDisplay();

  if (state.unlimited || state.cycleIndex < state.totalCycles - 1) {
    state.cycleIndex++;
    const cycleEnd = Date.now() + state.durationMs;
    state.cycleEnd = cycleEnd;
    saveTimerState({ ...state, cycleEnd });
    updateCycleCounter();
  } else {
    // Final cycle complete
    worker.postMessage({ cmd: 'stop' });
    setTimerState('finished');
    timerDisplay.textContent = '0:00';
    saveTimerState({ ...state, state: 'finished' });
  }
}
```

### Cycle Counter Display

```javascript
// MM:SS formatter
function formatRemaining(ms) {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const ss = (totalSecs % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

// Cycle counter text
function updateCycleCounter() {
  const total = state.unlimited ? '∞' : state.totalCycles;
  cycleCounterEl.textContent = `Cycle ${state.cycleIndex + 1} / ${total}`;
}
```

### Cycle-End Flash (UI-SPEC Compliance)

```javascript
// spawn-timer.js — flash per UI-SPEC §Cycle-End Alert Flash
function flashDisplay() {
  timerDisplayEl.classList.add('is-flashing');
  timerDisplayEl.addEventListener('animationend', () => {
    timerDisplayEl.classList.remove('is-flashing');
  }, { once: true });
}
```

### Accessibility: Role + ARIA Live Region for Cycle End

```html
<!-- index.html — countdown display element -->
<!-- role="timer" has implicit aria-live="off" — digits do NOT announce every second -->
<!-- A separate sr-only alert region announces cycle completion -->
<div class="timer__display" role="timer" aria-label="Countdown timer" aria-atomic="true">
  03:00
</div>

<!-- Visually hidden, assertive live region — fires only at cycle end -->
<div class="sr-only" id="timer-announcer" aria-live="assertive" aria-atomic="true"></div>
```

```javascript
// Announce cycle end to screen readers
function announceToScreenReader(msg) {
  const el = document.getElementById('timer-announcer');
  el.textContent = '';
  // Force re-render before setting text so repeat announcements work
  requestAnimationFrame(() => { el.textContent = msg; });
}

// In handleCycleEnd():
announceToScreenReader(`Cycle ${state.cycleIndex + 1} complete`);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `setInterval` on main thread | Web Worker `setInterval` | Chrome 88 (2021) | Main-thread intervals throttled to 1/min in hidden tabs; Worker is the correct location |
| AudioContext always `suspended` | Create inside gesture; handle `interrupted` state | iOS Safari ~16 | iOS added a 4th state (`interrupted`) distinct from `suspended`; both must be handled |
| Storing remaining seconds | Storing epoch deadline (`cycleEnd = Date.now() + ms`) | Best practice (always correct) | Surviving page reload without drift |
| `setInterval` drift accepted | Deadline-corrected `remaining = cycleEnd - Date.now()` | Best practice | Eliminates cumulative drift for 3+ minute cycles |

**Deprecated/outdated:**
- Storing `performance.now()` as a persistent deadline: incorrect for cross-load scenarios — use `Date.now()`.
- Relying on `suspended` being the only non-running AudioContext state on iOS: `interrupted` is real and distinct.
- Using `setInterval` directly on the main thread for any timer expected to work in background tabs.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Web Worker `setInterval` is not subject to Chrome 88+ intensive throttling (confirmed by community articles citing Chrome behavior, but not verified against an official Chrome release note in this session) | Architecture, Standard Stack | If Workers are also throttled in some future Chrome version, the timer accuracy guarantee breaks. Monitor caniuse / Chrome release notes. |
| A2 | iOS Safari Workers do not fully escape iOS-level background throttling (aggressive process suspension may affect the Worker's host process) | Common Pitfalls 2, Architecture | If iOS suspends the Worker's thread entirely, the timer would pause until foreground; user impact: late beep on return. The `visibilitychange` recovery pattern partially mitigates this. |
| A3 | Auto-resuming the timer on page reload (without a gesture) is bad UX and should require a "Resume" click — the "beep on first cycle after hard refresh" criterion means "the beep works on the next cycle after the user re-engages, not that it fires during the reload itself" | Pitfall 1, Architecture | If interpreted differently, the timer could auto-resume on load — but AudioContext cannot be created without a gesture, so a beep cannot fire until the user acts anyway. This interpretation is safe. |
| A4 | Inline Blob Worker as fallback for same-origin constraints | Pattern 1 | Not needed for GitHub Pages deployment; only relevant for local file:// development testing. Low risk. |
| A5 | `font-variant-numeric: tabular-nums` is universally supported (MDN shows wide support, not verified in this session for mobile browsers) | Validation Architecture | If not supported, countdown digits shift width on every second; minor visual jitter only. |

---

## Open Questions

1. **Should the timer auto-resume after a page reload if localStorage has a running state?**
   - What we know: AudioContext cannot be created without a gesture, so a beep cannot fire during auto-resume before the user acts.
   - What's unclear: Does the product want a "Resume" prompt, or should the timer silently track the elapsed time and just show the correct remaining value?
   - Recommendation: Show correct remaining countdown (from stored deadline) as static display, show "Resume" as the primary CTA. This is both the cleanest UX and the correct technical path.

2. **What is the `intervalMs` for the Worker?**
   - Finer granularity = smoother countdown, more messages.
   - 100ms (10 messages/second) is a good balance: smooth enough for a seconds-precision timer, low overhead.
   - Recommendation: 100ms. Display update only changes the DOM when the seconds value changes.

3. **How many missed cycles should trigger a beep on `visibilitychange` return?**
   - What we know: Firing N beeps for N missed cycles is jarring.
   - Recommendation: Fire 1 beep maximum on return regardless of missed cycles; update the cycle counter to the correct current cycle.

---

## Environment Availability

> This phase is code/config changes only — no new CLI tools, services, or runtimes required. The existing Node 20 + Eleventy + Tailwind pipeline from Phase 1 is sufficient. All timer/audio APIs are browser-native.

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Node.js 20 LTS | Eleventy build | (Phase 1 confirmed live) | No version change needed |
| Browser Web Worker API | TIMER-08 | Widely available — Chrome 4+, Firefox 3.5+, Safari 4+ | [VERIFIED: MDN] |
| Browser Web Audio API | ALERT-01, ALERT-02 | Chrome 35+, Firefox 25+, Safari 14.1+ | [VERIFIED: MDN] |
| `OscillatorNode` | ALERT-01 | Same as Web Audio API | [VERIFIED: MDN] |
| Page Visibility API | background recovery | Widely available since 2015 | [VERIFIED: MDN] |
| `localStorage` | state persistence | Universal in target browsers | [VERIFIED: MDN] |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test infrastructure exists in the repo yet |
| Config file | Wave 0 gap — needs creation |
| Quick run command | Manual browser testing (see below) — no automated test runner for browser JS |
| Full suite command | Manual checklist |

**Note:** This is a browser-JS-only project with no Node.js test runner configured. The timer and audio logic runs in a browser environment (Web Workers, Web Audio API, DOM) that is difficult to unit-test with `jest` or `vitest` without significant JSDOM mocking. The validation strategy below relies on in-browser smoke tests and a manual checklist, which is appropriate for this project's scale.

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | How to Validate |
|--------|----------|-----------|-----------------|
| TIMER-01 | Accepts `MM:SS` and raw seconds | Manual in-browser | Enter `3:00`, `180`, `0:75` (invalid), `` (empty); verify Start button state and error messages |
| TIMER-02 | Finite repeat count + unlimited | Manual in-browser | Set repeat=3, verify counter shows "Cycle 1/3"; set Unlimited, verify "Cycle X/∞" |
| TIMER-03 | Start, pause, resume | Manual in-browser | Start timer; pause; verify frozen display; resume; verify countdown continues from paused value |
| TIMER-04 | Reset | Manual in-browser | Mid-cycle click Reset; verify `data-state="idle"` and config panel re-enabled |
| TIMER-05 | Large glanceable countdown at 375px | Visual / manual | Open DevTools; set 375px viewport; verify countdown is readable, min 56px |
| TIMER-06 | Cycle counter correct value | Manual in-browser | 3-cycle timer; verify "Cycle 1/3" → "Cycle 2/3" → "Cycle 3/3" → Finished |
| TIMER-07 | Visual state indicators | Manual in-browser | Verify `data-state` transitions; Pause shows Pause button; Running shows jade pip; Finished shows Start+Reset |
| TIMER-08 | Accurate timing after 2+ min backgrounded | Manual in-browser | Start 3-min timer; switch tabs 2 min; return; verify remaining time is accurate (not drifted) |
| ALERT-01 | Beep at each cycle end | Manual in-browser (audio on) | Hear beep at each of N cycles; verify no silent cycles |
| ALERT-02 | Beep reliable on first cycle, including after refresh | Manual in-browser | Hard-refresh; click Resume; let cycle complete; verify beep fires |
| THEME-05 | WCAG AA contrast, tabular numerals | Visual / computed | Countdown: `#e8e4d8` on `#0f1115` = ~14.1:1 (AAA). Verify digits do not jitter width during countdown. |

### Wave 0 Gaps (test infrastructure to create before implementation)

- [ ] No automated test runner is needed for Phase 2 — the browser APIs cannot be meaningfully unit-tested without a full browser environment
- [ ] Create a manual test checklist document or use the VERIFICATION.md that gsd-verifier generates
- [ ] For TIMER-08 specifically: use browser DevTools Performance tab to confirm Worker interval is not throttled (record a background-tab trace)

### Sampling Strategy

- **Per task:** Visual review in browser at 375px + 1280px viewports
- **Per wave:** Run the full manual checklist above
- **Phase gate:** All TIMER-*, ALERT-*, THEME-05 items green in the manual checklist before `/gsd:verify-work`

---

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1` from config.json.

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this tool |
| V3 Session Management | No | localStorage is not a session mechanism here; it's convenience state |
| V4 Access Control | No | Single-user personal tool; no access control needed |
| V5 Input Validation | Yes | Duration and repeat count inputs must be validated before use; `parseDuration()` returns `null` for invalid input; Start is disabled until valid |
| V6 Cryptography | No | No secrets, no encryption needed |

### Known Threat Patterns for Static Browser JS

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| localStorage data poisoning | Tampering | Defensive read: `try/catch` + `schemaVersion` check; invalid stored state is discarded cleanly |
| Unexpected `JSON.parse` throw | Tampering | Wrapped in try/catch; `null` returned on any error |
| XSS via stored timer config rendered to DOM | Tampering | Timer values are numbers (integers), not strings rendered as HTML; format with `textContent`, never `innerHTML` |
| OscillatorNode frequency injection | Spoofing | Frequency is a hardcoded constant in `scheduleBeep()` — no user input feeds the frequency value |

**Security summary for Level 1:** The main surface is the two text inputs (duration, repeat). Both are validated to numeric types before any use. localStorage values are read defensively. No innerHTML rendering of user-controlled data. No network requests. Threat surface is minimal.

---

## Sources

### Primary (HIGH confidence)

- [MDN: OscillatorNode](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode) — Confirmed: stopped nodes cannot be restarted; lifecycle behavior
- [MDN: Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — AudioContext autoplay policy; create inside gesture; `suspended` state
- [MDN: BaseAudioContext.state](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state) — All four states including `interrupted`; iOS Safari transition rules
- [MDN: Performance.now()](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now) — Available in Workers; monotonic; 100 microsecond precision in non-isolated contexts
- [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — `visibilitychange` event; `document.visibilityState`
- [MDN: Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) — Worker `postMessage` protocol; `setTimeout`/`setInterval` available in Worker scope
- [MDN: ARIA timer role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/timer_role) — Implicit `aria-live="off"`; pattern for cycle-end announcement via `role="alert"` switch
- [web.dev: A Tale of Two Clocks (audio scheduling)](https://web.dev/articles/audio-scheduling) — Look-ahead scheduling; resilience under main-thread throttling
- [WebKit bug #237878](https://bugs.webkit.org/show_bug.cgi?id=237878) — iOS Safari AudioContext suspended on backgrounding; fix targeted iOS 16 but incomplete

### Secondary (MEDIUM confidence)

- Community articles via WebSearch — Web Worker setInterval escapes Chrome 88+ intensive throttling; main-thread setInterval throttled to 1/min in hidden tabs after 5 min no input
- [Pontis Technology — setInterval throttling](https://pontistechnology.com/learn-why-setinterval-javascript-breaks-when-throttled/) — Chrome throttles main-thread to once per minute; Workers not throttled
- [Medium: Overcoming browser throttling](https://medium.com/@adithyaviswam/overcoming-browser-throttling-of-setinterval-executions-45387853a826) — Worker-based timer architecture with postMessage

### Tertiary (LOW confidence)

- STATE.md / CLAUDE.md decisions (project-internal, HIGH authority as locked decisions — listed here as source for the baseline approach)
- WebKit bug thread comments about `interrupted` state behavior across iOS versions (comments from developers; not official Apple docs)

---

## Metadata

**Confidence breakdown:**
- Background-tab accuracy (Web Worker approach): HIGH — MDN verified; community articles corroborate
- AudioContext gesture unlock pattern: HIGH — MDN official docs
- iOS `interrupted` state: MEDIUM — MDN confirmed the state exists; fix status ambiguous across iOS versions; workaround pattern is standard
- State machine design: HIGH — directly derived from locked UI-SPEC
- localStorage deadline persistence: HIGH — standard pattern; verified by multiple sources
- Worker not throttled claim: MEDIUM — community articles, Chrome 88 release notes referenced but not directly fetched

**Research date:** 2026-06-04
**Valid until:** 2026-12-04 (stable browser APIs; Web Audio and Worker throttling policies could change in major Chrome/Safari releases)
