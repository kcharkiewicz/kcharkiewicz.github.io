---
status: partial
phase: 01-site-foundation-hub-shell
source: [01-VERIFICATION.md]
started: 2026-06-04T12:14:32Z
updated: 2026-06-04T12:14:32Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Hub dark theme + favicon in browser tab
expected: Visiting https://kcharkiewicz.github.io/ shows a dark background (#0f1115), a centered "Where Winds Meet" card, and the GT monogram favicon visible in the browser tab.
result: [pending]

### 2. Where Winds Meet jade accent rendering
expected: On https://kcharkiewicz.github.io/games/where-winds-meet/ the cards show a jade (#3fb98f) top border and the breadcrumb leaf is rendered in jade as the current page (not a link); the Spawn Timer tool card has no empty cover panel (card--no-cover).
result: [pending]

### 3. Spawn Timer stub breadcrumb + copy
expected: On https://kcharkiewicz.github.io/games/where-winds-meet/tools/spawn-timer/ a 3-item breadcrumb shows clickable ancestors (hub, game) with a jade current-page leaf, the "Coming in Phase 2" stub copy renders, and there are no interactive timer controls.
result: [pending]

### 4. WCAG AA contrast
expected: Body text color #e8e4d8 on background #0f1115 meets the WCAG AA 4.5:1 minimum contrast ratio (confirm with a contrast checker).
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
