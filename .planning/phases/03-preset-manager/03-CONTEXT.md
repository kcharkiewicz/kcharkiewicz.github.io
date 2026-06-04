# Phase 3: Preset Manager - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Named, saveable timer configurations for the spawn-timer tool. A preset captures
the three existing config inputs — `duration` (string), `repeat` (number), and
`unlimited` (boolean) — under a user-chosen name. The user can:

- **Save** the current config as a named preset (PRESET-01)
- **Load** a preset in one click to populate the timer fields, without auto-starting (PRESET-02)
- **Delete** a preset (PRESET-03)
- Have presets **persist across browser sessions** via defensive namespaced localStorage (PRESET-04)

**Hard non-functional requirement:** the preset feature must NEVER crash the timer.
In Safari Private Browsing (or any storage-denied context) the timer works normally
and presets are silently unavailable (success criterion 5).

**Out of scope (own phases):** audio controls (Phase 4), responsive/touch/wake-lock
polish (Phase 5), import/export or cloud sync of presets (no requirement; backlog if ever).

</domain>

<decisions>
## Implementation Decisions

### Preset list UI & placement (discussed)
- **D-01:** The preset section renders **below** the Duration/Repeat/Unlimited config
  block — natural order is configure → save/load → run. It slots into the existing
  `.timer__config` region of `index.html` (above the `.timer__controls` button row).
- **D-02:** Each preset row is **compact**: the preset name is a button (click = load),
  with a small `×` / trash control on the right to delete. Chosen for a phone
  second-screen where horizontal space is tight (fewest pixels per row).
- **D-03:** The preset section is **always visible**. When no presets exist it shows an
  empty-state hint: *"No presets yet — save your current setup above."* Consistent
  layout; presets are always one glance away.

### Save flow & duplicate names (default — user delegated)
- **D-04:** An **always-visible name input + Save button** lives in the preset section
  (consistent with the always-visible list). Save captures the current `duration`,
  `repeat`, and `unlimited` values.
- **D-05:** Empty/whitespace-only names are **rejected** with inline feedback (reuse the
  established inline-error pattern). Names are trimmed; soft cap ~40 chars.
- **D-06:** Saving a name that already exists **overwrites** that preset (predictable,
  avoids list clutter / duplicate names). No separate "edit" affordance needed.

### Load behavior while running (default — user delegated)
- **D-07:** Clicking a preset **populates the config fields only** and **never
  auto-starts** the timer (PRESET-02 / criterion 2).
- **D-08:** Loading is **available only in `idle` and `finished` states**; while the
  timer is `running` or `paused` the preset rows are **disabled** (config inputs are
  already locked in those states — keeps state model consistent). Reset returns to
  idle, re-enabling load.
- **D-09:** A **brief highlight** on the just-loaded row gives feedback; there is **no
  persistent "active preset"** tracking (keeps state minimal).

### Delete & empty state (default — user delegated)
- **D-10:** The `×` deletes the preset **immediately, with no confirmation** (fast
  second-screen tool; consistent with the compact `×` affordance). Accepted tradeoff:
  a mis-tap loses a preset with no undo — surfaced to and accepted by the user.
- **D-11:** **No hard cap** on preset count (localStorage is ample for a handful of small
  JSON objects, per the project's storage guidance).

### Carried forward (locked by prior phases — NOT re-decided here)
- **D-12 (storage pattern):** Namespaced localStorage key under
  `gametools.where-winds-meet.spawn-timer.*`, wrapped in `try/catch`, with a
  `schemaVersion` field on the stored object. Presets are a **sibling key** to the
  existing runtime-state key `gametools.where-winds-meet.spawn-timer.state`
  (suggested: `gametools.where-winds-meet.spawn-timer.presets`). Source: PROJECT.md
  key decision; mirrors `spawn-timer.js:7-8` (`STORAGE_KEY`, `SCHEMA_VERSION`).
- **D-13 (XSS / rendering):** All preset names render via **`textContent` only**, never
  `innerHTML` (Phase 2 threat T-02-01). Build rows with `createElement` +
  `textContent` / `replaceChildren`.
- **D-14 (defensive read):** Reading the presets collection mirrors the timer's
  `loadTimerState()` discipline: `JSON.parse` inside `try/catch`, validate
  `schemaVersion`, and **validate field types** before use (the same class of bug as
  CR-01 from the Phase 2 review — never trust stored shapes). Malformed/denied storage
  → treat as "no presets," never throw to the UI.

### Claude's Discretion
- Exact DOM structure, CSS class names, and whether presets live in `spawn-timer.js`
  or a small extracted `presets.js` module — planner/executor decides. (Note: the
  project's intended convention mentions a `shared/storage.js`; it does not yet exist —
  the planner may create a thin storage helper or inline it. Either is acceptable as
  long as D-12/D-13/D-14 hold.)
- Whether to add pure, unit-testable helpers (e.g. `addPreset`, `removePreset`,
  serialize/parse) with `node:test` coverage — encouraged, consistent with the Phase 2
  pure-function + runtime-guard split.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — PRESET-01..04 definitions; THEME tokens.
- `.planning/ROADMAP.md` §"Phase 3: Preset Manager" — goal + 5 success criteria.

### Existing storage & rendering patterns to mirror
- `games/where-winds-meet/tools/spawn-timer/spawn-timer.js` — `STORAGE_KEY` /
  `SCHEMA_VERSION` (lines 7-8), `loadTimerState()` / `saveTimerState()` defensive
  read/write pattern, and the `isValidSavedState()` type-validation guard added by the
  Phase 2 code-review fix (CR-01). **The preset store must follow this same discipline.**
- `games/where-winds-meet/tools/spawn-timer/index.html` — `.timer__config` section
  (config inputs + inline `.timer__error` spans) where the preset UI attaches.
- `games/where-winds-meet/tools/spawn-timer/timer.css` — component styles on shared
  theme tokens; `--color-error` token (added in WR-04 fix) available for any inline
  validation; reuse `.btn` variants and focus-ring conventions.
- `shared/theme.css` — design tokens (colors, spacing, focus-visible ring). Style
  presets with tokens, not hardcoded values.

### Decision sources
- `.planning/PROJECT.md` — key decision: "Namespaced localStorage + try/catch + schema
  version"; "no remote storage"; "keep dependencies light."
- `.planning/phases/02-timer-core/02-REVIEW.md` — CR-01 (validate stored field types)
  and T-02-01 (textContent-only) are the cautionary precedents for this phase.

No external/third-party specs — this is a static client-only feature.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Defensive storage helpers** (`spawn-timer.js`): `loadTimerState`/`saveTimerState`
  + `isValidSavedState` are the exact template for a preset store. Copy the
  try/catch + schemaVersion + type-validation shape.
- **Inline validation UI** (`index.html` `.timer__error` + `--color-error`): reuse for
  empty/invalid preset-name feedback.
- **`.btn` variants** (`--primary`/`--secondary`/`--outline`) and the global
  `:focus-visible` ring: reuse for Save button and preset rows.

### Established Patterns
- **textContent-only DOM writes** (T-02-01): mandatory for rendering preset names.
- **Pure-function + runtime-guard split** (Phase 2): preset list mutation helpers can be
  pure and `node:test`-covered; DOM wiring guarded behind the browser entry.
- **State-gated controls**: the timer disables config inputs while running/paused — preset
  load follows the same gating (D-08).

### Integration Points
- New preset section mounts inside `.timer__config` in `index.html`, below the existing
  inputs and above `.timer__controls`.
- Load writes into the existing `#input-duration`, `#input-repeat`, `#input-unlimited`
  elements (then the existing Start path takes over unchanged).
- Preset store is a **new localStorage key**, fully independent of the runtime-state key
  so it survives Reset and does not interfere with reload-restore.

</code_context>

<specifics>
## Specific Ideas

- Compact, glance-friendly rows are the priority — this is operated on a phone propped as
  a second screen mid-match. Favor density and one-tap load over chrome.
- Empty-state copy: *"No presets yet — save your current setup above."*

</specifics>

<deferred>
## Deferred Ideas

- **Delete undo / confirm** — explicitly declined for v1 (D-10). If accidental loss
  proves annoying in real use, revisit as a small enhancement (could fold into Phase 5
  polish).
- **Preset import/export or sharing** — out of scope; no requirement. Backlog only if a
  real need appears (would conflict with "no remote storage" unless file-based).
- **Reordering / favoriting presets** — not in scope; could be a future enhancement.

None of these block Phase 3 — discussion stayed within the preset-management domain.

</deferred>

---

*Phase: 3-preset-manager*
*Context gathered: 2026-06-04*
