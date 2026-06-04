# Feature Research

**Domain:** Browser-based game companion tools hub — configurable repeating countdown timer + multi-game hub index
**Researched:** 2026-06-04
**Confidence:** HIGH (timer mechanics, browser constraints, hub patterns); MEDIUM (UX/accessibility details)

---

## Feature Landscape

Features are grouped by area: **Timer Tool**, **Presets/Persistence**, **Hub/Navigation**, and **Theming/UX**.

---

### Area: Timer Tool

#### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Configurable duration (MM:SS or seconds input) | The whole point of the tool; without it there is no tool | LOW | Input validation needed; accept both `3:00` and `180` forms |
| Configurable repeat count (N cycles or infinite) | GvG use case requires N repeats; missing this forces manual restarts | LOW | Range: 1–99 + unlimited |
| Start / pause / resume | Universal timer expectation; pause = mid-game distraction management | LOW | Button label must change: "Start" → "Pause" → "Resume" |
| Reset / stop | Clears state and returns to config view; missing this = can't recover from mistakes | LOW | Confirm-on-reset if timer is mid-run is unnecessary friction — skip it |
| Audible alert at cycle end | Explicitly in PROJECT.md; sound is the v1 alert mechanism so the player doesn't have to watch the screen | MEDIUM | Requires user interaction before AudioContext can resume (browser autoplay policy — see Pitfalls) |
| Cycle counter display (cycle N of M) | Player needs to know how many repeats remain without reading small text | LOW | Show prominently; "Cycle 2 / 5" |
| Large, glanceable time display | Used on second screen / beside main monitor; must be readable at arm's length | LOW | Time display dominates the layout; never small |
| Timer continues correctly after tab switch | The single biggest reliability failure of naive browser timers | HIGH | **Must use Web Worker for the interval tick.** Chrome 88+ throttles chained `setInterval` in hidden tabs to once per minute after 5 min. Web Worker timers are not subject to main-thread throttling. Combine with `Date.now()` / `performance.now()` elapsed-time accounting to correct for any drift. |
| Visual indication of running vs. paused vs. finished states | Without this users cannot tell if the timer is ticking | LOW | Color, label, or animation change per state |

#### Differentiators (Nice Polish)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Edit duration/repeats while timer is running | Lets user correct a misconfiguration mid-match without resetting | MEDIUM | Tricky UX: "apply immediately" vs "apply next cycle"; recommend apply-next-cycle to avoid confusion |
| Keyboard shortcuts (Space = pause/resume, R = reset, Enter = start) | One-handed operation without leaving the game; players appreciate this | LOW | Must be documented on-screen (tooltip or footer); WCAG 2.1.4 requires ability to remap or disable single-key shortcuts — add a note in help text |
| "Extra wait between cycles" / configurable gap | Useful if spawn actually has a grace period; matches real-game nuance | LOW | Optional field, default 0 |
| Per-cycle progress bar or ring | Gives spatial sense of how far through the current cycle without reading numbers | LOW | CSS animation; nice but not essential |
| Volume control (slider or mute toggle) | Players have varying audio setups; full-volume alert on headphones during a tense fight is jarring | LOW | `GainNode` on Web Audio API; range 0–1; persist in localStorage |
| Audio choice (select from a few built-in sounds) | Different tones suit different players; a soft chime vs a hard beep vs a voice cue | MEDIUM | Keep to 2–4 bundled sounds (small static files); no user file upload in v1 |
| Fullscreen / focus mode (hides hub chrome) | When the timer is all that matters mid-match, surrounding nav is noise | LOW | CSS fullscreen or just hide header; browser Fullscreen API has iOS Safari limitations |
| Mobile-responsive layout (large touch targets) | Second-screen on phone is a real use case | MEDIUM | 44px minimum touch targets; time display scales with viewport; test at 375px wide |
| Overflow / overtime indicator (ran past 0) | Shows how long ago the cycle ended if user was distracted | LOW | Count up from zero after cycle end, highlighted in different color |

#### Anti-Features (Do NOT Build in v1)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multiple simultaneous timers | Players think they want to track multiple camps at once | Complex state management; competing audio alerts create confusion; most GvG use cases need one camp at a time | Use presets to quickly switch between camps |
| In-browser push/desktop notifications | Seems like a natural fallback to sound | Requires Notification permission prompt on first load, which feels hostile; desktop notifs appear over the game and break focus | Sound is sufficient; add visual flash in v1.x if requested |
| Browser extension | Richer game integration possible | Totally separate maintenance burden; defeats the "static site" architecture | Browser tab / second screen is good enough |
| Sync timer state across devices / guild members | Nice for coordinating a full guild | Requires backend WebSocket server; explicitly out of scope | Each player runs their own timer |
| Import/export timer configs as file | Power user feature | Adds real complexity (file parsing, validation) for minimal gain on a personal-use tool | Presets in localStorage cover the use case |

---

### Area: Presets / Persistence

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Save current config as a named preset | Without save, the user re-enters "3:00 / 5 cycles" on every session | LOW | Prompt for name; store in localStorage as JSON array |
| Load a preset (one click to populate fields) | Useless to save if loading is slow; must be instant | LOW | Click name → fields populate; do not auto-start |
| Delete a preset | Saved wrong value; must be able to clean up | LOW | Confirm-delete is appropriate here (destructive, irreversible within the session) |
| Presets persist across browser sessions | localStorage persists indefinitely; if it doesn't survive a refresh, it's broken | LOW | Serialize as JSON; read on page load |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Rename a preset in-place | Names like "Camp A" drift over time; quick rename without delete+recreate | LOW | Inline edit (double-click or pencil icon) |
| Reorder presets (drag or up/down buttons) | Most-used presets at the top reduces friction mid-match | MEDIUM | Drag-and-drop is HIGH complexity for minimal gain; up/down arrow buttons is LOW and sufficient |
| "Quick start" from preset (load + start in one click) | Saves two interactions; useful when re-using same preset every match | LOW | A play-button icon on the preset row alongside the load button |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Cloud sync of presets | Want presets on another machine | Requires backend, accounts; explicitly out of scope | Export/import is also deferred; accept localStorage-only for v1 |
| Preset categories / folders | "One for each camp" seems worth organizing | Over-engineers a list that will have 3–6 items for the vast majority of users | Plain list is fine; add if list grows beyond 10 |

---

### Area: Hub / Navigation

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Landing/index page listing supported games | The hub entry point; without it, every tool is a dead end | LOW | Card-based grid: game title, icon/thumbnail, brief description, link to game page |
| Per-game page aggregating that game's tools | Games accumulate multiple tools; a per-game page contains them | LOW | Simple list/card layout for tools; grows naturally |
| Consistent header / back-navigation | Users should always know where they are and be able to go up | LOW | Header: site title, breadcrumb or back link; minimal |
| Clear tool title and brief description on each tool page | Users linking from search or direct URL need context | LOW | H1 = tool name, one-sentence description below |
| URL structure that maps to the hierarchy | `/` = hub, `/{game}/` = game page, `/{game}/{tool}` = tool page | LOW | Enables bookmarking and direct links; matters for static GitHub Pages routing |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Game / tool status badges ("new", "beta", "experimental") | Signals freshness and manages expectations for incomplete tools | LOW | CSS badge only; no dynamic data |
| Search / filter across tools on hub page | Useful once there are 6+ tools across 3+ games | LOW | Client-side filter on tool name/tags; not needed at v1 with one game |
| "Jump to tool" deeplink from hub (anchor or direct URL) | Power users bookmark individual tools, not hub | LOW | Already covered by clean URL structure |
| Game favicon / icon in browser tab per game page | Small polish; helps identify tabs when multiple are open | LOW | 16×16 or SVG favicon |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Search engine with tags, filters, sorting | Makes sense at 20+ tools | Significant build; zero users at v1 | Plain visual layout is discoverable enough at small scale |
| Announcements / changelog feed on hub | "What's new" seems useful | Content maintenance overhead; static site means manual updates | GitHub releases or a simple "last updated" date is sufficient |
| User accounts / personalization | Customized home page per user | Requires backend; explicitly out of scope | localStorage preferences only |

---

### Area: Theming / UX

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Dark theme | Game companion tools are universally dark; a light theme would look wrong in a dark gaming environment | LOW | CSS custom properties for all colors; dark by default |
| Readable contrast at ambient game-room lighting | Dark doesn't mean low contrast; time display must be crisp | LOW | WCAG AA minimum (4.5:1 ratio for text); aim for AAA on time display |
| Consistent visual language across hub and tool pages | Feels like one product, not cobbled pages | LOW | Shared CSS file / design tokens; header is the same component |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Themed accent color per game | Where Winds Meet gets a different feel from a hypothetical future game | LOW | CSS custom property overridden per game page |
| Subtle idle animation on time display (pulse on alert, glow on last 10 seconds) | Reinforces the audio alert visually; "danger" state is obvious at a glance | LOW | CSS keyframe animation; no JS needed |
| Favicon that reflects the hub identity | Tab is identifiable | LOW | SVG preferred for crispness at 16px |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User-selectable themes (light / dark toggle) | Accessibility benefit | Adds configuration surface; the user base is exactly one person who wants dark | Prefers-color-scheme media query as a fallback is enough |
| Heavy animations / particle effects | "Gaming aesthetic" | Performance on low-end second-screen devices; distracting during play | Use subtle CSS transitions only |
| Background music / ambient sound | Immersive feel | Extremely intrusive; competes with game audio; triggers autoplay restrictions immediately | Don't do this |

---

## Feature Dependencies

```
[Background-tab reliability (Web Worker timer)]
    └──required by──> [Timer core: start/pause/resume/reset]
                          └──required by──> [Audible alert at cycle end]
                          └──required by──> [Cycle counter display]

[User interaction on page (click Start)]
    └──required by──> [Audible alert]
                          (Web Audio API: AudioContext must be resumed inside a user gesture)

[Save preset]
    └──required by──> [Load preset]
    └──required by──> [Delete preset]
    └──required by──> [Rename preset]      (enhances)
    └──required by──> [Reorder presets]    (enhances)
    └──required by──> [Quick start from preset] (enhances)

[Hub landing page]
    └──required by──> [Per-game page]
                          └──required by──> [Tool page (timer)]

[Dark theme / CSS design tokens]
    └──required by──> [Consistent visual language across pages]
    └──enhances──>    [Themed accent per game]
```

### Dependency Notes

- **Web Worker timer is a hard requirement for background-tab reliability:** Moving the tick to a Worker is the only proven workaround for Chrome 88+ intensive throttling (once per minute after 5 minutes hidden). The Worker posts elapsed-time messages to the main thread; the main thread updates DOM only. Pair with `Date.now()` elapsed accounting to self-correct drift.
- **Audible alert requires user interaction first:** The Web Audio API `AudioContext` starts in `suspended` state in all modern browsers. It must be resumed inside a user-gesture handler (the "Start" button click is the natural trigger). Attempting to play sound on the first cycle without a prior interaction will silently fail. The "Start" button click serves as the gesture.
- **Preset operations form a sequential dependency chain:** Save must work before any other preset operation is possible. Implement and ship save+load+delete as a unit; rename and reorder are v1.x enhancements.
- **Hub URL structure must be decided before any page is built:** Path conventions (`/where-winds-meet/spawn-timer`) affect every internal link; changing them later breaks bookmarks.

---

## MVP Definition

### Launch With (v1)

- [x] Timer: configurable duration + repeat count — the core job
- [x] Start / pause / resume / reset controls — universal baseline
- [x] Audible alert at end of each cycle — the primary hands-free feedback mechanism
- [x] Cycle counter display (N of M) — orientation during a match
- [x] Large, glanceable time display — second-screen readability
- [x] Background-tab reliability via Web Worker — without this the tool fails its primary use case
- [x] Save / load / delete named presets in localStorage — avoids re-entering config every session
- [x] Hub landing page → Where Winds Meet page → Timer tool page (URL hierarchy) — minimum navigation shell
- [x] Dark, gamer-themed visual style, consistent across all pages — ships as part of v1 per PROJECT.md

### Add After Validation (v1.x)

- [ ] Volume control / mute — add when the "too loud" complaint appears
- [ ] Audio choice (2–4 sounds) — add after confirming sound mechanism works reliably
- [ ] Rename preset in-place — low effort, noticeable quality boost
- [ ] Up/down reorder for presets — add once list has more than 3 entries
- [ ] Keyboard shortcuts (Space / R / Enter) — low effort; add as second pass
- [ ] Edit config while running — nice if misconfiguration during a match is reported
- [ ] Subtle danger animation (glow/pulse on last 10 seconds) — polish pass

### Future Consideration (v2+)

- [ ] Multiple simultaneous timers — defer until a concrete multi-camp use case is validated
- [ ] Mobile fullscreen / PWA install prompt — defer until mobile use is confirmed common
- [ ] Second game + tools — by design; architecture must support it, not the v1 feature set
- [ ] Search / filter on hub page — only relevant at 6+ tools

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Timer core (duration, repeats, start/pause/reset) | HIGH | LOW | P1 |
| Web Worker background-tab reliability | HIGH | MEDIUM | P1 |
| Audible alert at cycle end | HIGH | MEDIUM | P1 |
| Large glanceable display + cycle counter | HIGH | LOW | P1 |
| Presets: save / load / delete | HIGH | LOW | P1 |
| Hub + game page + tool page URL structure | HIGH | LOW | P1 |
| Dark themed visual style | MEDIUM | LOW | P1 |
| Volume control / mute | MEDIUM | LOW | P2 |
| Audio choice | MEDIUM | MEDIUM | P2 |
| Keyboard shortcuts | MEDIUM | LOW | P2 |
| Rename / reorder presets | MEDIUM | LOW | P2 |
| Edit while running | MEDIUM | MEDIUM | P2 |
| Danger animation (last 10 s glow) | LOW | LOW | P2 |
| Quick start from preset | MEDIUM | LOW | P2 |
| Mobile responsive layout | MEDIUM | MEDIUM | P2 |
| Game status badges on hub | LOW | LOW | P3 |
| Themed accent per game | LOW | LOW | P3 |
| Multiple simultaneous timers | LOW | HIGH | P3 |
| Fullscreen/focus mode | LOW | LOW | P3 |

---

## Competitor Feature Analysis

| Feature | GW2Timer (gw2timer.com) | online-stopwatch Loop Countdown | RepTimer (interval workout) | Our Approach |
|---------|-------------------------|--------------------------------|-----------------------------|--------------|
| Repeating countdown | YES (auto-scheduled events) | YES (loop + wait between) | YES (rounds) | YES — user sets count |
| Audio alerts | YES (chimes, speech, desktop notifs) | YES | YES | YES — Web Audio, bundled sounds |
| Configurable wait between cycles | N/A (fixed schedule) | YES | YES (rest time) | v1.x enhancement |
| Presets / saved routines | NO (game-schedule driven) | YES (save & share via URL) | YES | YES — localStorage, named |
| Keyboard shortcuts | PARTIAL | Space to pause; L to skip | UNKNOWN | v1.x |
| Background-tab reliability | YES (event-driven, not setTimeout) | UNKNOWN | UNKNOWN | YES — Web Worker required |
| Mobile responsive | YES | YES | YES | YES — second-screen use case |
| Multi-timer simultaneous | NO | NO | NO | NO — anti-feature for v1 |
| Hub / multi-game navigation | N/A (single game) | N/A (generic tool) | N/A | YES — hub + per-game pages |

---

## Key Findings on Background-Tab Timer Reliability

This is the most technically consequential feature for this project and the primary failure mode of naive implementations.

**The problem (confirmed HIGH confidence from Chrome developer blog):**
- Chrome 88+ applies three throttling tiers to JavaScript timers on hidden pages.
- After 5 minutes hidden + 5+ chained setInterval iterations + 30 seconds silence: timers fire at most once per minute.
- A 3-minute GvG spawn timer running in a background tab will completely miss its callback.

**The solution (confirmed MEDIUM-HIGH confidence from multiple sources):**
1. Move all timer tick logic into a `Web Worker`. Workers run on a separate thread not subject to main-thread throttling.
2. Inside the Worker, use `setInterval` combined with `Date.now()` delta accounting to correct for any residual drift.
3. Worker posts elapsed time or "cycle complete" messages to the main thread via `postMessage`.
4. Main thread updates the DOM only (Workers cannot touch the DOM).

**Implementation note:** The "Start" button click serves as both the Web Audio API user-gesture unlock and the Worker initialization trigger. No additional interaction required.

---

## Sources

- Chrome Developers — Timer Throttling in Chrome 88: https://developer.chrome.com/blog/timer-throttling-in-chrome-88
- HackWild — More Accurate JavaScript Timers with Web Workers: https://hackwild.com/article/web-worker-timers/
- MDN — Autoplay guide for media and Web Audio APIs: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- MDN — Web Audio API best practices: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- AccessDesigns — Accessible Countdown Timers WCAG Guide: https://www.accessdesigns.net/tutorials/countdown-timers
- WCAG 2.1.4 (Character Key Shortcuts): https://wcag.dock.codes/documentation/wcag211/
- online-stopwatch.com Loop Countdown: https://www.online-stopwatch.com/loop-countdown/
- GW2Timer.com (ArenaNet-recommended GW2 tool): https://gw2timer.com/
- Sqlpey — Bypassing Browser Timer Throttling: https://sqlpey.com/javascript/bypassing-browser-timer-throttling/
- Pontis Technology — Why setInterval drifts in inactive tabs: https://pontistechnology.com/learn-why-setinterval-javascript-breaks-when-throttled/

---
*Feature research for: Video game companion tools hub — GvG spawn timer (Where Winds Meet) + hub navigation*
*Researched: 2026-06-04*
