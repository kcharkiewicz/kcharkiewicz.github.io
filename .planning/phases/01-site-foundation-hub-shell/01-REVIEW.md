---
phase: 01-site-foundation-hub-shell
reviewed: 2026-06-04T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - index.html
  - games/where-winds-meet/index.html
  - games/where-winds-meet/tools/spawn-timer/index.html
  - shared/theme.css
  - favicon.svg
  - games/where-winds-meet/cover.svg
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-06-04
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the Phase 1 site foundation: the hub landing page, the Where Winds Meet
game page, the Spawn Timer stub, the shared CSS token system, and two SVG assets.
The code is clean, consistent, and the inline-registry + `renderCards()` pattern
matches the intended architecture (no build step, no framework — deliberate, per
CLAUDE.md and the review brief).

No critical/security issues were confirmed. The registry data is 100% static
developer-defined literals, so the `innerHTML` interpolation is **not a live XSS
vector** today and is correctly documented as such in the source comments.

However, the review surfaced real latent-correctness and graceful-degradation
defects that matter for a "works reliably during gameplay" site. The most
important: the unescaped `innerHTML` interpolation will silently corrupt rendering
the moment a registry value contains `&`, `<`, `>`, or a quote — a near-certain
future edit given the project's explicit "add a game by inserting one object"
growth model. Second: the hub's card grid has zero no-JS fallback (renders an empty
page), while the breadcrumbs on the inner pages *do* ship static fallback markup —
an inconsistency that means the front door of the site is the most fragile page.

## Warnings

### WR-01: Unescaped registry values break rendering (and re-open XSS) on the next data edit

**File:** `index.html:42-53`, `games/where-winds-meet/index.html:45,67-75`, `games/where-winds-meet/tools/spawn-timer/index.html:46-54`
**Issue:** Every renderer interpolates registry fields directly into an
`innerHTML` template string with no escaping: `${item.name}`, `${item.href}`,
`${item.cover}`, `${item.description}`, `${item.label}`. The security comments
correctly state the *current* data is static, but the entire architecture is
designed for the developer to keep adding entries by hand. The first entry whose
`name`/`description` contains an ampersand (e.g. "Dungeons & Dragons"), a `<`/`>`,
or a quote character will:
- corrupt the rendered HTML (broken card, swallowed text, or attribute breakout
  for `href`/`cover` values), and
- re-introduce a genuine HTML-injection sink the moment any value ever derives
  from something non-literal (a future `_data/*.json`, a URL slug, etc.).
This is a correctness bug now and a latent security bug later. The cost to fix is
trivial; the comment-based "don't pass user input" guard is not enforced by code.
**Fix:** Escape values before interpolation, and prefer attribute-safe handling.
A minimal shared helper:
```js
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
// then:
`<a class="card" href="${escapeHtml(item.href)}">
   <img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.name)} cover art" ...>
   <h2 class="card__name">${escapeHtml(item.name)}</h2>`
```
(For text nodes, building elements via `document.createElement` + `textContent`
is even safer, but `escapeHtml` is the smallest change consistent with the
current pattern.)

### WR-02: Hub landing page renders nothing without JavaScript / on script failure

**File:** `index.html:16,56-58`
**Issue:** `<div id="card-grid" class="card-grid"></div>` is empty in the served
HTML; the only game card is injected by `renderCards()` on `DOMContentLoaded`. If
JS is disabled, blocked, throws, or simply hasn't run yet, the hub — the site's
front door — shows an empty page with no way to reach any tool. This is
inconsistent with the inner pages, which ship the breadcrumb trail as static
markup (a working fallback) *before* re-rendering it. For a site whose core value
is "must work reliably in the browser," the entry point should be the most robust
page, not the most fragile.
**Fix:** Ship the initial game card(s) as static HTML inside `#card-grid` (the
registry script can still re-render to stay DRY, or skip injection when content
already exists). Alternatively, add a `<noscript>` block with direct links to the
game page(s). Given there is exactly one game today, static markup is the
lowest-risk option:
```html
<div id="card-grid" class="card-grid">
  <a class="card" href="/games/where-winds-meet/"> ... static card ... </a>
</div>
```

### WR-03: No runtime guard when the container element is missing

**File:** `index.html:53`, `games/where-winds-meet/index.html:50,75`, `games/where-winds-meet/tools/spawn-timer/index.html:54`
**Issue:** `document.getElementById(containerId).innerHTML = ...` dereferences the
result of `getElementById` with no null check. If the container id is ever
mistyped during a future copy-paste of this pattern (the project's stated growth
model is copy-the-pattern-per-page), the call throws
`Cannot set properties of null` and aborts the rest of the `DOMContentLoaded`
handler — on the game page that means a single typo in one renderer silently kills
the *other* renderer too (breadcrumb failure would also drop the tool cards, and
vice-versa). The failure is silent to the user (blank section) and easy to
introduce.
**Fix:** Guard and fail loudly in the console:
```js
const container = document.getElementById(containerId);
if (!container) {
  console.error(`renderCards: no element with id "${containerId}"`);
  return;
}
container.innerHTML = html;
```

## Info

### IN-01: `renderBreadcrumb` is duplicated verbatim across two pages

**File:** `games/where-winds-meet/index.html:42-51`, `games/where-winds-meet/tools/spawn-timer/index.html:46-55`
**Issue:** The `renderBreadcrumb` function (and its surrounding comment block) is
byte-for-byte identical in both inner pages. As pages multiply per the project's
growth model, this duplication will drift. CLAUDE.md explicitly anticipates a
shared JS layer ("co-located `.js` module", "shared layout shell"). This is the
natural first candidate.
**Fix:** Extract the breadcrumb + card renderers into a single
`/shared/render.js` ES module imported by each page, leaving only the
page-specific data arrays inline. Keeps the "edit one object to add a thing"
ergonomics while removing copy-paste.

### IN-02: Static breadcrumb markup is immediately discarded and re-rendered

**File:** `games/where-winds-meet/index.html:15-20,50`, `games/where-winds-meet/tools/spawn-timer/index.html:15-21,54`
**Issue:** Each inner page hand-writes a full `<ol>` breadcrumb in markup, then
`renderBreadcrumb()` overwrites `#breadcrumb`'s `innerHTML` with a freshly
generated, functionally identical `<ol>`. The static version is a useful no-JS
fallback (good — see WR-02), but maintaining two sources of the same trail invites
them to disagree silently. If the static markup is meant as the fallback, the JS
re-render adds no value for these fixed trails and could be dropped; if the JS is
the source of truth, the static markup should be a deliberate, documented
fallback. Right now it is ambiguous which is canonical.
**Fix:** Decide one source of truth. Recommended: keep static markup as the
intentional fallback and drop the redundant breadcrumb re-render on pages with a
fixed trail, or document that the static `<ol>` exists specifically as the no-JS
fallback for the JS renderer.

### IN-03: Repeated inline `style="..."` strings duplicate token usage

**File:** `games/where-winds-meet/index.html:24`, `games/where-winds-meet/tools/spawn-timer/index.html:23-27`
**Issue:** Several elements carry long inline `style` attributes composed of CSS
custom properties (e.g. the centered hero on the spawn-timer page, the subtitle
`<p>` on the game page). These bypass the otherwise-clean shared component class
system in `theme.css` and will be copy-pasted into every future tool stub.
**Fix:** Promote recurring inline styles to shared classes in `theme.css`
(e.g. `.page-subtitle`, `.tool-stub`), consistent with how `.card`, `.site-header`
etc. are already factored out.

### IN-04: Footer text duplicated across all pages as a literal

**File:** `index.html:19`, `games/where-winds-meet/index.html:28`, `games/where-winds-meet/tools/spawn-timer/index.html:31`
**Issue:** `Game Tools Hub — personal project` is hardcoded in three places; the
site title string and header band are likewise repeated. Minor today, but it is
exactly the kind of shared-shell content CLAUDE.md flags for layout deduplication
as the page count grows.
**Fix:** When the shared JS/layout module from IN-01 lands, source header/footer
text from one place.

---

_Reviewed: 2026-06-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
