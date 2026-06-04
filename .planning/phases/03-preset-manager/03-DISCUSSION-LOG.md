# Phase 3: Preset Manager - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-04
**Phase:** 3-preset-manager
**Areas discussed:** Preset list UI & placement (selected); Save flow, Load-while-running, Delete/empty-state (delegated to defaults, confirmed)

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Preset list UI & placement | Where the list lives + per-row affordances + visibility | ✓ |
| Save flow & duplicate names | Save control model + duplicate-name handling | (delegated to defaults) |
| Load behavior while running | Populate semantics + running-state gating | (delegated to defaults) |
| Delete confirmation & empty state | Confirm vs immediate + empty state + caps | (delegated to defaults) |

**User's choice:** Discuss "Preset list UI & placement"; use sensible defaults for the rest.

---

## Preset list UI & placement

### Placement
| Option | Description | Selected |
|--------|-------------|----------|
| Below the config inputs | Under Duration/Repeat/Unlimited, above controls | ✓ |
| Above the config inputs | Presets first | |
| Collapsible panel / drawer | Tucked behind a toggle | |

### Row UI
| Option | Description | Selected |
|--------|-------------|----------|
| Click name to load + small × to delete | Compact, name is a button, × deletes | ✓ |
| Explicit [Load] and [Delete] buttons | Most discoverable, wider rows | |
| Click name to load + Delete on a confirm | Click loads, delete behind confirm | |

### Visibility
| Option | Description | Selected |
|--------|-------------|----------|
| Always visible (with empty state) | Section always rendered + empty hint | ✓ |
| Hidden until first preset | Appears after first save | |

**User's choice:** Below config / compact click-name-+-× / always-visible with empty state.
**Notes:** Driven by the second-screen-on-a-phone use context — density and one-tap load prioritized.

---

## Delegated defaults (confirmed)

Presented three default decisions for the delegated areas; user chose **"Lock all three as-is"**
(declined the offered delete-confirm and duplicate-name alternatives).

| Option | Description | Selected |
|--------|-------------|----------|
| Lock all three as-is | Accept Save / Load-while-running / Delete defaults | ✓ |
| Add a delete confirm | Inline confirm before delete | |
| Change duplicate-name handling | Auto-suffix / reject instead of overwrite | |
| Let me adjust something else | Freeform tweak | |

**Defaults locked:** always-visible name field + Save (captures duration/repeat/unlimited);
empty name rejected; duplicate name overwrites; load populates fields only / disabled while
running/paused / brief highlight; delete is immediate with no confirm; no preset count cap.
**Notes:** Immediate-delete-no-confirm was explicitly flagged as a mis-tap risk and accepted.

## Claude's Discretion

- DOM structure, CSS class names, and module split (inline in `spawn-timer.js` vs a small
  `presets.js` / `shared/storage.js` helper) — left to planner/executor, provided the locked
  storage/XSS/validation patterns (D-12/D-13/D-14) hold.
- Whether to add `node:test`-covered pure preset helpers (encouraged).

## Deferred Ideas

- Delete undo / confirm (declined for v1; possible Phase 5 polish revisit).
- Preset import/export or sharing (out of scope; conflicts with "no remote storage").
- Reordering / favoriting presets (future enhancement).
