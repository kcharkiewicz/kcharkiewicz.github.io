# Phase 2: Timer Core — Pattern Map

**Mapped:** 2026-06-04
**Files analyzed:** 4 new/modified files
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `games/where-winds-meet/tools/spawn-timer/index.html` | page-shell (modified) | request-response | `games/where-winds-meet/index.html` | exact |
| `games/where-winds-meet/tools/spawn-timer/timer.css` | stylesheet (new) | — | `shared/theme.css` | token-consumer |
| `games/where-winds-meet/tools/spawn-timer/spawn-timer.js` | ES module / state machine (new) | event-driven | `games/where-winds-meet/index.html` inline script + `index.html` inline script | role-match (JS pattern) |
| `games/where-winds-meet/tools/spawn-timer/timer.worker.js` | Web Worker (new) | event-driven | none — no Worker exists in codebase | no analog |

---

## Pattern Assignments

### `games/where-winds-meet/tools/spawn-timer/index.html` (page-shell, modified)

**Analog:** `games/where-winds-meet/tools/spawn-timer/index.html` (current stub, lines 1–63)
**Secondary analog:** `games/where-winds-meet/index.html` (lines 1–84) for breadcrumb + shell pattern

The stub already has the correct doctype, `<head>`, `<body data-game="where-winds-meet">`, `.site-header`, breadcrumb nav, and `.site-footer`. Phase 2 replaces the placeholder `<main>` content with the full timer markup.

**Doctype + head pattern** (stub lines 1–9; identical in all three pages):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spawn Timer — Where Winds Meet — Game Tools Hub</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/shared/theme.css">
</head>
```

**Additional `<link>` for co-located tool CSS** — add after `/shared/theme.css`:
```html
  <link rel="stylesheet" href="/games/where-winds-meet/tools/spawn-timer/timer.css">
```

**Body open + data-game attribute** (stub line 10; identical across all game/tool pages):
```html
<body data-game="where-winds-meet">
```

**Site header pattern** (stub lines 11–13; copy verbatim):
```html
  <header class="site-header">
    <span class="site-title">Game Tools Hub</span>
  </header>
```

**Breadcrumb pattern** (stub lines 15–21; nav already present and correct for spawn-timer depth):
```html
  <nav aria-label="Breadcrumb" id="breadcrumb">
    <ol>
      <li><a href="/">Game Tools Hub</a></li>
      <li><a href="/games/where-winds-meet/">Where Winds Meet</a></li>
      <li><span aria-current="page">Spawn Timer</span></li>
    </ol>
  </nav>
```

**`<main>` replacement — timer markup structure** (replaces stub lines 23–29):

The entire placeholder `<main>` block is removed and replaced with the live timer. The correct BEM root element is `.timer` with `data-state` as the state machine attribute. Structure per UI-SPEC:
```html
  <main>
    <div class="timer" id="timer" data-state="idle">

      <div class="timer__header">
        <h1 class="timer__title">Spawn Timer</h1>
        <p class="timer__subtitle">GvG jungle spawn timer</p>
      </div>

      <div class="timer__status">
        <span class="timer__cycle-counter" id="cycle-counter">Cycle 1 / 1</span>
        <span class="timer__state-label" id="state-label"></span>
      </div>

      <div class="timer__display" id="timer-display" role="timer"
           aria-label="Countdown timer" aria-atomic="true">
        03:00
      </div>

      <!-- Visually hidden assertive live region — fires only at cycle end -->
      <div class="sr-only" id="timer-announcer"
           aria-live="assertive" aria-atomic="true"></div>

      <div class="timer__config" id="timer-config">
        <div class="timer__field">
          <label class="timer__label" for="input-duration">Duration</label>
          <input class="timer__input" type="text" id="input-duration"
                 placeholder="e.g. 3:00 or 180" autocomplete="off">
          <span class="timer__helper">MM:SS or seconds</span>
          <span class="timer__error" id="error-duration" role="alert"></span>
        </div>

        <div class="timer__field">
          <label class="timer__label" for="input-repeat">Repeat</label>
          <input class="timer__input timer__input--number" type="number"
                 id="input-repeat" min="1" value="1">
          <label class="timer__unlimited-label">
            <input type="checkbox" id="input-unlimited"> Unlimited
          </label>
          <span class="timer__error" id="error-repeat" role="alert"></span>
        </div>
      </div>

      <div class="timer__controls" id="timer-controls">
        <button class="btn btn--primary" id="btn-start" type="button">Start</button>
        <button class="btn btn--primary" id="btn-resume" type="button">Resume</button>
        <button class="btn btn--secondary" id="btn-pause" type="button">Pause</button>
        <button class="btn btn--outline" id="btn-reset" type="button">Reset</button>
      </div>

    </div>
  </main>
```

**Footer pattern** (stub line 31; copy verbatim):
```html
  <footer class="site-footer">Game Tools Hub — personal project</footer>
```

**Script loading pattern** (stub lines 33–59 use inline `<script>`; Phase 2 adds a module script instead of inline for the main logic, retaining the breadcrumb inline script):
```html
  <script>
    // Breadcrumb renderer — same pattern as all other pages.
    // SECURITY: All values are static developer-defined literals.
    const breadcrumbItems = [
      { label: "Game Tools Hub", href: "/" },
      { label: "Where Winds Meet", href: "/games/where-winds-meet/" },
      { label: "Spawn Timer", href: null }
    ];
    function renderBreadcrumb(items, containerId) {
      const listItems = items.map(item => {
        if (item.href !== null) {
          return `<li><a href="${item.href}">${item.label}</a></li>`;
        } else {
          return `<li><span aria-current="page">${item.label}</span></li>`;
        }
      }).join('');
      document.getElementById(containerId).innerHTML = `<ol>${listItems}</ol>`;
    }
    document.addEventListener('DOMContentLoaded', function () {
      renderBreadcrumb(breadcrumbItems, 'breadcrumb');
    });
  </script>
  <script type="module" src="/games/where-winds-meet/tools/spawn-timer/spawn-timer.js"></script>
```

**Key conventions to copy:**
- Path format: root-absolute (`/shared/theme.css`, not `../../../shared/theme.css`)
- All filenames lowercase
- `data-game="where-winds-meet"` on `<body>` — already present, must be retained
- `type="module"` on the ES module script tag — no `defer` needed (modules are deferred by default)
- Breadcrumb `id="breadcrumb"` on `<nav>` — matches the `renderBreadcrumb(items, 'breadcrumb')` call
- Security comment on every static registry/data array

---

### `games/where-winds-meet/tools/spawn-timer/timer.css` (stylesheet, new)

**Analog:** `shared/theme.css` (lines 1–269) — the base token file this stylesheet layers on top of

This file is a **token consumer only** — it MUST NOT redefine any `--color-*`, `--space-*`, or `--text-*` custom properties. It uses the tokens via `var()` and adds component-specific rules.

**Token consumption pattern** — how `shared/theme.css` itself uses its own tokens (copy this reference pattern for all timer component rules):
```css
/* From shared/theme.css lines 84–94 — .site-header as token consumption exemplar */
.site-header {
  background: var(--color-surface);
  padding: var(--space-md) var(--space-xl);
}
.site-title {
  font-size: var(--text-display);
  font-weight: 600;
  line-height: 1.1;
  color: var(--color-text-primary);
}
```

**Card component transition pattern** (shared/theme.css lines 134–138) — use the same `150ms ease` convention for all timer button/input transitions:
```css
.card {
  transition: background 150ms ease, border-color 150ms ease;
}
```

**Card hover pattern** (shared/theme.css lines 140–143) — the existing pattern for `--color-surface-raised` hover:
```css
.card:hover {
  background: var(--color-surface-raised);
  border-color: var(--color-accent);
}
.card:active {
  opacity: 0.9;
}
```

**Focus ring** (shared/theme.css lines 19–22) — already global, do NOT redefine in timer.css:
```css
/* Already in shared/theme.css — do not copy to timer.css */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

**Component CSS structure to write** — all rules go in `timer.css` using the BEM class names established in the `index.html` markup above. The complete set of new rules to author (all consuming existing tokens per the UI-SPEC):

```css
/* ==========================================================================
   timer.css — Spawn Timer component styles
   Layered on top of /shared/theme.css tokens. Never redefines base tokens.
   ========================================================================== */

/* Layout: timer root */
.timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-md);
  min-height: calc(100vh - 200px);
}

@media (min-width: 768px) {
  .timer {
    max-width: 480px;
    margin-inline: auto;
    padding: var(--space-xl);
    gap: var(--space-2xl);
  }
}

/* Countdown display — the dominant element */
.timer__display {
  font-size: clamp(56px, 22vw, 112px);
  font-weight: 600;
  line-height: 1.0;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: var(--color-text-primary);
}

/* Cycle-end flash animation */
@keyframes timer-flash {
  0%   { color: var(--color-text-primary); }
  20%  { color: var(--color-accent); }
  100% { color: var(--color-text-primary); }
}
.timer__display.is-flashing {
  animation: timer-flash 300ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .timer__display.is-flashing { animation: none; }
}

/* Config panel */
.timer__config {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  width: 100%;
}

/* Config panel dimming while running/paused */
.timer[data-state="running"] .timer__config,
.timer[data-state="paused"]  .timer__config {
  opacity: 0.4;
  pointer-events: none;
}
.timer__config :is(input, button, [type="checkbox"]):disabled {
  cursor: not-allowed;
}

/* Input fields */
.timer__input {
  display: block;
  width: 100%;
  min-height: 44px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-primary);
  font-size: var(--text-body);
  padding: 0 var(--space-md);
  transition: border-color 150ms ease;
}
.timer__input:hover { border-color: var(--color-text-secondary); }
.timer__input:focus { border-color: var(--color-accent); }

/* Labels and helper text */
.timer__label {
  display: block;
  font-size: var(--text-label);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}
.timer__helper {
  display: block;
  font-size: var(--text-label);
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);
}
.timer__error {
  display: block;
  font-size: var(--text-label);
  color: var(--color-text-secondary);
  min-height: 1.4em;
  margin-top: var(--space-xs);
}

/* Control bar */
.timer__controls {
  display: flex;
  gap: var(--space-sm);
  width: 100%;
  margin-top: auto;
  padding-bottom: var(--space-md);
}
@media (min-width: 768px) {
  .timer__controls {
    margin-top: 0;
    padding-bottom: 0;
  }
}

/* Buttons — base */
.btn {
  min-height: 44px;
  padding: 0 var(--space-md);
  border-radius: 6px;
  font-size: var(--text-body);
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, opacity 150ms ease;
}
.btn:active { opacity: 0.9; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Primary button (Start, Resume) — jade fill */
.btn--primary {
  background: var(--color-accent);
  color: #0f1115;
  border-color: var(--color-accent);
  flex: 1;
}
.btn--primary:hover:not(:disabled) { filter: brightness(1.08); }

/* Secondary button (Pause) — surface-raised */
.btn--secondary {
  background: var(--color-surface-raised);
  color: var(--color-text-primary);
  border-color: var(--color-border);
  flex: 1;
}
.btn--secondary:hover:not(:disabled) { background: var(--color-surface-raised); }

/* Outline button (Reset) */
.btn--outline {
  background: transparent;
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}
.btn--outline:hover:not(:disabled) { background: var(--color-surface-raised); }

/* State-driven button visibility — JS also controls display via data-state */
.timer[data-state="idle"]     #btn-pause,
.timer[data-state="idle"]     #btn-resume,
.timer[data-state="idle"]     #btn-reset  { display: none; }

.timer[data-state="running"]  #btn-start,
.timer[data-state="running"]  #btn-resume { display: none; }

.timer[data-state="paused"]   #btn-start,
.timer[data-state="paused"]   #btn-pause  { display: none; }

.timer[data-state="finished"] #btn-pause,
.timer[data-state="finished"] #btn-resume { display: none; }

/* Cycle counter + state label */
.timer__cycle-counter {
  font-size: var(--text-label);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}
.timer__state-label {
  font-size: var(--text-label);
  color: var(--color-text-secondary);
}
.timer[data-state="running"] .timer__state-label {
  color: var(--color-accent);
}

/* Visually hidden (sr-only) — screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

### `games/where-winds-meet/tools/spawn-timer/spawn-timer.js` (ES module, event-driven)

**Analog:** Inline `<script>` blocks in `games/where-winds-meet/index.html` (lines 31–82) and `index.html` (lines 22–59) — these establish the project's JS conventions.

**Key conventions from existing inline scripts:**

JS module structure conventions (from `games/where-winds-meet/index.html` lines 31–84):
```javascript
// Comment header: describe what the function does + SECURITY note
// SECURITY: All values are static developer-defined literals.

// DOMContentLoaded is the entry point — all DOM wiring happens inside
document.addEventListener('DOMContentLoaded', function () {
  renderBreadcrumb(breadcrumbItems, 'breadcrumb');
  renderToolCards(tools, 'card-grid');
});
```

**Module file structure to author** — the full pattern for `spawn-timer.js`:

```javascript
// spawn-timer.js — Spawn Timer main ES module
// Owns: state machine, DOM wiring, AudioContext lifecycle, localStorage persistence.
// Timer tick delivery is delegated to timer.worker.js via postMessage.
// SECURITY: timer values are numbers only; DOM is updated via textContent not innerHTML.

// ── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'gametools.where-winds-meet.spawn-timer.state';
const SCHEMA_VERSION = 1;
const WORKER_PATH = '/games/where-winds-meet/tools/spawn-timer/timer.worker.js';
const TICK_INTERVAL_MS = 100;

// ── Module state ─────────────────────────────────────────────────────────────
let worker = null;
let audioCtx = null;

const state = {
  phase: 'idle',       // 'idle' | 'running' | 'paused' | 'finished'
  cycleEnd: null,      // Date.now() epoch ms — absolute wall-clock deadline
  pausedAt: null,      // Date.now() epoch ms — set on Pause
  cycleIndex: 0,       // 0-based current cycle
  totalCycles: 1,      // total cycles configured
  unlimited: false,    // true → infinite cycles
  durationMs: 0        // cycle duration in ms
};

// ── DOM refs (wired in init()) ────────────────────────────────────────────────
let timerRoot, timerDisplay, cycleCounter, stateLabel, timerAnnouncer;
let inputDuration, inputRepeat, inputUnlimited;
let errorDuration, errorRepeat;
let btnStart, btnResume, btnPause, btnReset;

// ── Entry point ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  // wire DOM refs
  // restore from localStorage if applicable
  // wire event listeners
});
```

**localStorage pattern** (from RESEARCH.md Pattern 6 — no analog in codebase yet, use research pattern verbatim):
```javascript
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

**`data-state` attribute as the state machine driver** (UI-SPEC §State Model — no analog in codebase, establish this pattern):
```javascript
// All visual state changes flow through setTimerState().
// CSS [data-state="..."] selectors handle visibility/opacity/color.
// JS never directly hides or shows individual buttons.
function setTimerState(phase) {
  state.phase = phase;
  timerRoot.dataset.state = phase;
}
```

**Worker creation pattern** (RESEARCH.md Pattern 1):
```javascript
function startWorker() {
  if (!worker) {
    worker = new Worker(WORKER_PATH);
    worker.onmessage = onWorkerMessage;
  }
  worker.postMessage({ cmd: 'start', intervalMs: TICK_INTERVAL_MS });
}

function stopWorker() {
  if (worker) {
    worker.postMessage({ cmd: 'stop' });
  }
}

function onWorkerMessage(e) {
  if (e.data.type === 'tick') {
    const remaining = state.cycleEnd - Date.now();
    if (remaining <= 0) {
      handleCycleEnd();
    } else {
      updateDisplay(remaining);
    }
  }
}
```

**AudioContext pattern** (RESEARCH.md Pattern 3 — must be called inside a gesture handler):
```javascript
function ensureAudioContext() {
  // MUST be called inside a user gesture (click handler)
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended' || audioCtx.state === 'interrupted') {
    audioCtx.resume().catch(() => {});
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && audioCtx) {
    audioCtx.resume().catch(() => {});
  }
});
```

**Beep pattern** (RESEARCH.md Pattern 4 — fresh OscillatorNode per call):
```javascript
function playBeep() {
  if (!audioCtx) return;
  if (audioCtx.state !== 'running') {
    audioCtx.resume().then(() => scheduleBeep()).catch(() => {});
    return;
  }
  scheduleBeep();
}

function scheduleBeep() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.3);
}
```

**Pause/Resume deadline shift pattern** (RESEARCH.md Pattern 5):
```javascript
function pauseTimer() {
  state.pausedAt = Date.now();
  stopWorker();
  setTimerState('paused');
}

function resumeTimer() {
  ensureAudioContext();  // gesture unlock — this IS the gesture
  // Shift deadline forward by pause duration so remaining time is preserved
  state.cycleEnd += Date.now() - state.pausedAt;
  state.pausedAt = null;
  saveTimerState(state);
  startWorker();
  setTimerState('running');
}
```

**Display formatter pattern** (RESEARCH.md Code Examples):
```javascript
function formatRemaining(ms) {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const ss = (totalSecs % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function updateDisplay(remaining) {
  timerDisplay.textContent = formatRemaining(remaining);
}
```

**Flash + screen reader pattern** (RESEARCH.md Code Examples):
```javascript
function flashDisplay() {
  timerDisplay.classList.add('is-flashing');
  timerDisplay.addEventListener('animationend', () => {
    timerDisplay.classList.remove('is-flashing');
  }, { once: true });
}

function announceToScreenReader(msg) {
  timerAnnouncer.textContent = '';
  requestAnimationFrame(() => { timerAnnouncer.textContent = msg; });
}
```

**Input parsing pattern** (RESEARCH.md Pattern 7):
```javascript
function parseDuration(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const colonMatch = trimmed.match(/^(\d{1,3}):(\d{2})$/);
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10);
    const secs = parseInt(colonMatch[2], 10);
    if (secs >= 60) return null;
    return (mins * 60 + secs) * 1000;
  }
  const secMatch = trimmed.match(/^\d+$/);
  if (secMatch) {
    const secs = parseInt(trimmed, 10);
    return secs > 0 ? secs * 1000 : null;
  }
  return null;
}
```

**Security conventions** (from existing inline scripts, `index.html` lines 26–27 and `games/where-winds-meet/index.html` lines 57–58):
```javascript
// SECURITY comment on any data array or function that touches the DOM.
// Always use textContent, never innerHTML for user-supplied or computed values.
// timerDisplay.textContent = formatRemaining(remaining); // CORRECT
// timerDisplay.innerHTML = formatRemaining(remaining);   // NEVER
```

---

### `games/where-winds-meet/tools/spawn-timer/timer.worker.js` (Web Worker, event-driven)

**Analog:** None — no Workers exist anywhere in this codebase.

**Pattern source:** RESEARCH.md Pattern 1 and Code Examples section. Use the research pattern verbatim.

```javascript
// timer.worker.js — Web Worker tick source for spawn-timer
// Owns: the setInterval that fires in background tabs without Chrome throttling.
// No DOM access, no AudioContext — pure message-passing only.
// Main thread sends { cmd: 'start', intervalMs: 100 } or { cmd: 'stop' }.
// Worker replies { type: 'tick' } on every interval.

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

**File naming convention:** `timer.worker.js` — all lowercase, matches Phase 1 convention for all filenames.

**Path used by main thread:**
```javascript
const WORKER_PATH = '/games/where-winds-meet/tools/spawn-timer/timer.worker.js';
// Root-absolute path — matches convention established by shared/theme.css, favicon.svg refs
```

---

## Shared Patterns

### Token Consumption (applies to timer.css)

**Source:** `shared/theme.css` lines 38–66 (`:root` token block) and lines 84–94 (`.site-header` as usage exemplar)

Every style rule in `timer.css` MUST reference tokens via `var(--token-name)`. The full set of available tokens:

```css
/* Colors */
var(--color-bg)              /* #0f1115 */
var(--color-surface)         /* #1a1d23 */
var(--color-surface-raised)  /* #22262f */
var(--color-border)          /* #2a2e38 */
var(--color-text-primary)    /* #e8e4d8 */
var(--color-text-secondary)  /* #9a9690 */
var(--color-accent)          /* #3fb98f jade — active because data-game="where-winds-meet" */
var(--color-accent-secondary) /* #d4af37 gold — reserved, not used in Phase 2 buttons */

/* Spacing */
var(--space-xs)   /* 4px */
var(--space-sm)   /* 8px */
var(--space-md)   /* 16px */
var(--space-lg)   /* 24px */
var(--space-xl)   /* 32px */
var(--space-2xl)  /* 48px */
var(--space-3xl)  /* 64px */

/* Typography */
var(--text-label)    /* 14px */
var(--text-body)     /* 16px */
var(--text-heading)  /* 20px */
/* --text-display (28px) is shell-only — NOT for timer components */
```

### HTML Shell Pattern (applies to index.html)

**Source:** All three existing HTML files — doctype, `<head>`, `<body data-game>`, `.site-header`, breadcrumb, `.site-footer` are identical across all pages.

Rules:
1. Root-absolute paths everywhere (`/shared/theme.css`, `/favicon.svg`, `/games/...`)
2. All filenames lowercase
3. `data-game="where-winds-meet"` on `<body>` to activate jade/gold tokens
4. `<link rel="stylesheet" href="/shared/theme.css">` first, then tool CSS after
5. `<script type="module" src="...">` for the main ES module (deferred by default — no `defer` attr needed)
6. Breadcrumb inline `<script>` retained as-is from existing stub

### Transition Convention (applies to timer.css buttons/inputs)

**Source:** `shared/theme.css` lines 134–138, 140–143
```css
transition: background 150ms ease, border-color 150ms ease;
/* active state: opacity: 0.9 */
/* hover: background to --color-surface-raised */
```

### Security Convention (applies to spawn-timer.js)

**Source:** All existing `<script>` blocks — `index.html` lines 26–27, `games/where-winds-meet/index.html` lines 57–58
```javascript
// SECURITY comment on any block that writes to the DOM or holds data.
// textContent only — never innerHTML for computed or user-controlled values.
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `timer.worker.js` | Web Worker | event-driven | No Web Workers exist anywhere in this codebase yet |

All patterns for this file come from RESEARCH.md (verified MDN sources). Use the research pattern verbatim — no adaptation needed.

---

## Metadata

**Analog search scope:** `E:\Projekty\GithubIO` — full repo (4 HTML files, 1 CSS file, 1 SVG favicon; no JS files exist yet)
**Files scanned:** 5 source files (index.html, shared/theme.css, games/where-winds-meet/index.html, games/where-winds-meet/tools/spawn-timer/index.html, favicon.svg)
**Pattern extraction date:** 2026-06-04
**Stack reality confirmed:** Plain static HTML + vanilla CSS + no build step. No Eleventy, no Tailwind, no package.json. The CLAUDE.md "recommended stack" describes an aspirational recommendation, not what was actually shipped in Phase 1. Phase 2 follows the Phase 1 convention exactly.
