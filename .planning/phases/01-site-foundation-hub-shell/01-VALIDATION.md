---
phase: 1
slug: site-foundation-hub-shell
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-04
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `01-RESEARCH.md` → Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — plain static HTML/CSS/JS, no test runner (CF-01: no build step) |
| **Config file** | none |
| **Quick run command** | `python -m http.server 8080` (serve repo root, then open `http://localhost:8080`) |
| **Full suite command** | Manual checklist against Req IDs (see Per-Task Verification Map) + structural audits below |
| **Estimated runtime** | ~60 seconds (browser inspection + audit scripts) |

Phase 1 has zero JavaScript business logic and no npm project — no automated test runner applies. Validation is **structural** (file existence, lowercase-path audit, link/no-404 correctness, registry-extensibility check) and **visual** (theme, accent, favicon, breadcrumb). A local HTTP server is mandatory because root-absolute paths (`/shared/theme.css`) only resolve under a server root, not `file://`.

> **Host note:** All structural-audit `<automated>` verify commands in the plans are Bash/POSIX (`test`, `grep -q`, `$()`, `curl`, `for` loops). The dev machine is Windows PowerShell — run these via the Bash tool / `bash -c`, not native PowerShell.

---

## Sampling Rate

- **After every task commit:** Browser visual inspection via local HTTP server (~30s)
- **After every plan wave:** Full manual checklist against the Req IDs covered by that wave
- **Before `/gsd:verify-work`:** All 10 Req IDs manually verified + `curl` smoke test on the live Pages URL
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

> Plans assign task IDs; this map binds each phase requirement to its verification method. Threat refs filled from the planner's `<threat_model>` block.

| Req ID | Behavior | Test Type | Verification Command / Method | File Exists | Status |
|--------|----------|-----------|-------------------------------|-------------|--------|
| SITE-01 | Site reachable at kcharkiewicz.github.io | smoke | `curl -I https://kcharkiewicz.github.io` → 200 (after deploy + Pages enabled) — Plan 01-03 Task 3 | ❌ W0 | ⬜ pending |
| SITE-02 | No Jekyll drops; `.nojekyll` present; all-lowercase paths | structural | `.nojekyll` at repo root; `git ls-files \| grep -E '[A-Z]'` → zero results — Plan 01-01 Task 1 / Plan 01-03 Task 1 | ❌ W0 | ⬜ pending |
| HUB-01 | Hub landing shows WWM game card linking to `/games/where-winds-meet/` | visual | Local serve + browser; card present, href correct — Plan 01-01 Task 2 | ❌ W0 | ⬜ pending |
| HUB-02 | WWM game page shows spawn-timer tool card | visual | Local serve + browser; tool card present, links to stub — Plan 01-02 Task 1 | ❌ W0 | ⬜ pending |
| HUB-03 | Every non-root page has breadcrumb with correct clickable ancestors | structural/visual | Inspect `nav[aria-label="Breadcrumb"]`; ancestors clickable, `aria-current="page"` on leaf — Plan 01-02 Tasks 1 & 2 | ❌ W0 | ⬜ pending |
| HUB-04 | All 3 URLs bookmarkable; no 404 | smoke | `curl -s -o /dev/null -w "%{http_code}" .../games/where-winds-meet/tools/spawn-timer/` → 200 — Plan 01-03 Task 3 | ❌ W0 | ⬜ pending |
| HUB-05 | Adding a second game = one registry-array entry, no structural change | extensibility | Insert a temp second item in the games array; new card renders without editing other files; revert — Plan 01-03 Task 3 (manual mutation) | ❌ W0 | ⬜ pending |
| THEME-01 | Dark theme applied consistently on all 3 pages | visual | Browser: background `#0f1115`, light text on every page — Plans 01-01 & 01-02 | ❌ W0 | ⬜ pending |
| THEME-02 | WWM jade/gold accent visible; hub stays neutral (accent override mechanism works) | visual | DevTools `getComputedStyle` on `--color-accent`: jade `#3fb98f` on WWM pages, neutral on hub — Plans 01-01 & 01-02 | ❌ W0 | ⬜ pending |
| THEME-03 | Custom SVG favicon visible in browser tab | visual | Browser tab shows favicon after local serve; root-absolute lowercase ref — Plan 01-01 Task 2 | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · "❌ W0" = depends on Wave 0 setup*

---

## Wave 0 Requirements

- [ ] `.nojekyll` created at repo root — **first file committed** (Jekyll-bypass insurance)
- [ ] Local HTTP server command documented (dev note / README) for root-absolute-path testing
- [ ] Case audit noted: `git ls-files | grep -E '[A-Z]'` must return zero results
- [ ] GitHub Pages enabled via repo Settings → Pages → "Deploy from a branch" (manual, one-time)

*No automated test files needed — Phase 1 is structure + visual, not logic.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live site reachable / no 404s on Pages | SITE-01, HUB-04 | Requires the real GitHub Pages deploy (external infra) | After push + Pages enabled, `curl -I` each of the 3 URLs; expect 200 |
| Dark theme + jade/gold accent + favicon render | THEME-01/02/03 | Visual correctness can't be asserted programmatically without a browser | Local serve, inspect each page in browser + DevTools computed styles |
| Breadcrumb correctness & accessibility | HUB-03 | ARIA semantics + clickability are a visual/AT concern | Inspect `nav[aria-label="Breadcrumb"]`, tab through links, check `aria-current` |
| Registry extensibility ("one entry, no rework") | HUB-05 | Proves the drop-in pattern by mutation, not a static check | Add a temp second game entry, confirm card renders with no other edits, then revert |
| "Looks right with one card" | HUB-01 | Subjective layout feel from CONTEXT.md specifics | Confirm single WWM card grid does not look broken/lonely |

---

## Validation Sign-Off

- [x] Every phase requirement has a verification method or Wave 0 dependency
- [x] Sampling continuity: no wave merges without a manual checklist pass
- [x] Wave 0 covers all MISSING references (`.nojekyll`, local server, case audit, Pages enablement)
- [x] No watch-mode flags (N/A — no test runner)
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter (task IDs bound in Per-Task Verification Map)

**Approval:** approved (planner — task IDs bound; structural audits map to plan tasks; manual-only items documented with rationale)
