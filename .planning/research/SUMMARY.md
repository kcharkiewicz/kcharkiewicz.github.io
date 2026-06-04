# Project Research Summary

**Project:** kcharkiewicz.github.io — Game Tools Hub
**Domain:** Static GitHub Pages multi-page hub hosting small interactive browser tools
**Researched:** 2026-06-04
**Confidence:** HIGH

---

## Executive Summary

This is a static GitHub Pages personal tools hub that starts with one game (Where Winds Meet) and one tool (a configurable repeating GvG jungle spawn timer). The central technical challenge is not the site structure, which is well-understood and straightforward, but the timer itself. A naive implementation will fail its primary use case in two concrete ways: tick-counting instead of wall-clock measurement causes cumulative drift that produces alerts several seconds late after 5+ minute runs, and Chrome background-tab throttling (Chrome 88+) can reduce a setInterval in a hidden tab to firing once per minute, stalling the countdown entirely while the user is in-game. Both failures are preventable with established patterns: wall-clock anchored timing using Date.now() or performance.now() as the source of truth on every tick, and a Web Worker to run the interval tick off the main thread.

The recommended approach is zero-build: plain HTML files, vanilla ES modules, and a hand-rolled CSS file using custom properties for theming. No Eleventy, no Tailwind, no build step, no Node toolchain. All four research files converge on a no-backend constraint, and three of them (ARCHITECTURE, FEATURES, PITFALLS) describe patterns that require no build step. STACK.md recommends Eleventy 3 + Tailwind CSS v4 + GitHub Actions CI, which is a defensible choice at larger scale, but for a solo personal site whose stated constraints prioritize light dependencies and easy maintenance, the build toolchain is a net liability: it introduces a Node.js runtime, npm dependencies to keep up to date, a GitHub Actions workflow to maintain, and a compile step that adds friction every time the developer returns to the project after a break. The no-build path delivers the identical end result (HTML files on GitHub Pages) with zero tooling overhead, works in every modern browser without transpilation, and can be deployed by pushing files directly to the Pages branch.

The key risks are all addressable with known patterns before the first line of timer code is written: create a fresh OscillatorNode per beep (single-use API), unlock the AudioContext inside the Start button click handler (autoplay policy), move the setInterval tick into a Web Worker (background throttling), wrap every localStorage call in try/catch (private-mode quota), and commit a .nojekyll file as the first commit with all-lowercase file and folder names (GitHub Pages/Jekyll behavior on Linux). None of these require research - they are well-documented, and the prevention is a matter of discipline rather than discovery.

---

## Build Path Decision: No-Build vs. Eleventy

**The tension:** STACK.md recommends Eleventy 3 + Tailwind CSS v4 + GitHub Actions. ARCHITECTURE.md recommends plain HTML + vanilla ES modules + .nojekyll, deployed directly.

**Resolution - Recommended path: plain HTML, no build step.**

The project constraints (keep dependencies light - a personal site that should stay easy to maintain and deploy) are the deciding factor. At v1 scope - one game, one tool, three HTML files, one CSS file, one JS module - a static site generator solves no real problem and adds: a Node.js version to manage, npm packages to keep current, a build command to remember, and a CI workflow to debug when it breaks. The no-build path delivers the identical end result with none of that overhead. ES module import statements with absolute paths (/shared/storage.js) replace layout inheritance cleanly. CSS custom properties replace Tailwind utility classes for theming. The registry-array-plus-card-renderer pattern in each index.html replaces Nunjucks collections.

**Fallback path: Eleventy 3 + Tailwind CSS v4**, when the inline registry arrays in hub/game pages grow unwieldy (rough threshold: 10+ games or 50+ tools). At that point layout deduplication justifies the build step. STACK.md workflow and file structure are accurate and ready to adopt then.

**Tradeoff in one sentence:** The build path trades zero tooling friction for layout inheritance and CSS utility classes that are unnecessary at v1 scale; adopt it only when the site outgrows inline registries.

---

## Cross-Cutting Non-Negotiables

The following requirements appeared across 3 or more research files and must be treated as hard constraints, not options:

| Requirement | Source Files | Classification |
|-------------|-------------|----------------|
| Wall-clock / drift-corrected timer - measure Date.now() minus cycleStart each tick, never count ticks | STACK, ARCHITECTURE, PITFALLS | P1 - implement from the first line of timer code |
| Web Audio AudioContext unlocked inside the Start button click handler, not on page load | STACK, ARCHITECTURE, PITFALLS | P1 - autoplay policy; silent failure otherwise |
| Fresh OscillatorNode created per beep, never reused | STACK, ARCHITECTURE, PITFALLS | P1 - single-use API; first cycle plays, all subsequent cycles silent if violated |
| Background-tab throttling mitigation via Web Worker | FEATURES, PITFALLS (STACK notes as alternative) | P1 - implement in timer core phase; not a safe deferral for a second-screen tool |
| localStorage namespaced with stable prefix (gametools.game.tool.key) | ARCHITECTURE, PITFALLS | P1 - prevents key collisions as tools grow |
| localStorage all calls wrapped in try/catch; schema version stored alongside data | PITFALLS | P1 - QuotaExceededError in Safari private mode crashes the app without this |
| .nojekyll committed to repo root as first file; all filenames all-lowercase | PITFALLS | P1 - Jekyll silently drops underscore-prefixed files; case-sensitivity 404s appear only on Linux (Pages), not locally |

**Web Worker classification:** FEATURES.md calls it P1 and a hard requirement for background-tab reliability. PITFALLS.md rates it MEDIUM effort with wall-clock anchoring as a partial fallback. Recommendation: implement the Web Worker in the same phase as the timer core. The tool is explicitly designed for second-screen use during live gameplay; the user will background the tab. The Worker is approximately 30 lines.

---

## Key Findings

### Recommended Stack

The complete toolchain for this project is: HTML files edited directly, vanilla JS ES modules (ES2022+), CSS custom properties in a single shared/theme.css file, and push-to-branch deployment on GitHub Pages with .nojekyll. No build step, no package manager for runtime code, no framework. The only external dependencies are optional web fonts.

**Core technologies:**
- Plain HTML files - hub index.html, game index.html, tool index.html; GitHub Pages serves directory index files cleanly at clean URLs with no routing config
- Vanilla ES modules - script type=module and ES import with absolute paths from site root (/shared/storage.js); works in all modern browsers without a bundler; native defer semantics
- CSS custom properties - all design tokens declared on :root in shared/theme.css; per-game accent override via a class or attribute on body; zero build step, computed at runtime
- Web Audio API (native) - synthesized OscillatorNode beep per alert; no audio files to host; AudioContext lazy-initialized on first user gesture
- GitHub Pages direct deploy - push to main; Pages serves files as-is once .nojekyll is in place; no Actions workflow required
- Web Worker - timer.worker.js runs setInterval off the main thread and posts tick messages; eliminates background-tab throttling

**If adopting the Eleventy fallback:** Node 20 LTS, @11ty/eleventy 3.1.6, Tailwind CSS 4.x (@tailwindcss/postcss plugin), GitHub Actions workflow with actions/upload-pages-artifact + actions/deploy-pages. No client-side npm packages in either path.

### Expected Features

**Must have (v1 - ship with the tool):**
- Configurable duration (MM:SS input) + repeat count (1-99 or unlimited)
- Start / pause / resume / reset controls with state-appropriate labels
- Audible alert at end of each cycle (Web Audio synthesized beep)
- Cycle counter display (Cycle N of M) - prominent, not footnote-size
- Large glanceable time display - dominates the layout; readable at arm length on a second screen
- Background-tab timer reliability (Web Worker)
- Save / load / delete named presets in localStorage
- Hub landing page to Where Winds Meet game page to Timer tool page (URL hierarchy: /, /games/where-winds-meet/, /games/where-winds-meet/tools/spawn-timer/)
- Dark gamer-themed visual style shared across all pages

**Should have (v1.x - add after validation):**
- Volume control / mute toggle (GainNode on Web Audio)
- Keyboard shortcuts (Space = pause/resume, R = reset, Enter = start)
- Rename preset in-place (inline edit)
- Up/down reorder for presets
- Subtle danger animation on time display in last 10 seconds (CSS keyframe, no JS)
- Screen Wake Lock API to prevent second-screen sleep on mobile

**Defer to v2+:**
- Multiple simultaneous timers (anti-feature for v1 - competing audio is confusing)
- Second game + tools (architecture must support it; do not ship it in v1)
- Search / filter on hub (relevant at 6+ tools)
- Audio choice / sound selection (2-4 bundled sounds)

### Architecture Approach

The site is a hierarchy of self-contained HTML pages linked by plain anchor elements. The hub page (/index.html) contains an inline JS array of games and a card renderer. Each game page (/games/slug/index.html) contains an inline array of tools and the same card renderer pattern. Each tool lives in its own directory with co-located CSS and JS files. Shared utilities live in /shared/ and are imported as ES modules using absolute paths. There is no inter-page state, no router, and no framework.

**Major components:**

1. Shared shell (shared/theme.css) - CSS custom properties for all design tokens; linked by every page; single source of truth for the dark theme
2. Shared storage utility (shared/storage.js) - namespaced localStorage wrapper with try/catch; all reads and writes routed through it
3. Shared audio utility (shared/audio.js) - Web Audio API beep helper; lazy AudioContext init; creates fresh OscillatorNode per call
4. Hub page (index.html) - registry array + card renderer; the entry point for the site
5. Game page (games/where-winds-meet/index.html) - same registry+renderer pattern one level down
6. Timer tool (games/where-winds-meet/tools/spawn-timer/) - three files: HTML markup, scoped CSS, JS that wires the timer state machine + Web Worker + preset CRUD + audio trigger

**localStorage key schema:** gametools.game-slug.tool-slug.data-key (e.g. gametools.wwm.spawn-timer.presets). Include schemaVersion field in stored preset objects from the start.

### Critical Pitfalls

1. **Timer drift from tick-counting** - never decrement a counter; always compute remaining = cycleEndTimestamp minus Date.now() on every tick. Fix in the first line of timer code. (PITFALLS Pitfall 1)

2. **Background-tab throttling stalls the timer** - Chrome 88+ throttles hidden-tab intervals to once per minute after 5 minutes. Move setInterval into a Web Worker. Combine with wall-clock anchoring and visibilitychange snap-correction. (PITFALLS Pitfall 2)

3. **Web Audio blocked by autoplay policy** - AudioContext starts in suspended state; audio silently fails without a prior user gesture. Create or resume() the context inside the Start button click handler. (PITFALLS Pitfall 3)

4. **Audio node single-use rule** - calling start() on a stopped OscillatorNode throws InvalidStateError; all cycles after the first are silent. Create a new node inside playBeep(), never at module level. (PITFALLS Pitfall 5)

5. **GitHub Pages / Jekyll / case-sensitivity** - .nojekyll in root prevents Jekyll from silently dropping files; all-lowercase filenames prevent Linux case-sensitivity 404s; git config core.ignorecase false prevents silent regressions on Windows/macOS. (PITFALLS Pitfalls 6, 7, 8)

6. **localStorage crashes in private mode** - Safari private browsing throws QuotaExceededError on setItem. Wrap every storage call in try/catch; treat persistence as best-effort; timer must function when storage is unavailable. (PITFALLS Pitfall 9)

---

## Implications for Roadmap

### Phase 1: Repository Foundation and Site Skeleton

**Rationale:** URL paths and .nojekyll must be established before any page is built - path conventions affect every internal link and cannot be changed without breaking bookmarks. GitHub Pages essentials must be in place before any asset structure is defined.

**Delivers:** A deployable (if sparse) site at kcharkiewicz.github.io with correct URL hierarchy, .nojekyll in place, all-lowercase file naming enforced, root-absolute asset paths documented as the project convention, hub and game page shells, and shared/theme.css with the full dark theme token set.

**Addresses features:** Hub landing page, game page shell, URL structure, dark themed visual style (tokens only)

**Avoids pitfalls:** Jekyll silently drops underscore files (Pitfall 6), case-sensitivity 404s (Pitfall 8), path confusion (Pitfall 7), CSS tokens scattered across pages (Architecture anti-pattern 1)

### Phase 2: Shared Utilities

**Rationale:** The timer tool depends on shared/storage.js and shared/audio.js. Building utilities before the tool means the tool imports working, tested modules rather than bundling raw localStorage and AudioContext calls inline. Both utilities are small and testable standalone in the browser console.

**Delivers:** shared/storage.js (namespaced localStorage wrapper with try/catch; schema version support), shared/audio.js (Web Audio beep helper; lazy AudioContext init; fresh OscillatorNode per call).

**Avoids pitfalls:** localStorage crash in private mode (Pitfall 9), schema migration breakage (Pitfall 10), audio node reuse bug (Pitfall 5), autoplay policy (Pitfall 3)

### Phase 3: Timer Core with Web Worker

**Rationale:** This is the primary value delivery. The timer must be built correctly on two non-negotiable axes: drift-corrected wall-clock timing and background-tab reliability via Web Worker. These are correctness requirements for a second-screen tool used during live gameplay. The Web Worker is approximately 30 lines and belongs in this phase.

**Delivers:** Fully functional timer at /games/where-winds-meet/tools/spawn-timer/ with configurable duration + repeat count, start/pause/resume/reset, wall-clock anchored tick via Web Worker, audible beep at each cycle end, cycle counter display, large glanceable time display, visibilitychange snap-correction when tab regains focus.

**Avoids pitfalls:** Timer drift (Pitfall 1), background throttling (Pitfall 2), autoplay policy (Pitfall 3 - AudioContext unlocked on Start click), audio node reuse (Pitfall 5 - fresh node per beep from shared/audio.js)

### Phase 4: Preset Persistence UI

**Rationale:** The timer is useful without presets for a single session, but re-entering duration and repeat count every session defeats the purpose. Presets come after a working timer because they enhance a running tool - the timer must work without them.

**Delivers:** Named preset CRUD UI wired to shared/storage.js: save current config as a named preset, load a preset (populates fields, does not auto-start), delete a preset (with confirmation). Presets persist across sessions. Graceful degradation when localStorage is unavailable.

**Avoids pitfalls:** localStorage crash in private mode (Pitfall 9), schema migration breakage (Pitfall 10)

### Phase 5: Polish and Second-Screen Hardening

**Rationale:** The core tool is functional and validated. This phase applies UX polish that makes it production-quality for real gameplay use and runs the full checklist from PITFALLS.md.

**Delivers:** Audio unlock state indicator, Screen Wake Lock API integration (acquire on start, release on stop, re-acquire on visibilitychange), document.title update on cycle completion, cache-busting query strings on asset URLs, complete PITFALLS.md checklist verification (5-minute wall-clock drift test, background-tab test, 5-cycle audio test, iOS silent mode test, private-mode test, case-sensitivity live-site audit).

**Avoids pitfalls:** Screen sleep on second screen (Pitfall 11), CDN caching stale assets (Pitfall 12), iOS silent switch (Pitfall 4 - surface as known limitation with UI callout)

### Phase Ordering Rationale

- Foundation before code: URL paths and .nojekyll must be locked first because they constrain every subsequent file location and link
- Shared utilities before the tool: both storage.js and audio.js are imported by the timer; building them first means the timer is written against a clean API
- Timer before presets: presets are an enhancement; the timer must work without them; separating phases keeps each reviewable
- Polish after validation: screen wake lock, cache-busting, and the full test checklist are final hardening, not core functionality

### Research Flags

Phases with standard, well-documented patterns - skip research-phase:
- **Phase 1 (Foundation):** GitHub Pages behavior and .nojekyll are thoroughly documented; CSS custom property theming is a standard pattern
- **Phase 2 (Shared Utilities):** Web Audio API and localStorage patterns are fully covered in the research files with concrete code examples; ready to implement directly
- **Phase 4 (Presets):** CRUD on a JSON array in localStorage is a standard pattern; research files contain ready-to-use implementation

Phase warranting careful implementation attention (not research, but discipline):
- **Phase 3 (Timer + Worker):** The Web Worker message-passing and visibilitychange snap-correction have several interacting moving parts. Use the concrete code examples from STACK.md and PITFALLS.md as starting points; validate against the PITFALLS.md checklist before marking done.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core recommendation (no-build) matches all project constraints; Eleventy fallback also well-documented with official sources |
| Features | HIGH | Timer mechanics, Web Audio API behavior, and background-tab throttling confirmed from Chrome Dev Blog and MDN; UX/accessibility details MEDIUM |
| Architecture | HIGH | No-build static site patterns are well-established; ES modules, CSS custom properties, and localStorage are standard browser APIs with authoritative MDN documentation |
| Pitfalls | HIGH | Timer drift, background throttling, and autoplay policy verified against Chrome Dev Blog, WebKit bug tracker, and MDN; GitHub Pages behavior verified against GitHub Docs |

**Overall confidence: HIGH**

### Gaps to Address

- **iOS silent switch (Pitfall 4):** The workaround (silent audio element to force media channel routing) requires a real iOS device to verify. Recommendation for Phase 5: implement a UI callout (disable silent mode for audio alerts on iOS) as the baseline; evaluate the swevans/unmute library only if iOS mobile use is confirmed common.

- **Web Worker as separate file vs. inline blob:** For GitHub Pages direct deploy (no build step), the Worker file must be a separate committed file with an absolute path from site root. Recommendation: separate timer.worker.js file for readability.

---

## Sources

### Primary (HIGH confidence)
- Chrome Dev Blog: Timer Throttling in Chrome 88 (https://developer.chrome.com/blog/timer-throttling-in-chrome-88) - background tab throttling behavior confirmed
- Chrome Dev Blog: Autoplay Policy in Chrome (https://developer.chrome.com/blog/autoplay) - AudioContext autoplay restriction confirmed
- MDN: Web Audio API Best Practices (https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) - AudioContext lifecycle, OscillatorNode single-use rule
- MDN: JavaScript Modules Guide (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) - ES module path requirements, type=module behavior
- MDN: Screen Wake Lock API (https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) - wake lock browser support confirmed (all major browsers including Safari iOS since 2021)
- MDN: Storage Quotas and Eviction (https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - private mode behavior confirmed
- GitHub Docs: Troubleshooting 404 errors for GitHub Pages - Jekyll/nojekyll behavior confirmed
- GitHub Docs: Custom Workflows with GitHub Pages - Actions deployment structure
- Tailwind CSS v4.0 release blog (https://tailwindcss.com/blog/tailwindcss-v4) - v4 stable released Jan 22 2025; CSS-first config confirmed
- SitePoint: Creating Accurate Timers in JavaScript (https://www.sitepoint.com/creating-accurate-timers-in-javascript/) - wall-clock drift correction technique

### Secondary (MEDIUM confidence)
- HackWild: More Accurate JavaScript Timers with Web Workers (https://hackwild.com/article/web-worker-timers/) - Worker timer pattern; Workers not subject to main-thread throttling
- Modern Web: Going Buildless (https://modern-web.dev/guides/going-buildless/es-modules/) - buildless ES module patterns
- CSS-Tricks: CSS Custom Properties and Theming (https://css-tricks.com/css-custom-properties-theming/) - runtime theming without build step
- WebKit Bug 237322 (https://bugs.webkit.org/show_bug.cgi?id=237322) - iOS Web Audio routed to ringer channel (open bug, no fix)
- swevans/unmute (https://github.com/swevans/unmute) - iOS silent switch workaround library
- Eleventy v3.1.0 release (https://www.11ty.dev/blog/eleventy-v3-1/) - version confirmation for Eleventy fallback path

---

*Research completed: 2026-06-04*
*Ready for roadmap: yes*
