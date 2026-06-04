# Architecture Research

**Domain:** Static client-side GitHub Pages hub — multi-page game tool site
**Researched:** 2026-06-04
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser / GitHub Pages                 │
├──────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐   │
│  │  Shared Shell Layer  (shared/theme.css, shared/ui.js) │   │
│  │  CSS custom properties, nav, focus, font import       │   │
│  └───────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌────────────────────────────────┐   │
│  │   Hub Page      │    │   Game Page (per game)         │   │
│  │   index.html    │    │   games/where-winds-meet/      │   │
│  │                 │    │   index.html                   │   │
│  │  game-registry  │    │                                │   │
│  │  .js (inline)   │    │  tool-registry.js (inline)     │   │
│  │  renders cards  │    │  renders tool cards            │   │
│  └─────────────────┘    └────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐   │
│  │                 Tool Modules (per tool)                │   │
│  │  games/where-winds-meet/tools/spawn-timer/            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │   │
│  │  │timer.html│  │timer.css │  │timer.js            │  │   │
│  │  │ (markup) │  │ (scoped) │  │ engine + UI + audio│  │   │
│  │  └──────────┘  └──────────┘  └────────────────────┘  │   │
│  └───────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐   │
│  │                 Persistence Layer                      │   │
│  │  localStorage — namespaced per tool                    │   │
│  │  "gametools.wwm.spawn-timer.presets"  → JSON array    │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Shared shell (`shared/theme.css`) | CSS custom properties (colors, spacing, font), base reset, dark theme tokens | Single flat CSS file linked from every page |
| Shared utilities (`shared/storage.js`) | Namespaced localStorage wrapper; exposes `get/set/getAll/remove` with key prefix | ES module, `<script type="module">` |
| Hub page (`index.html`) | Lists supported games as cards; links each to its game page | Inline `<script type="module">` or small inline `registry.js` that renders from a JS array |
| Game page (`games/<slug>/index.html`) | Lists tools for that game as cards; links each to its tool page | Same pattern as hub: small inline registry array |
| Tool module (`games/<slug>/tools/<slug>/`) | Self-contained: markup, scoped CSS, JS engine with state machine, audio, preset UI | Three files: `index.html` + `<slug>.css` + `<slug>.js`; no external deps |
| Timer engine (inside tool JS) | State machine + drift-corrected tick + cycle tracking | Plain class or module-pattern JS object |
| Audio module (inside tool JS or `shared/audio.js`) | Generate alert beep via Web Audio API — no file assets needed | `AudioContext` + `OscillatorNode` + `GainNode`, lazy-init on first user gesture |
| Preset manager (inside tool JS, uses storage util) | CRUD for named presets; persisted to namespaced localStorage | Simple functions operating on a JSON array; no framework |

---

## Recommended Project Structure

```
/ (repo root)
├── index.html                          # Hub landing page — lists games
├── .nojekyll                           # Disables Jekyll, serves files as-is
├── shared/
│   ├── theme.css                       # CSS custom properties + base styles (linked by every page)
│   ├── storage.js                      # Namespaced localStorage wrapper (ES module)
│   └── audio.js                        # Web Audio API beep helper (ES module)
├── games/
│   └── where-winds-meet/
│       ├── index.html                  # WWM game page — lists WWM tools
│       └── tools/
│           └── spawn-timer/
│               ├── index.html          # Timer tool: full page markup
│               ├── spawn-timer.css     # Tool-scoped styles (imported or linked)
│               └── spawn-timer.js      # Timer engine + preset UI + audio trigger
└── assets/
    ├── fonts/                          # Web fonts if self-hosted
    └── images/                         # Hub logo, game thumbnails
```

### Why This Layout

- **`/index.html` at root** — required by GitHub Pages; the hub is the entry point.
- **`games/<slug>/index.html`** — GitHub Pages serves `/games/where-winds-meet/` cleanly via directory index without any routing config.
- **`games/<slug>/tools/<slug>/index.html`** — same convention; each tool is its own URL and a complete self-contained page.
- **`shared/`** — the only cross-page dependencies; intentionally thin (3 files at most for v1). Every page links `theme.css` and imports `storage.js`/`audio.js` as needed.
- **No `src/` or `dist/`** — there is no build step. What's in the repo is what gets served.
- **`.nojekyll`** — required to prevent GitHub Pages from treating underscore-prefixed folders and bare HTML files through Jekyll's pipeline.

### Adding a New Game (Zero-Rework)

1. Create `games/<new-game>/index.html` (copy game page shell).
2. Add one entry to the game registry array in `/index.html`.
3. Done. No shared file needs structural change.

### Adding a New Tool to an Existing Game (Zero-Rework)

1. Create `games/<game>/tools/<new-tool>/` with three files.
2. Add one entry to the tool registry array in `games/<game>/index.html`.
3. Done.

---

## Architectural Patterns

### Pattern 1: Registry Array — Inline Data, Generated Cards

**What:** Each hub or game page keeps a small JS array literal of `{ name, slug, description, url }` objects. A short rendering function turns that array into card elements and appends them to the page. No external fetch, no build-time template.

**When to use:** Always, for all hub and game pages. The list changes only when a game or tool is added, and editing one array line is the total cost.

**Trade-offs:** The array lives inside the HTML file (or a tiny `registry.js` imported by it), not in a CMS. Acceptable for a personal site with tens of games at most.

**Example:**

```javascript
// In index.html <script type="module"> or registry.js
const GAMES = [
  { name: "Where Winds Meet", slug: "where-winds-meet",
    description: "GvG jungle spawn timers and tools.",
    url: "/games/where-winds-meet/" }
];

function renderCards(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map(item => `
    <a class="card" href="${item.url}">
      <h2>${item.name}</h2>
      <p>${item.description}</p>
    </a>
  `).join('');
}

renderCards(GAMES, 'game-list');
```

### Pattern 2: ES Modules for Shared Utilities, No Bundler

**What:** `shared/storage.js` and `shared/audio.js` are loaded with `<script type="module" src="/shared/storage.js">` or imported from tool scripts via `import { get, set } from '/shared/storage.js'`. Paths are absolute from site root (`/shared/...`) so they work from any nesting depth.

**When to use:** Any cross-page utility. Native ES modules are supported in all modern browsers. No bundler, no `node_modules`, no build step required.

**Trade-offs:** Bare module specifiers (`import 'lodash'`) don't work without an import map or bundler — not a problem here since all utilities are local files. Module scripts are always deferred, which is fine for tool pages.

**Example:**

```javascript
// shared/storage.js — the namespace wrapper
const PREFIX = 'gametools';

export function storageKey(toolId, key) {
  return `${PREFIX}.${toolId}.${key}`;
}

export function getItem(toolId, key) {
  return JSON.parse(localStorage.getItem(storageKey(toolId, key)));
}

export function setItem(toolId, key, value) {
  localStorage.setItem(storageKey(toolId, key), JSON.stringify(value));
}
```

```javascript
// In spawn-timer.js — uses the wrapper
import { getItem, setItem } from '/shared/storage.js';

const TOOL_ID = 'wwm.spawn-timer';

function loadPresets() {
  return getItem(TOOL_ID, 'presets') ?? [];
}
function savePresets(presets) {
  setItem(TOOL_ID, 'presets', presets);
}
```

### Pattern 3: CSS Custom Properties for Theming — Single Source of Truth

**What:** `shared/theme.css` declares all design tokens as CSS custom properties on `:root`. Every page links only this one CSS file for theming. Tool pages additionally link their own scoped CSS file for layout specifics.

**When to use:** Always. Custom properties are live, inherited, and computed at runtime — no build step, no preprocessor, no duplication.

**Trade-offs:** Custom properties cascade, so deeply nested tools can accidentally inherit or override tokens. Mitigate with scoped selectors (`.tool-spawn-timer { --accent: ... }`) for per-tool overrides.

**Example:**

```css
/* shared/theme.css */
:root {
  --color-bg:       #0d0f14;
  --color-surface:  #1a1d26;
  --color-border:   #2e3347;
  --color-accent:   #c9a84c;     /* gold */
  --color-text:     #e8e8e8;
  --color-muted:    #7a8099;
  --font-display:   'Cinzel', serif;
  --font-body:      'Inter', sans-serif;
  --radius-card:    8px;
  --spacing-md:     16px;
}
```

```html
<!-- Every page head -->
<link rel="stylesheet" href="/shared/theme.css">
<link rel="stylesheet" href="spawn-timer.css">   <!-- tool-specific only on tool pages -->
```

### Pattern 4: Timer State Machine with Drift Correction

**What:** The timer engine is a plain JS object (or class) that tracks state explicitly. Time is measured by wall-clock delta (`Date.now() - startedAt`) on every `setInterval` tick, not by counting ticks. This makes drift impossible: even if a tick fires late, the displayed time corrects itself on the next tick.

**When to use:** Any countdown or interval timer. This is the canonical technique — setInterval fires the callback but the callback reads actual elapsed time.

**States:**

```
IDLE → [user clicks Start] → RUNNING
RUNNING → [tick: remaining reaches 0 AND cycles remain] → CYCLE_COMPLETE
CYCLE_COMPLETE → [auto after alert] → RUNNING  (next cycle)
RUNNING → [tick: remaining reaches 0 AND no cycles remain] → DONE
RUNNING → [user clicks Stop] → IDLE
DONE → [user clicks Reset] → IDLE
```

**State object:**

```javascript
const timer = {
  state: 'IDLE',        // 'IDLE' | 'RUNNING' | 'CYCLE_COMPLETE' | 'DONE'
  durationMs: 0,        // configured cycle length
  totalCycles: 1,       // configured repeat count (0 = infinite)
  cyclesDone: 0,        // cycles completed so far
  startedAt: null,      // Date.now() when current cycle began
  remainingMs: 0,       // display value, recomputed each tick
};
```

**Drift-corrected tick:**

```javascript
let intervalId = null;

function startTick() {
  timer.startedAt = Date.now();
  intervalId = setInterval(() => {
    const elapsed = Date.now() - timer.startedAt;
    timer.remainingMs = Math.max(0, timer.durationMs - elapsed);

    if (timer.remainingMs <= 0) {
      handleCycleEnd();
    } else {
      renderDisplay(timer.remainingMs);
    }
  }, 250); // 4x/sec is enough for seconds display; corrects within 250ms
}

function handleCycleEnd() {
  clearInterval(intervalId);
  timer.cyclesDone += 1;
  playAlert();

  const infinite = timer.totalCycles === 0;
  if (infinite || timer.cyclesDone < timer.totalCycles) {
    timer.state = 'CYCLE_COMPLETE';
    renderDisplay(0);
    // Brief pause then auto-restart next cycle
    setTimeout(() => {
      timer.state = 'RUNNING';
      startTick();
    }, 800);
  } else {
    timer.state = 'DONE';
    renderDisplay(0);
  }
}
```

**Why 250ms interval:** Display updates 4× per second, which is visually smooth for a seconds-granularity countdown. The drift window is at most 250ms — irrelevant for a GvG spawn timer measured in minutes.

### Pattern 5: Web Audio API Alert — No File Assets

**What:** Generate a short beep sound programmatically via `AudioContext` + `OscillatorNode` + `GainNode`. No audio file to host. The `AudioContext` must be created (or resumed) in response to a user gesture; lazy-init on first Start click handles this cleanly.

**When to use:** Any in-page alert sound on a static site. Avoids hosting `.mp3`/`.ogg` files and codec compatibility issues.

**Trade-offs:** The AudioContext autoplay restriction requires a prior user gesture. Since the timer only starts via a Start button click, this is naturally satisfied.

**Example (in `shared/audio.js`):**

```javascript
let ctx = null;

function getAudioContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function playBeep({ frequency = 880, duration = 0.15, volume = 0.6 } = {}) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}
```

---

## Data Flow

### Timer Tool: Config to Alert

```
User Input (duration, repeat count, preset name)
    │
    ▼
Preset UI  ──save──▶  localStorage (namespaced JSON)
    │                       │
    │ load                  │ load on page open
    ▼                       ▼
Timer Config Object  ◀──────┘
    │
    │ [Start button click — satisfies AudioContext gesture requirement]
    ▼
Timer Engine (state machine)
    │  setInterval tick (250ms)
    │  remainingMs = durationMs − (Date.now() − startedAt)
    ▼
Display Renderer  ──formats MM:SS──▶  DOM (#display element)
    │
    │ [remainingMs ≤ 0]
    ▼
Cycle-End Handler
    ├──▶ audio.playBeep()   (Web Audio API)
    ├──▶ cyclesDone++
    └──▶ state transition (CYCLE_COMPLETE → RUNNING or DONE)
```

### Preset Data Flow

```
Preset array (in-memory) ◀──▶ Preset Manager
    │                              │
    │ renderPresets()              │ savePresets()
    ▼                              ▼
Preset list DOM             localStorage
                            key: "gametools.wwm.spawn-timer.presets"
                            value: JSON array of { name, durationMs, cycles }
```

### localStorage Key Schema

```
gametools.<game-slug>.<tool-slug>.<data-key>

Examples:
  gametools.wwm.spawn-timer.presets
  gametools.wwm.spawn-timer.lastUsed
```

Rules:
- `gametools` — site-wide prefix, never collides with third-party scripts.
- `<game-slug>` — short stable identifier (e.g. `wwm` for Where Winds Meet).
- `<tool-slug>` — stable identifier (e.g. `spawn-timer`).
- `<data-key>` — semantic name for the data record.
- All tools use `getItem`/`setItem` from `shared/storage.js`; nothing calls `localStorage` directly.

---

## Build Order (Suggested)

This is a vertical MVP order — each step produces something runnable in the browser.

| Step | What to Build | Rationale |
|------|---------------|-----------|
| 1 | `shared/theme.css` with CSS custom properties | Every subsequent page depends on it; build once, use everywhere |
| 2 | Hub `index.html` with game registry array + card renderer | Establishes the shell, navigation, and the registry drop-in pattern |
| 3 | `games/where-winds-meet/index.html` with tool registry | Proves the hub→game-page link and the same drop-in pattern one level down |
| 4 | `shared/storage.js` (namespaced localStorage wrapper) | Required by preset manager; testable standalone in browser console |
| 5 | `shared/audio.js` (Web Audio beep) | Required by timer end-of-cycle; testable standalone with a button |
| 6 | `games/where-winds-meet/tools/spawn-timer/` — timer engine + UI | First complete vertical slice: config → engine → alert + display |
| 7 | Preset CRUD UI wired to storage.js | Adds persistence; comes after the timer works without it |

**Why this order:** Theme first means no unstyled flash at any step. Hub and game page shells come next so the tool has a real URL home by the time it is built. Shared utilities before the tool because the tool imports them. Presets last because they are an enhancement — the timer must work without them.

---

## Anti-Patterns

### Anti-Pattern 1: Inline Styles / Per-Page CSS Variables

**What people do:** Define `--color-accent` inside each page's `<style>` block or per-page CSS file.

**Why it's wrong:** Changing the dark theme means editing every page. Two pages drift apart visually.

**Do this instead:** All tokens in `shared/theme.css` on `:root`. Per-page files only contain layout and component rules that are genuinely local.

### Anti-Pattern 2: Raw localStorage Access Scattered in Tool Code

**What people do:** Call `localStorage.setItem('presets', ...)` directly at the point of use.

**Why it's wrong:** Key naming is inconsistent. Two tools accidentally use the same key. Migrating key names later requires a grep across all tool files.

**Do this instead:** Route all reads and writes through `shared/storage.js`. The wrapper owns the key schema; tools pass only their tool ID and record name.

### Anti-Pattern 3: Counting Ticks Instead of Measuring Wall-Clock Time

**What people do:** Decrement a counter variable by 1 each `setInterval` tick and display it.

**Why it's wrong:** If the browser throttles the tab (unfocused), ticks slow down. A 3-minute timer can lose 7+ seconds over its run. For a GvG spawn timer, this is a real in-match error.

**Do this instead:** Store `startedAt = Date.now()` when each cycle begins. Each tick computes `remaining = durationMs - (Date.now() - startedAt)`. The display is always accurate regardless of tick regularity.

### Anti-Pattern 4: One Mega Page with Hidden/Shown Panels per Tool

**What people do:** Put all tools for a game on a single page and toggle visibility with CSS.

**Why it's wrong:** Page weight grows unboundedly. No clean URLs per tool. URL sharing is impossible. Scroll position and browser back/forward behave poorly.

**Do this instead:** Each tool is a separate page (`/games/<game>/tools/<tool>/`). GitHub Pages handles the routing for free via directory index files. Linking between tools is a plain `<a href>`.

### Anti-Pattern 5: CDN-Loaded Framework for Simple State

**What people do:** Import React, Vue, or Alpine.js from a CDN to manage the timer's state.

**Why it's wrong:** Adds a dependency that can go stale, rate-limit, or change URL. For a timer with five states and two UI bindings, a framework is overkill and a liability on a long-lived personal site.

**Do this instead:** A plain JavaScript object with explicit state, `querySelector` for DOM reads, and `textContent`/`classList` for DOM writes. Fifty lines of code with zero dependencies outlasts any framework version.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Pages | Push to `main`; Pages serves files at `kcharkiewicz.github.io` | No build config needed; add `.nojekyll` to suppress Jekyll |
| Web fonts (e.g. Google Fonts) | `@import` in `shared/theme.css` or `<link>` in `<head>` | Optional — can self-host fonts in `assets/fonts/` for offline reliability |
| Web Audio API | In-browser API, no CDN or file | Lazy-init `AudioContext` on first user gesture (Start button click) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Hub page ↔ Game page | Plain `<a href>` hyperlink | No JS required; each page is a full document |
| Game page ↔ Tool page | Plain `<a href>` hyperlink | Same; tools are separate pages not components |
| Tool JS ↔ shared/storage.js | ES module import (`import { getItem, setItem } from '/shared/storage.js'`) | All tool pages use absolute path from site root |
| Tool JS ↔ shared/audio.js | ES module import | Lazy `AudioContext` init inside `audio.js`; tool only calls `playBeep()` |
| Timer engine ↔ Preset UI | Direct function calls within same tool JS file | Both live in `spawn-timer.js`; no inter-module event bus needed at this scale |
| Timer engine ↔ DOM | Direct `document.querySelector` + `textContent`/`classList` in render functions | No virtual DOM; simple enough that direct manipulation is clearer |

---

## Scaling Considerations

This is a personal static site. "Scaling" means adding more games and tools, not traffic.

| Growth Stage | Architecture Adjustment |
|--------------|------------------------|
| 1 game, 1-3 tools | Current structure — no changes |
| 2-5 games, 5-15 tools | Same structure. Registry arrays stay manageable. Consider extracting registry data to a shared `registry.json` fetched at runtime if the inline arrays exceed ~20 entries. |
| 10+ games, 50+ tools | Move registry data to `registry.json`; hub and game pages fetch and render dynamically. Consider a minimal build step (e.g. 11ty) only at this point. Still no backend. |
| Cross-tool shared state | Add a `shared/events.js` with a tiny pub/sub (3 lines) if tools on the same game page need to communicate. Not needed in v1. |

**First bottleneck:** The inline registry array in `index.html` and game `index.html` grows verbose. Fix: extract to a fetched JSON file and keep the renderer function. Still zero build step.

**Not a bottleneck until very late:** CSS file size, JS module count, audio API performance — none of these are concerns for a personal tool site.

---

## Sources

- [MDN: JavaScript Modules Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) — ES module path requirements, `type="module"` behavior (HIGH confidence)
- [Modern Web: Going Buildless — ES Modules](https://modern-web.dev/guides/going-buildless/es-modules/) — buildless module patterns, `import.meta.url` for asset paths (HIGH confidence)
- [GitHub Community: Best Practices for Multi-Page GitHub Pages Repos](https://github.com/orgs/community/discussions/147721) — folder structure recommendations (MEDIUM confidence)
- [SitePoint: Creating Accurate Timers in JavaScript](https://www.sitepoint.com/creating-accurate-timers-in-javascript/) — wall-clock drift correction technique (HIGH confidence)
- [HackWild: More Accurate JavaScript Timers with Web Workers](https://hackwild.com/article/web-worker-timers/) — Web Workers only needed when tab is inactive; active tabs fine with setInterval (HIGH confidence)
- [Medium: Namespace localStorage](https://medium.com/@emadalam/namespace-localstorage-e2d1d2e68b20) — prefix + wrapper module pattern (MEDIUM confidence)
- [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — AudioContext, OscillatorNode, GainNode, autoplay policy (HIGH confidence)
- [CSS-Tricks: CSS Custom Properties and Theming](https://css-tricks.com/css-custom-properties-theming/) — runtime theming without build step (HIGH confidence)
- [DHH: Modern Web Apps Without JavaScript Bundling](https://world.hey.com/dhh/modern-web-apps-without-javascript-bundling-or-transpiling-a20f2755) — rationale for buildless approach (MEDIUM confidence)

---
*Architecture research for: Static GitHub Pages game tools hub*
*Researched: 2026-06-04*
