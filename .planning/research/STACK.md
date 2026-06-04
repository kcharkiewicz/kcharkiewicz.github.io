# Stack Research

**Domain:** Static multi-page GitHub Pages hub hosting small interactive browser tools
**Researched:** 2026-06-04
**Confidence:** HIGH

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Eleventy (11ty) | 3.1.6 (stable) | Static site generator — builds the hub, game pages, and layout shell | Minimal, JS-native, zero client-side runtime cost; layouts + collections handle the hub→game→tool hierarchy cleanly; deploys as plain HTML to Pages with no config surprises; lighter than Astro for content-only pages |
| Nunjucks | bundled with Eleventy | HTML templating language for layouts and page scaffolding | Supported natively by Eleventy; mature syntax for includes, blocks, loops; clear enough to edit after a months-long break (important for a solo personal project) |
| Vanilla JavaScript (ES modules) | ES2022+ (no transpile needed) | All tool logic — timer engine, audio, localStorage | GitHub Pages serves static files; every target browser supports modules, `AudioContext`, and `localStorage` natively; zero build complexity for the interactive layer |
| Tailwind CSS | 4.x (v4.0 released Jan 2025) | Utility-first CSS for the dark/gamer theme | CSS-first config (`@theme` in CSS, no JS config file); auto-detects source files; pairs naturally with a dark palette and custom properties; standalone CLI option avoids a PostCSS pipeline if desired |
| GitHub Actions | N/A (platform) | CI/CD — build Eleventy and deploy to Pages | Native Pages integration via `actions/upload-pages-artifact` + `actions/deploy-pages`; only option when the source needs a build step (Eleventy → HTML) |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Web Audio API | Browser-native (no package) | Synthesise beep alert tones at cycle end | Use directly — no library needed; create an `OscillatorNode` per beep, connect to `GainNode` for ramp-down, discard node after `.stop()` |
| cssnano | 7.x | Minify compiled Tailwind CSS in production build | Add to the PostCSS pipeline in `eleventy.config.js`; optional but good for keeping CSS payload small |
| npm-run-all2 | 7.x | Run Eleventy and Tailwind watch processes in parallel during development | Only needed if you run Tailwind as a separate CLI process rather than inside Eleventy's `eleventy.before` hook |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Node.js 20 LTS | Eleventy runtime + build scripts | Eleventy 3 requires Node 18+; use 20 LTS for the GitHub Actions runner to match |
| @11ty/eleventy | 3.1.6 | The build tool itself | `npm install -D @11ty/eleventy` |
| @tailwindcss/postcss | 4.x | PostCSS plugin that drives Tailwind v4 | Replaces the old `tailwindcss` postcss plugin; import as `@tailwindcss/postcss` in config |
| postcss | 8.x | PostCSS runner invoked from `eleventy.before` | Required peer dep of `@tailwindcss/postcss` |
| Eleventy DevServer | bundled | Hot-reload dev server | Built into `eleventy --serve`; no separate server needed |

---

## Installation

```bash
# Core build tools
npm install -D @11ty/eleventy

# Tailwind v4 + PostCSS pipeline
npm install -D tailwindcss @tailwindcss/postcss postcss cssnano
```

No client-side npm packages. All interactive logic (timer, audio, localStorage) is plain ES module code served as static `.js` files.

---

## Concrete Approach: Hub Structure

```
src/
  _includes/
    layouts/
      base.njk        # <html>, <head>, nav shell
      game.njk        # extends base; game-page chrome
  _data/
    games.json        # [{id, name, slug, tools:[]}] — drives nav automatically
  index.njk           # hub landing page — lists games from collection
  games/
    where-winds-meet/
      index.njk       # game page — lists tools for this game
      timer.njk       # wraps the timer tool HTML
  assets/
    css/
      styles.css      # @import "tailwindcss"; + @theme { ... } dark palette
    js/
      timer.js        # self-contained ES module: timer engine + audio + localStorage
  _site/              # Eleventy output (gitignored; deployed by Actions)
```

Each game page is a folder; each tool is a page in that folder. Adding a new game = new folder + one entry in `games.json`. Adding a new tool = one new `.njk` file in the game folder. No rework of existing pages.

---

## Concrete Approach: Timer Logic (Drift Correction)

**Do not use `setInterval` alone.** `setInterval` accumulates drift because it schedules relative to when the previous callback completed, not to a fixed timeline. Over a 3-minute GvG spawn cycle the drift is imperceptible in isolation, but across 5–10 repeat cycles it becomes noticeable.

**Use recursive `setTimeout` with a deadline tracker:**

```javascript
class CycleTimer {
  #startTime = 0;
  #cycleMs = 0;
  #cycleCount = 0;
  #elapsed = 0;
  #timerId = null;

  start(durationMs, repeatCount, onTick, onCycleEnd) {
    this.#cycleMs = durationMs;
    this.#cycleCount = repeatCount;
    this.#startTime = performance.now();
    this.#schedule(durationMs, onTick, onCycleEnd);
  }

  #schedule(targetMs, onTick, onCycleEnd) {
    const tick = () => {
      const now = performance.now();
      const remaining = targetMs - (now - this.#startTime);
      onTick(remaining);

      if (remaining <= 0) {
        this.#elapsed++;
        if (this.#elapsed < this.#cycleCount) {
          // Reset deadline for next cycle, correcting for overshoot
          this.#startTime = now - (remaining * -1); // absorb overshoot
          this.#schedule(this.#cycleMs, onTick, onCycleEnd);
          onCycleEnd(this.#elapsed);
        } else {
          onCycleEnd(this.#elapsed); // final
        }
        return;
      }

      // Aim to tick at ~100ms intervals; correct delay for drift
      const nextDelay = Math.min(remaining, 100);
      this.#timerId = setTimeout(tick, nextDelay);
    };
    this.#timerId = setTimeout(tick, Math.min(targetMs, 100));
  }

  stop() { clearTimeout(this.#timerId); }
}
```

Key points:
- `performance.now()` not `Date.now()` — monotonic, unaffected by system clock changes
- Each `setTimeout` delay is recalculated from the gap to the fixed deadline, not from "now + interval"
- Overshoot (callback arrives 5ms late) is absorbed: the next cycle's deadline is anchored to the moment the cycle actually fired

---

## Concrete Approach: Audio Beep

Web Audio API, no library. `AudioContext` must be created or resumed inside a user gesture (browser autoplay policy):

```javascript
let audioCtx = null;

// Call this from the Start button click handler BEFORE starting the timer
function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playBeep(frequency = 880, durationMs = 200) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = frequency;
  osc.type = 'sine';
  // Ramp down to avoid click artifact
  gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + durationMs / 1000);
  // Nodes are garbage-collected after stop; new node per beep is correct behavior
}
```

Separate `AudioContext` per tool page is fine (one context per page lifetime). Never reuse `OscillatorNode` instances — create a new one per beep.

---

## Concrete Approach: localStorage Presets

```javascript
const STORAGE_KEY = 'wwm-timer-presets';

function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return []; // corrupted data — reset gracefully
  }
}

function savePresets(presets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

// Preset shape: { id: crypto.randomUUID(), name: "Camp A", durationMs: 180000, repeats: 5 }
```

Use `crypto.randomUUID()` for preset IDs — available in all modern browsers, no library needed.

---

## Concrete Approach: Tailwind Dark Theme

In `styles.css`:

```css
@import "tailwindcss";

@theme {
  /* Dark base palette */
  --color-bg:         #0d0f14;
  --color-surface:    #161b25;
  --color-border:     #2a3040;
  --color-text:       #e2e8f0;
  --color-muted:      #6b7280;
  --color-accent:     #38bdf8;   /* neon cyan — swap per game */
  --color-accent-glow: #38bdf880;

  /* Typography */
  --font-display: 'Rajdhani', system-ui, sans-serif;  /* Google Fonts — angular/gamer */
  --font-body:    'Inter', system-ui, sans-serif;
}

@layer base {
  html { background-color: var(--color-bg); color: var(--color-text); }
}
```

Per-game accent overrides: add an attribute or class on `<body>` (`data-game="wwm"`) and override `--color-accent` in a CSS layer rule for that game. No Tailwind config file needed.

---

## Concrete Approach: GitHub Actions Deployment

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

`package.json`:
```json
{
  "scripts": {
    "build": "npx eleventy",
    "dev": "npx eleventy --serve"
  }
}
```

Because this deploys to `kcharkiewicz.github.io` (user/org Pages root, not a project repo), no `--pathprefix` is needed. The site lives at `/`, not `/<repo>/`.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Eleventy 3 | Plain HTML/CSS/JS (no SSG) | If the site will forever be 2–3 pages with no shared layout; once you have 5+ pages a layout system pays for itself |
| Eleventy 3 | Astro | If tools need React/Svelte components or the site becomes a SPA; Astro's island architecture is overkill for timer widgets that are 50 lines of vanilla JS |
| Eleventy 3 | Vite + vanilla JS (no SSG) | If all tools are SPAs with heavy JS and no content pages; Vite is excellent for app builds but adds complexity to content-heavy multi-page sites |
| Tailwind v4 | Vanilla CSS with custom properties only | If Tailwind's build step feels heavy; a well-organized vanilla CSS file with `@layer` and custom properties works fine and has zero tooling — reasonable choice if you want to drop all devDependencies later |
| Tailwind v4 | Tailwind v3 | Never — v3 is in maintenance mode; v4 is the supported release with better performance and CSS-native config |
| Web Audio API (native) | Howler.js | If you need cross-browser audio format fallbacks, sprite sheets, or complex audio management; unnecessary for a single beep |
| recursive setTimeout | setInterval | Acceptable if timer duration is <30 seconds and you tolerate ~50ms drift; for 3+ minute cycles with 5+ repeats, use the deadline-corrected approach |
| GitHub Actions deploy | `gh-pages` npm package | If you want simpler setup and don't need the two-job workflow; either works, but native Actions is more transparent and has no extra dependency |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| React / Vue / Angular | Massive overkill for timer widgets; adds bundle complexity, hydration overhead, and a framework to keep updated indefinitely | Vanilla ES modules; 50 lines of JS per tool is more maintainable than a component tree |
| Jekyll (GitHub Pages default) | Ruby runtime, slower builds, liquid templating is less capable than Nunjucks; GitHub now recommends Actions over Jekyll's built-in deploy | Eleventy with GitHub Actions |
| `setInterval` alone for the timer | Accumulates drift; on a 180-second cycle repeated 5 times, drift can reach 200–500ms total | Deadline-tracked recursive `setTimeout` with `performance.now()` |
| `Date.now()` for measuring elapsed time | Susceptible to system clock adjustments (NTP sync, DST, user changes) mid-session | `performance.now()` — monotonic, sub-millisecond, unaffected by clock changes |
| Web Audio API sound files (.mp3/.wav) | Requires hosting audio assets, adds load time | Synthesised `OscillatorNode` — zero assets, instant, consistent |
| Tailwind CDN (Play CDN) in production | Scans at runtime, large payload, not for production | PostCSS build pipeline generating a minimal CSS output file |
| sessionStorage for presets | Clears when tab closes — defeats the purpose of presets | `localStorage` (persists across sessions) |
| IndexedDB for presets | Async API, far more complexity than needed for a few JSON objects | `localStorage` with `JSON.stringify`/`JSON.parse` — synchronous, simple, ample for preset data |
| Multiple `AudioContext` instances per session | Browsers may cap simultaneous contexts; some mobile browsers are strict | One `AudioContext` created on first user gesture, reused for all beeps |

---

## Stack Patterns by Variant

**If adding a tool that needs heavier interactivity (e.g. drag-and-drop, complex state):**
- Keep it as a vanilla ES module; use a lightweight state pattern (reducer function + `dispatchEvent`) before reaching for a framework
- The tool's `.njk` page stays a static shell; all logic is in a co-located `.js` module

**If adding a tool that is purely a reference table (no interaction):**
- Put the data in `_data/gamename-tooldata.json`; render entirely in Nunjucks; zero JavaScript needed

**If the site grows beyond ~10 games with many tools each:**
- Eleventy's collections and data cascade still handle this; no migration needed
- Consider adding an Eleventy Navigation plugin (`@11ty/eleventy-navigation`) for breadcrumbs

**If you want to drop all devDependencies and go zero-build:**
- Switch to raw HTML + `<link rel="stylesheet">` with a hand-rolled CSS file using custom properties
- Replace Tailwind utilities with a 200-line `base.css`
- Eleventy is still useful even then for layout deduplication; Tailwind is the optional part

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `@11ty/eleventy` | 3.1.6 | Node 18, 20, 22 | Use Node 20 LTS on Actions runner |
| `tailwindcss` | 4.x | PostCSS 8.x | v4 no longer uses `tailwind.config.js`; configure via `@theme` in CSS |
| `@tailwindcss/postcss` | 4.x | `tailwindcss` 4.x, `postcss` 8.x | This is the v4 PostCSS plugin; separate package from `tailwindcss` itself |
| `postcss` | 8.x | Node 18+ | Peer dependency of `@tailwindcss/postcss` |
| `cssnano` | 7.x | PostCSS 8.x | Optional minifier; include in production pipeline only |

---

## Sources

- [Eleventy v3.1.0 release announcement](https://www.11ty.dev/blog/eleventy-v3-1/) — version confirmed (3.1.6 stable, per docs fetch)
- [Eleventy Deployment Docs](https://www.11ty.dev/docs/deployment/) — GitHub Actions workflow structure
- [Eleventy Collections Docs](https://www.11ty.dev/docs/collections/) — tags-based collection system for hub→game hierarchy
- [Tailwind CSS v4.0 release blog](https://tailwindcss.com/blog/tailwindcss-v4) — v4 stable released Jan 22 2025; CSS-first config confirmed
- [Tailwind v4 PostCSS install docs](https://tailwindcss.com/docs/installation/using-postcss) — `@tailwindcss/postcss` package confirmed
- [How to Set Up Tailwind 4 With Eleventy 3](https://www.humankode.com/eleventy/how-to-set-up-tailwind-4-with-eleventy-3/) — `eleventy.before` hook integration pattern (MEDIUM confidence — community guide)
- [MDN Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — autoplay policy, `AudioContext` lifecycle (HIGH confidence — MDN official)
- [A Tale of Two Clocks — web.dev](https://web.dev/articles/audio-scheduling) — look-ahead scheduling technique for accurate audio (HIGH confidence — official Google/Chrome)
- [JavaScript accurate timer with drift correction](https://www.xjavascript.com/blog/in-javascript-how-to-create-an-accurate-timer-with-milliseconds/) — deadline-tracked `setTimeout` pattern (MEDIUM confidence — community article, pattern verified independently)
- [GitHub Pages custom workflows docs](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — Actions deployment structure (`configure-pages`, `upload-pages-artifact`, `deploy-pages`) (HIGH confidence — GitHub official docs)
- [Tailwind v4 standalone CLI discussion](https://github.com/tailwindlabs/tailwindcss/discussions/17638) — standalone executable option for zero-npm setup (MEDIUM confidence — GitHub discussion)

---

*Stack research for: Static GitHub Pages hub of browser game companion tools*
*Researched: 2026-06-04*
