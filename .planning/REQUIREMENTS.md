# Requirements: kcharkiewicz.github.io — Game Tools Hub

**Defined:** 2026-06-04
**Core Value:** The hosted tools must work reliably in the browser during real gameplay — starting with a dependable GvG jungle spawn timer.

## v1 Requirements

Requirements for the initial release. Each maps to roadmap phases.

### Site & Deployment

- [ ] **SITE-01**: Site is deployed to GitHub Pages and reachable at kcharkiewicz.github.io
- [x] **SITE-02**: Static delivery is robust against GitHub Pages pitfalls (`.nojekyll` present, all-lowercase paths, case-consistent links)

### Hub & Navigation

- [x] **HUB-01**: User sees a landing page listing supported games as cards, each linking to that game's page
- [ ] **HUB-02**: User sees a Where Winds Meet game page listing its tools, each linking to the tool's page
- [ ] **HUB-03**: User has consistent header and back/up navigation on every page
- [ ] **HUB-04**: URLs map to the hierarchy (`/`, `/where-winds-meet/`, `/where-winds-meet/spawn-timer/`) so any page is bookmarkable
- [x] **HUB-05**: A new game page or tool can be added as a drop-in registry entry without restructuring existing pages

### Timer

- [ ] **TIMER-01**: User can set a countdown duration (accepts MM:SS or seconds)
- [ ] **TIMER-02**: User can set how many times the countdown repeats (finite count, with an unlimited option)
- [ ] **TIMER-03**: User can start, pause, and resume the timer
- [ ] **TIMER-04**: User can reset/stop the timer back to the configuration state
- [ ] **TIMER-05**: User sees a large, glanceable countdown display readable at arm's length
- [ ] **TIMER-06**: User sees a cycle counter showing the current cycle of the total (e.g. "Cycle 2 / 5")
- [ ] **TIMER-07**: User sees a clear visual indication of running vs. paused vs. finished states
- [ ] **TIMER-08**: Timer keeps accurate time and continues correctly while the browser tab is in the background (drift-corrected wall-clock timing via a Web Worker)

### Alert / Audio

- [ ] **ALERT-01**: An audible alert plays at the end of each cycle
- [ ] **ALERT-02**: Audio reliably plays on the first and subsequent cycles by unlocking on the Start-button user gesture (fresh oscillator/source per beep)
- [ ] **ALERT-03**: User can adjust alert volume and mute it, with the setting persisted
- [ ] **ALERT-04**: User can choose from 2–4 bundled alert sounds, with the choice persisted

### Presets

- [ ] **PRESET-01**: User can save the current timer configuration as a named preset
- [ ] **PRESET-02**: User can load a preset to populate the timer fields in one click
- [ ] **PRESET-03**: User can delete a preset
- [ ] **PRESET-04**: Presets persist across browser sessions via namespaced localStorage with defensive read/write (try/catch + schema version)

### Theme / UX

- [x] **THEME-01**: Dark, gamer-themed visual style applied consistently across hub, game, and tool pages
- [x] **THEME-02**: Per-game accent color (Where Winds Meet) layered over the base dark theme
- [x] **THEME-03**: Custom SVG favicon reflecting the hub identity
- [ ] **THEME-04**: Responsive layout with large touch targets, usable on a phone as a second screen
- [ ] **THEME-05**: Readable contrast (WCAG AA minimum) with a crisp, high-contrast time display

## v2 Requirements

Deferred to a future release. Tracked but not in the current roadmap.

### Timer

- **TIMER-V2-01**: Configurable gap/grace period between cycles
- **TIMER-V2-02**: Keyboard shortcuts (Space = pause/resume, R = reset, Enter = start)
- **TIMER-V2-03**: Edit duration/repeats while the timer is running (apply next cycle)
- **TIMER-V2-04**: Danger animation (glow/pulse on the last 10 seconds) and per-cycle progress ring
- **TIMER-V2-05**: Overtime/overflow indicator (counts up past zero)
- **TIMER-V2-06**: Fullscreen / focus mode that hides hub chrome

### Presets

- **PRESET-V2-01**: Rename a preset in place
- **PRESET-V2-02**: Reorder presets (up/down)
- **PRESET-V2-03**: Quick-start (load + start a preset in one click)

### Hub

- **HUB-V2-01**: Status badges ("new" / "beta") on game and tool cards
- **HUB-V2-02**: Client-side search/filter across tools (relevant once 6+ tools exist)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multiple simultaneous timers | Complex state + competing audio alerts; presets cover fast camp-switching for v1 |
| Desktop / push notifications | Permission prompts feel hostile; notifications break game focus — sound is sufficient |
| Live multi-user / guild timer sync | Requires a backend/WebSocket server — violates the static-only constraint |
| Cross-device / cloud preset sync | Requires accounts + backend; localStorage-only is acceptable for a personal tool |
| Import/export configs as files | File parsing/validation complexity for minimal gain on a personal tool |
| User accounts / login | No identity needed; tools are personal and local |
| Browser extension | Separate maintenance burden; defeats the static-site architecture |
| Light theme toggle | User base is one person who wants dark; `prefers-color-scheme` fallback is enough |
| Background music / ambient sound | Intrusive, competes with game audio, triggers autoplay restrictions |
| Additional games beyond Where Winds Meet | Architecture must support them, but v1 ships one game end-to-end |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SITE-01 | Phase 1 | Pending |
| SITE-02 | Phase 1 | Complete |
| HUB-01 | Phase 1 | Complete |
| HUB-02 | Phase 1 | Pending |
| HUB-03 | Phase 1 | Pending |
| HUB-04 | Phase 1 | Pending |
| HUB-05 | Phase 1 | Complete |
| THEME-01 | Phase 1 | Complete |
| THEME-02 | Phase 1 | Complete |
| THEME-03 | Phase 1 | Complete |
| TIMER-01 | Phase 2 | Pending |
| TIMER-02 | Phase 2 | Pending |
| TIMER-03 | Phase 2 | Pending |
| TIMER-04 | Phase 2 | Pending |
| TIMER-05 | Phase 2 | Pending |
| TIMER-06 | Phase 2 | Pending |
| TIMER-07 | Phase 2 | Pending |
| TIMER-08 | Phase 2 | Pending |
| ALERT-01 | Phase 2 | Pending |
| ALERT-02 | Phase 2 | Pending |
| THEME-05 | Phase 2 | Pending |
| PRESET-01 | Phase 3 | Pending |
| PRESET-02 | Phase 3 | Pending |
| PRESET-03 | Phase 3 | Pending |
| PRESET-04 | Phase 3 | Pending |
| ALERT-03 | Phase 4 | Pending |
| ALERT-04 | Phase 4 | Pending |
| THEME-04 | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 28 total
- Mapped to phases: 28 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-04*
*Last updated: 2026-06-04 after roadmap creation (traceability populated)*
