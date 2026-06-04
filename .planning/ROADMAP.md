# Roadmap: kcharkiewicz.github.io — Game Tools Hub

**Created:** 2026-06-04
**Milestone:** v1
**Granularity:** Standard
**Mode:** mvp
**Coverage:** 28/28 requirements mapped

---

## Phases

- [x] **Phase 1: Site Foundation + Hub Shell** — Deployable site at kcharkiewicz.github.io with hub, game page, URL hierarchy, dark theme tokens, and favicon (completed 2026-06-04)
- [ ] **Phase 2: Timer Core** — Fully working GvG spawn timer with drift-corrected Web Worker timing, audible alert, and glanceable display
- [ ] **Phase 3: Preset Manager** — Named preset CRUD persisted in defensive namespaced localStorage
- [ ] **Phase 4: Audio Controls** — Volume/mute control and bundled sound selection, both persisted
- [ ] **Phase 5: Second-Screen Polish** — Responsive layout, touch targets, and hardened second-screen reliability

---

## Phase Details

### Phase 1: Site Foundation + Hub Shell

**Goal**: A real, live, bookmarkable site is deployed at kcharkiewicz.github.io with the correct URL hierarchy, dark theme applied consistently, and a drop-in extensibility pattern that requires zero rework when adding future games or tools.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: SITE-01, SITE-02, HUB-01, HUB-02, HUB-03, HUB-04, HUB-05, THEME-01, THEME-02, THEME-03
**Success Criteria** (what must be TRUE):

  1. User can reach the hub landing page at kcharkiewicz.github.io and see a game card for Where Winds Meet that links to /games/where-winds-meet/
  2. User can navigate from the hub to the Where Winds Meet game page and back, with a consistent header and back-navigation on every page
  3. Every page, asset link, and internal URL works on the live GitHub Pages deployment (no 404s, no Jekyll-dropped files, all-lowercase paths)
  4. Adding a second game to the hub requires only inserting one entry into the games registry array — no structural changes to existing files
  5. The site renders with the dark gamer-themed visual style and the Where Winds Meet accent color, with a custom favicon in the browser tab

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Walking-skeleton spine: .nojekyll guard, shared theme tokens + accent mechanism, favicon, hub landing page with registry/card renderer

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Full hierarchy: WWM game page with breadcrumb + tools registry, drop-in cover SVG, themed spawn-timer stub page (no 404)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Deploy + verify: case audit, push, enable GitHub Pages, live curl smoke tests, drop-in extensibility check

**UI hint**: yes

### Phase 2: Timer Core

**Goal**: The GvG spawn timer is a fully working tool accessible at its canonical URL, with accuracy and background-tab reliability sufficient for live gameplay use.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: TIMER-01, TIMER-02, TIMER-03, TIMER-04, TIMER-05, TIMER-06, TIMER-07, TIMER-08, ALERT-01, ALERT-02, THEME-05
**Success Criteria** (what must be TRUE):

  1. User can enter a duration (MM:SS or seconds) and a repeat count (including unlimited), click Start, and see a large glanceable countdown that updates in real time
  2. User can pause, resume, and reset the timer at any point; the timer display and controls reflect the correct state (running / paused / finished) visually
  3. An audible beep fires at the end of every cycle including the first, even after a hard page refresh, and fires reliably on all subsequent cycles (no silent cycles)
  4. The cycle counter shows the correct current/total cycle (e.g. "Cycle 2 / 5") and the timer keeps accurate time when the browser tab is backgrounded for 2+ minutes
  5. The time display is readable at arm's length and meets WCAG AA contrast requirements

**Plans**: 2 plans
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Core countdown slice: fill in timer markup + component CSS + main ES module + Web Worker; enter duration → Start → glanceable drift-corrected countdown → beep + jade flash at zero (single cycle); node:test for duration parsing/formatting

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 02-02-PLAN.md — Controls + multi-cycle + persistence slice: repeat/unlimited + live cycle counter, pause/resume (deadline-preserving), reset, full running/paused/finished state model, hard-refresh restore + corrupt-storage safety, background-tab catch-up; node:test for cycle/deadline math

**UI hint**: yes

### Phase 3: Preset Manager

**Goal**: Users can save, load, and delete named timer configurations that survive browser restarts, without any risk of the preset feature crashing the timer.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: PRESET-01, PRESET-02, PRESET-03, PRESET-04
**Success Criteria** (what must be TRUE):

  1. User can type a preset name, click Save, and see the preset appear in the preset list immediately
  2. User can click a preset to load it, which populates the duration and repeat-count fields without auto-starting the timer
  3. User can delete a preset and it is removed from the list
  4. Presets survive a browser restart — a preset saved today is available in a new session tomorrow
  5. Opening the timer page in Safari Private Browsing does not crash the page; the timer works normally and presets are silently unavailable

**Plans**: TBD

### Phase 4: Audio Controls

**Goal**: Users have meaningful control over alert audio — they can mute, adjust volume, and choose from bundled sounds — with those preferences remembered across sessions.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: ALERT-03, ALERT-04
**Success Criteria** (what must be TRUE):

  1. User can adjust alert volume with a slider and mute it with a toggle; the setting takes effect on the next alert and persists after a page reload
  2. User can choose from 2–4 bundled alert sounds; the chosen sound plays at the next cycle end and the choice is remembered across sessions

**Plans**: TBD
**UI hint**: yes

### Phase 5: Second-Screen Polish

**Goal**: The timer is production-ready for its primary use context: a phone propped as a second screen during live gameplay, operated with large touch targets, with the screen staying on for the duration of a match.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: THEME-04
**Success Criteria** (what must be TRUE):

  1. User can operate the timer on a phone with one thumb — all interactive controls (Start, Pause, Reset, preset buttons) have touch targets large enough to tap confidently without looking closely
  2. The timer layout is usable on narrow phone screens (320px+) without horizontal scrolling or overlapping elements
  3. The phone screen does not go dark while the timer is running (Screen Wake Lock acquired on Start, released on Stop)

**Plans**: TBD
**UI hint**: yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Site Foundation + Hub Shell | 3/3 | Complete    | 2026-06-04 |
| 2. Timer Core | 1/2 | In Progress|  |
| 3. Preset Manager | 0/? | Not started | - |
| 4. Audio Controls | 0/? | Not started | - |
| 5. Second-Screen Polish | 0/? | Not started | - |

---

*Roadmap created: 2026-06-04*
*Last updated: 2026-06-04 after Phase 2 planning (2 plans created)*
