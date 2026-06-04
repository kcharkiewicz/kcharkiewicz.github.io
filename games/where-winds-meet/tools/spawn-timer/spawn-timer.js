// spawn-timer.js — Spawn Timer main ES module
// Owns: state machine, DOM wiring, AudioContext lifecycle, localStorage persistence.
// Timer tick delivery is delegated to timer.worker.js via postMessage.
// SECURITY: timer values are numbers only; DOM is updated via textContent not innerHTML.

// ── Constants ─────────────────────────────────────────────────────────────────
export const STORAGE_KEY = 'gametools.where-winds-meet.spawn-timer.state';
export const SCHEMA_VERSION = 1;
export const WORKER_PATH = '/games/where-winds-meet/tools/spawn-timer/timer.worker.js';
export const TICK_INTERVAL_MS = 100;

// ── Pure functions (exported for node:test coverage) ─────────────────────────

/**
 * parseDuration(raw) — parse a user-supplied duration string.
 * Accepts MM:SS format or raw integer seconds.
 * Returns duration in milliseconds, or null if invalid.
 * SECURITY: input is validated to numeric values only; never rendered as HTML.
 *
 * @param {string} raw
 * @returns {number|null} milliseconds, or null for invalid input
 */
export function parseDuration(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;

  // MM:SS format — rejects seconds field >= 60
  const colonMatch = trimmed.match(/^(\d{1,3}):(\d{2})$/);
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10);
    const secs = parseInt(colonMatch[2], 10);
    if (secs >= 60) return null;           // e.g. "3:75" is invalid
    const total = mins * 60 + secs;
    return total > 0 ? total * 1000 : null; // "0:00" is invalid (zero duration)
  }

  // Raw seconds — rejects zero and negative
  const secMatch = trimmed.match(/^\d+$/);
  if (secMatch) {
    const secs = parseInt(trimmed, 10);
    return secs > 0 ? secs * 1000 : null;  // "0" is invalid
  }

  return null; // any other format
}

/**
 * formatRemaining(ms) — format remaining milliseconds as MM:SS.
 * Clamps at 0 (no negative display). Uses Math.ceil so 5500ms shows "00:06".
 *
 * @param {number} ms — remaining time in milliseconds
 * @returns {string} zero-padded "MM:SS" string
 */
export function formatRemaining(ms) {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const ss = (totalSecs % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

// ── Cycle / deadline helpers (exported for node:test coverage) ───────────────

/**
 * cycleLabel(cycleIndex, totalCycles, unlimited) — build the cycle counter string.
 * Returns "Cycle {N} / {total}" or "Cycle {N} / ∞" for unlimited mode.
 * SECURITY: all inputs are numbers/booleans; result written via textContent.
 *
 * @param {number} cycleIndex — 0-based current cycle
 * @param {number} totalCycles — total configured cycles (ignored when unlimited)
 * @param {boolean} unlimited — true → infinite cycles
 * @returns {string}
 */
export function cycleLabel(cycleIndex, totalCycles, unlimited) {
  const current = cycleIndex + 1;
  const total = unlimited ? '∞' : totalCycles;
  return `Cycle ${current} / ${total}`;
}

/**
 * resumeDeadline(cycleEnd, pausedAt, now) — shift the cycle deadline forward by
 * the pause duration so the remaining display is preserved exactly on resume.
 * Pattern 5 / Pitfall 7: cycleEnd += now - pausedAt
 *
 * @param {number} cycleEnd — original absolute epoch deadline (ms)
 * @param {number} pausedAt — epoch timestamp when Pause was pressed
 * @param {number} now — current epoch timestamp (Date.now() at Resume press)
 * @returns {number} adjusted epoch deadline
 */
export function resumeDeadline(cycleEnd, pausedAt, now) {
  return cycleEnd + (now - pausedAt);
}

/**
 * isLastCycle(cycleIndex, totalCycles, unlimited) — true if this is the final
 * cycle and the timer should transition to 'finished' after it ends.
 * Unlimited timers never return true.
 *
 * @param {number} cycleIndex — 0-based current cycle
 * @param {number} totalCycles — total configured cycles
 * @param {boolean} unlimited
 * @returns {boolean}
 */
export function isLastCycle(cycleIndex, totalCycles, unlimited) {
  return !unlimited && cycleIndex >= totalCycles - 1;
}

/**
 * missedCycles(elapsedMs, durationMs) — number of complete cycles that elapsed
 * in a given time window. Used for background-tab catch-up.
 * Guards against durationMs=0 (divide-by-zero).
 *
 * @param {number} elapsedMs — elapsed time in ms
 * @param {number} durationMs — cycle duration in ms
 * @returns {number} floor(elapsedMs / durationMs), or 0 if durationMs <= 0
 */
export function missedCycles(elapsedMs, durationMs) {
  if (durationMs <= 0) return 0;
  return Math.floor(elapsedMs / durationMs);
}

/**
 * parseRepeat(rawValue, unlimitedChecked) — validate the Repeat field.
 * Returns { unlimited: true } when the checkbox is checked.
 * Returns an integer >= 1 for valid finite input.
 * Returns null for any invalid input (0, negative, non-integer, empty).
 * SECURITY: input is validated to positive integer; no raw value rendered.
 *
 * @param {string} rawValue — the text/number input value
 * @param {boolean} unlimitedChecked — whether the Unlimited checkbox is checked
 * @returns {{ unlimited: true } | number | null}
 */
export function parseRepeat(rawValue, unlimitedChecked) {
  if (unlimitedChecked) return { unlimited: true };

  const trimmed = (rawValue || '').trim();
  if (!trimmed) return null;

  // Must be a plain integer (no decimal point, no sign characters)
  if (!/^\d+$/.test(trimmed)) return null;

  const n = parseInt(trimmed, 10);
  return n >= 1 ? n : null;
}

// ── Module state ──────────────────────────────────────────────────────────────
// Guards below ensure the runtime layer only wires up in a browser context.
// Node.js (node:test) imports the exported pure functions above without
// executing any DOM/Worker/AudioContext code.
if (typeof document !== 'undefined') {
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

  // ── DOM refs (wired in init()) ───────────────────────────────────────────────
  let timerRoot, timerDisplay, cycleCounter, stateLabel, timerAnnouncer;
  let inputDuration, inputRepeat, inputUnlimited;
  let errorDuration, errorRepeat;
  let btnStart, btnResume, btnPause, btnReset;

  // ── localStorage helpers ─────────────────────────────────────────────────────

  function loadTimerState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.schemaVersion !== SCHEMA_VERSION) return null;
      return data;
    } catch (e) {
      return null; // QuotaExceededError, JSON parse error, etc.
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

  // ── Visual state machine ─────────────────────────────────────────────────────

  function setTimerState(phase) {
    state.phase = phase;
    timerRoot.dataset.state = phase;
    // Update the state label text
    const labels = { idle: '', running: 'Running', paused: 'Paused', finished: 'Finished' };
    stateLabel.textContent = labels[phase] || '';
  }

  // ── Display update ───────────────────────────────────────────────────────────

  function updateDisplay(remaining) {
    timerDisplay.textContent = formatRemaining(remaining);
  }

  // ── Cycle counter ────────────────────────────────────────────────────────────

  function updateCycleCounter() {
    const total = state.unlimited ? '∞' : state.totalCycles;
    cycleCounter.textContent = `Cycle ${state.cycleIndex + 1} / ${total}`;
  }

  // ── Flash + screen reader ────────────────────────────────────────────────────

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

  // ── Web Worker ───────────────────────────────────────────────────────────────

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

  // ── Audio ────────────────────────────────────────────────────────────────────

  function ensureAudioContext() {
    // MUST be called inside a user gesture (click handler)
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended' || audioCtx.state === 'interrupted') {
      audioCtx.resume().catch(() => {});
    }
  }

  function scheduleBeep() {
    // Fresh OscillatorNode per call — stopped nodes cannot be restarted (MDN)
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 — clear, non-harsh

    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3); // 300ms beep with ramp-down
    // Node is garbage collected after .stop() fires — no manual cleanup needed
  }

  function playBeep() {
    if (!audioCtx) return; // guard: AudioContext not yet created
    if (audioCtx.state !== 'running') {
      // Attempt resume; schedule beep after resume completes (resume() is async)
      audioCtx.resume().then(() => scheduleBeep()).catch(() => {});
      return;
    }
    scheduleBeep();
  }

  // ── Cycle end handler ────────────────────────────────────────────────────────

  function handleCycleEnd() {
    stopWorker();
    playBeep();
    flashDisplay();
    announceToScreenReader('Cycle 1 complete');
    timerDisplay.textContent = '00:00';
    setTimerState('finished');
    saveTimerState({ ...state, phase: 'finished' });
  }

  // ── Input validation ─────────────────────────────────────────────────────────

  function clearErrors() {
    errorDuration.textContent = '';
    errorRepeat.textContent = '';
  }

  // ── Entry point ───────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    // Wire DOM refs
    timerRoot      = document.getElementById('timer');
    timerDisplay   = document.getElementById('timer-display');
    cycleCounter   = document.getElementById('cycle-counter');
    stateLabel     = document.getElementById('state-label');
    timerAnnouncer = document.getElementById('timer-announcer');
    inputDuration  = document.getElementById('input-duration');
    inputRepeat    = document.getElementById('input-repeat');
    inputUnlimited = document.getElementById('input-unlimited');
    errorDuration  = document.getElementById('error-duration');
    errorRepeat    = document.getElementById('error-repeat');
    btnStart       = document.getElementById('btn-start');
    btnResume      = document.getElementById('btn-resume');
    btnPause       = document.getElementById('btn-pause');
    btnReset       = document.getElementById('btn-reset');

    // AudioContext resume on tab visibility return (iOS Safari 'interrupted' state)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && audioCtx) {
        audioCtx.resume().catch(() => {});
      }
    });

    // ── Start button ────────────────────────────────────────────────────────────
    btnStart.addEventListener('click', () => {
      clearErrors();

      const rawDuration = inputDuration.value;
      const durationMs = parseDuration(rawDuration);

      if (durationMs === null) {
        // Distinguish empty vs invalid
        if (!rawDuration.trim()) {
          errorDuration.textContent = 'Enter a duration to start.';
        } else {
          errorDuration.textContent = 'Use MM:SS or a number of seconds (e.g. 3:00 or 180).';
        }
        return;
      }

      // Gesture unlock — MUST be synchronous inside the click handler
      ensureAudioContext();

      // Configure state
      state.durationMs   = durationMs;
      state.cycleIndex   = 0;
      state.totalCycles  = 1;  // single-cycle for plan 01; plan 02 wires repeat count
      state.unlimited    = false;
      state.cycleEnd     = Date.now() + durationMs;

      // Persist deadline shape (consumed for reload restore in plan 02)
      saveTimerState({
        phase: 'running',
        cycleEnd: state.cycleEnd,
        cycleIndex: state.cycleIndex,
        totalCycles: state.totalCycles,
        unlimited: state.unlimited,
        durationMs: state.durationMs
      });

      // Set visual state and render first frame
      setTimerState('running');
      updateCycleCounter();
      updateDisplay(durationMs);

      startWorker();
    });

    // ── Resume button (stub seam for plan 02) ───────────────────────────────────
    btnResume.addEventListener('click', () => {
      // Plan 02 wires pause/resume; leaving as a clean seam here
    });

    // ── Pause button (stub seam for plan 02) ────────────────────────────────────
    btnPause.addEventListener('click', () => {
      // Plan 02 wires pause/resume; leaving as a clean seam here
    });

    // ── Reset button (stub seam for plan 02) ────────────────────────────────────
    btnReset.addEventListener('click', () => {
      // Plan 02 wires full reset; leaving as a clean seam here
    });
  });
}
