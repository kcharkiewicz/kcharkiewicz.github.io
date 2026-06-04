<!-- GSD:project-start source:PROJECT.md -->

## Project

**kcharkiewicz.github.io — Game Tools Hub**

A personal, statically-hosted (GitHub Pages) hub of companion tools for video games. A landing page lists the games supported; each game has its own page collecting the tools for it. It starts with a single game — *Where Winds Meet* — and a single tool, and is built to grow game-by-game and tool-by-tool over time.

**Core Value:** The hosted tools must work reliably in the browser during real gameplay — the first one being a dependable GvG jungle spawn timer. If the rest of the site is bare, a tool that actually helps mid-match is the thing that matters.

### Constraints

- **Tech stack**: Must run as static files on GitHub Pages — no backend, server-side code, or database.
- **Persistence**: Any saved state (presets) must use client-side storage (e.g. localStorage); no remote storage.
- **Dependencies**: Keep dependencies light — a personal site that should stay easy to maintain and deploy.
- **Extensibility**: Adding a new game page or a new tool should not require restructuring existing pages.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

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

## Installation

# Core build tools

# Tailwind v4 + PostCSS pipeline

## Concrete Approach: Hub Structure

## Concrete Approach: Timer Logic (Drift Correction)

- `performance.now()` not `Date.now()` — monotonic, unaffected by system clock changes
- Each `setTimeout` delay is recalculated from the gap to the fixed deadline, not from "now + interval"
- Overshoot (callback arrives 5ms late) is absorbed: the next cycle's deadline is anchored to the moment the cycle actually fired

## Concrete Approach: Audio Beep

## Concrete Approach: localStorage Presets

## Concrete Approach: Tailwind Dark Theme

## Concrete Approach: GitHub Actions Deployment

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

## Stack Patterns by Variant

- Keep it as a vanilla ES module; use a lightweight state pattern (reducer function + `dispatchEvent`) before reaching for a framework
- The tool's `.njk` page stays a static shell; all logic is in a co-located `.js` module
- Put the data in `_data/gamename-tooldata.json`; render entirely in Nunjucks; zero JavaScript needed
- Eleventy's collections and data cascade still handle this; no migration needed
- Consider adding an Eleventy Navigation plugin (`@11ty/eleventy-navigation`) for breadcrumbs
- Switch to raw HTML + `<link rel="stylesheet">` with a hand-rolled CSS file using custom properties
- Replace Tailwind utilities with a 200-line `base.css`
- Eleventy is still useful even then for layout deduplication; Tailwind is the optional part

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `@11ty/eleventy` | 3.1.6 | Node 18, 20, 22 | Use Node 20 LTS on Actions runner |
| `tailwindcss` | 4.x | PostCSS 8.x | v4 no longer uses `tailwind.config.js`; configure via `@theme` in CSS |
| `@tailwindcss/postcss` | 4.x | `tailwindcss` 4.x, `postcss` 8.x | This is the v4 PostCSS plugin; separate package from `tailwindcss` itself |
| `postcss` | 8.x | Node 18+ | Peer dependency of `@tailwindcss/postcss` |
| `cssnano` | 7.x | PostCSS 8.x | Optional minifier; include in production pipeline only |

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

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
