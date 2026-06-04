# Phase 1: Site Foundation + Hub Shell - Research

**Researched:** 2026-06-04
**Domain:** Static HTML/CSS/JS site deployment, GitHub Pages, CSS custom properties, vanilla JS card rendering, SVG favicon
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **CF-01:** No build step for v1 — plain HTML/CSS/JS, no SSG/bundler. Overrides CLAUDE.md's Eleventy + Tailwind recommendation. Do not introduce Eleventy, Tailwind, or PostCSS.
- **CF-02:** Directory layout is fixed: `/index.html`, `/games/where-winds-meet/index.html`, `/games/where-winds-meet/tools/spawn-timer/index.html`.
- **CF-03:** Shared assets at `/shared/theme.css`, `/shared/storage.js`, `/shared/audio.js` (only `theme.css` in scope this phase).
- **CF-04:** Hub/game pages render from inline JS registry arrays + a card renderer — no fetch, no build step. Adding a game/tool = inserting one registry entry (HUB-05).
- **CF-05:** Deployment guards from first commit: `.nojekyll` in repo root, all-lowercase filenames, root-absolute asset paths (e.g. `/shared/theme.css`) since this is a user/org apex-domain site.
- **D-01:** Neutral dark base + per-game accent layer. Hub is game-agnostic.
- **D-02:** WWM accent: jade `#3fb98f` (primary) + gold `#d4af37` (secondary). Base: `#0f1115` bg. These hex values are locked.
- **D-03:** CSS custom properties in `/shared/theme.css`. Per-game accent set via `data-game` attribute override.
- **D-04:** Hub landing is tools-first — compact header then straight to game-card grid.
- **D-05:** Game card = cover art + game name + tool count.
- **D-06:** WWM cover art = styled SVG placeholder at `/games/where-winds-meet/cover.svg`, drop-in swappable.
- **D-07:** Breadcrumb trail present on every page except hub root. Example: `Game Tools Hub / Where Winds Meet / Spawn Timer`.
- **D-08:** Breadcrumb root / brand name = "Game Tools Hub".
- **D-09:** Spawn-timer stub page at real URL `/games/where-winds-meet/tools/spawn-timer/` showing "coming in Phase 2" placeholder.
- **D-10:** Custom SVG favicon at `/favicon.svg` reflecting hub identity.

### Claude's Discretion

- Exact neutral base token values (background shades, surface/border, text contrast) — must meet WCAG AA.
- Typography choices, card grid column count / responsive breakpoints, hover states, footer presence/content.
- Favicon concept/artwork (per D-10).
- Stub page copy/wording.

### Deferred Ideas (OUT OF SCOPE)

- Status badges on cards (HUB-V2-01).
- Client-side search/filter (HUB-V2-02).
- Real WWM cover artwork replacing placeholder SVG.
- A second real game.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SITE-01 | Site deployed to GitHub Pages and reachable at kcharkiewicz.github.io | GitHub Pages "Deploy from a branch" setup; user-site naming convention; 10-min propagation window |
| SITE-02 | Static delivery robust against Pages pitfalls (.nojekyll, all-lowercase paths, case-consistent links) | .nojekyll bypasses Jekyll; core.ignorecase strategy on Windows; root-absolute paths safe for apex-domain user sites |
| HUB-01 | Landing page lists games as cards, each linking to game's page | Inline JS registry array + template literal card renderer pattern |
| HUB-02 | WWM game page lists tools, each linking to tool page | Same registry + renderer pattern applied at the tool level |
| HUB-03 | Consistent header and back/up navigation on every page | Breadcrumb HTML pattern with aria-label and aria-current; JS-injected header option |
| HUB-04 | URLs map to hierarchy; every page is bookmarkable | Fixed directory layout (CF-02); index.html per directory; root-absolute links |
| HUB-05 | New game/tool = drop-in registry entry; no existing file restructuring | Single-array insertion pattern verified as sufficient |
| THEME-01 | Dark gamer theme applied consistently across all pages | CSS custom property token set in /shared/theme.css; linked from every page |
| THEME-02 | Per-game accent layered over base | data-game attribute selector in theme.css overrides --color-accent / --color-accent-secondary |
| THEME-03 | Custom SVG favicon reflecting hub identity | SVG favicon via `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`; 88% global browser support |
</phase_requirements>

---

## Summary

Phase 1 builds a plain HTML/CSS/JS static site — no build toolchain — deployed to GitHub Pages as a user/org apex-domain site. The technical surface is narrow and well-understood: three hand-authored HTML pages, a shared CSS file with custom-property tokens, a vanilla JS registry + card-renderer pattern, an SVG favicon, and a GitHub Pages "Deploy from a branch" configuration. Every technical decision has been locked in CONTEXT.md/STATE.md; research confirms those decisions are sound.

The highest-risk execution areas are deployment guards (`.nojekyll`, all-lowercase filenames, root-absolute paths) and the DRY breadcrumb problem. `.nojekyll` must be the first commit — Jekyll silently drops underscore-prefixed paths. Setting `git config core.ignorecase false` on Windows is dangerous and not recommended; the safer strategy is enforcing lowercase-only names from the start and never introducing mixed-case filenames. Root-absolute paths work correctly on `username.github.io` apex-domain sites with no subpath prefix (confirmed). The breadcrumb-on-every-page DRY problem is solved by a tiny inline JS snippet per page that injects the breadcrumb HTML at runtime — no fetch, no SSI, no SSG required.

The CSS theming approach (base tokens in `:root`, per-game override via `[data-game="where-winds-meet"]` attribute selector) is the standard pattern for CSS custom-property scoped theming and requires no JavaScript. All six color contrast pairs in the locked palette exceed WCAG AA (UI-SPEC already verified this). SVG favicons are supported by 88% of global browsers (Chrome 80+, Firefox 41+, Edge 80+, Safari 26+) — no ICO fallback is required for a developer/gamer audience with no IE11 support needed.

**Primary recommendation:** Ship `.nojekyll` + `index.html` as the very first commit before writing any other file. Configure Pages to "Deploy from a branch" (main, root). All remaining files can follow in subsequent commits.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Page rendering (hub, game, stub) | Browser / Client | — | Plain HTML served as static files; no server-side rendering |
| CSS theming and tokens | Browser / Client | CDN / Static | CSS custom properties computed at paint time in browser |
| Per-game accent override | Browser / Client | — | CSS attribute selector evaluated in-browser; no JS needed |
| Registry + card rendering | Browser / Client | — | Inline JS arrays + innerHTML; no server involvement |
| Breadcrumb injection | Browser / Client | — | JS `innerHTML` on `DOMContentLoaded`; trivially small |
| Static file hosting | CDN / Static | — | GitHub Pages serves files from a branch; no compute |
| SVG favicon | CDN / Static | Browser / Client | Served as static file; browser renders it |
| URL hierarchy enforcement | CDN / Static | — | Directory-index convention (index.html per directory) |
| Deployment | CDN / Static | — | GitHub Pages "Deploy from a branch" — no build action needed |

---

## Standard Stack

### Core

This phase has zero npm dependencies. All capabilities are native browser/platform features.

| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| HTML5 | — (browser-native) | Page structure and semantics | No alternative; static host requires HTML |
| CSS custom properties | — (browser-native) | Token-based theming, accent override | Universal browser support since ~2017; zero build cost |
| Vanilla JS ES modules | ES2022+ | Inline registry + card renderer | GitHub Pages serves static files; every target browser supports modules natively |
| SVG | — (browser-native) | Favicon, cover-art placeholder | Zero asset weight for synthesized graphics; scales perfectly |

### Supporting

| Feature | Mechanism | Purpose | When to Use |
|---------|-----------|---------|-------------|
| CSS Grid `auto-fill` + `minmax()` | Native CSS | Responsive card grid, single-card centering | Always — no media queries needed for column count |
| `[data-game]` attribute selector | Native CSS | Per-game accent override scoping | On every WWM page; not on hub landing |
| `aria-label="Breadcrumb"` + `aria-current="page"` | Native HTML/ARIA | Accessible breadcrumb trail | W3C APG-recommended pattern |
| `:focus-visible` | Native CSS | Keyboard-navigation focus ring | Baseline support across all modern browsers since 2022 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline JS registry per page | Shared ES module fetched at runtime | Fetch adds async complexity and a potential 404 failure point; inline is simpler for 3-page v1 |
| JS-injected breadcrumb | Copy-paste breadcrumb HTML per page | Duplication; changing root label requires editing every file |
| JS-injected breadcrumb | SSI / Eleventy template | Requires build step (violates CF-01) or server-side support (unavailable on Pages) |
| `[data-game]` attribute selector | Per-game CSS file imported after theme.css | Both work; attribute selector keeps all token logic in one file and is self-documenting |

**Installation:** None — zero npm dependencies in this phase.

---

## Package Legitimacy Audit

> This phase installs NO external packages. There are no npm, PyPI, or other registry dependencies to audit.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| (none) | — | — | — | — | — | N/A |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Browser Request
      |
      v
GitHub Pages CDN (static file server)
      |
      +-- /index.html ──────────────────────────────────> Hub Landing Page
      |     links /shared/theme.css                          |
      |     inline JS games registry                         | card click
      |     renderCards() → innerHTML                        v
      |                                          /games/where-winds-meet/
      +-- /games/where-winds-meet/index.html ──> Game Page
      |     links /shared/theme.css               |
      |     data-game="where-winds-meet"          | tool card click
      |     inline JS tools registry              v
      |     renderCards() → innerHTML   /games/where-winds-meet/tools/spawn-timer/
      |
      +-- /games/where-winds-meet/tools/spawn-timer/index.html
      |     links /shared/theme.css
      |     data-game="where-winds-meet"
      |     stub content ("coming Phase 2")
      |
      +-- /shared/theme.css ──> :root tokens + [data-game] overrides
      +-- /favicon.svg ──────> browser tab icon
      +-- /games/where-winds-meet/cover.svg ──> card cover art panel
      +-- /.nojekyll ────────> disables Jekyll; all files served as-is
```

### Recommended Project Structure

```
/                           # repo root (also GitHub Pages root)
├── .nojekyll               # FIRST FILE COMMITTED — disables Jekyll
├── index.html              # Hub landing page
├── favicon.svg             # Custom SVG favicon
├── shared/
│   └── theme.css           # Base tokens + [data-game] accent overrides
└── games/
    └── where-winds-meet/
        ├── index.html      # WWM game page
        ├── cover.svg       # Styled SVG placeholder (drop-in swappable)
        └── tools/
            └── spawn-timer/
                └── index.html  # Stub page ("coming Phase 2")
```

All filenames lowercase. No underscore-prefixed files or directories.

### Pattern 1: Inline JS Registry + Card Renderer

**What:** Each hub/game page defines a data array and a `renderCards()` function inline in a `<script>` tag. Calling `renderCards()` on `DOMContentLoaded` injects card HTML into a container element.

**When to use:** Hub landing page (games registry), WWM game page (tools registry).

**Example:**
```javascript
// Source: CONTEXT.md CF-04 + standard vanilla JS template literal pattern
const games = [
  {
    slug: "where-winds-meet",
    name: "Where Winds Meet",
    toolCount: 1,
    href: "/games/where-winds-meet/",
    cover: "/games/where-winds-meet/cover.svg"
  }
  // Adding a second game = inserting one object here — no structural change
];

function renderCards(items, containerId) {
  const html = items.map(item => `
    <a class="card" href="${item.href}">
      <div class="card__cover">
        <img src="${item.cover}" alt="${item.name} cover art" width="280" height="160">
      </div>
      <div class="card__body">
        <h2 class="card__name">${item.name}</h2>
        <p class="card__count">${item.toolCount} tool${item.toolCount !== 1 ? 's' : ''}</p>
      </div>
    </a>
  `).join('');
  document.getElementById(containerId).innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => renderCards(games, 'card-grid'));
```

**Security note:** All card data is statically defined in-page (no user input, no dynamic data). XSS sanitization is not required here, but avoid passing any URL-derived or user-supplied string into `innerHTML`.

### Pattern 2: CSS Custom Property Theming with Per-Game Accent

**What:** Base tokens on `:root`. Per-game accent overrides via `[data-game="..."]` attribute selector. Game pages set `data-game` on `<body>`. Hub landing does not set the attribute.

**When to use:** Globally — all page types use `/shared/theme.css`.

**Example:**
```css
/* Source: CONTEXT.md D-03 + CSS custom property scoping standard pattern */
/* /shared/theme.css */

:root {
  /* Base neutral dark tokens */
  --color-bg:              #0f1115;
  --color-surface:         #1a1d23;
  --color-surface-raised:  #22262f;
  --color-border:          #2a2e38;
  --color-text-primary:    #e8e4d8;
  --color-text-secondary:  #9a9690;

  /* Accent defaults (neutral hub — same jade, overridden per game below) */
  --color-accent:          #3fb98f;
  --color-accent-secondary: #d4af37;

  /* Spacing scale (4px base) */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
}

/* Per-game accent layer — set data-game="where-winds-meet" on <body> */
[data-game="where-winds-meet"] {
  --color-accent:           #3fb98f;  /* jade — locked D-02 */
  --color-accent-secondary: #d4af37;  /* gold — locked D-02 */
}
```

### Pattern 3: JS-Injected Breadcrumb (DRY Without SSG)

**What:** A tiny inline `<script>` block on each non-root page injects the breadcrumb HTML into a placeholder `<nav id="breadcrumb">` element. Each page defines its own `breadcrumbItems` array. The rendering function is duplicated across pages (it is ~6 lines) or extracted to a shared module.

**When to use:** Game page and all tool pages (not hub landing — it is the root).

**Why not fetch-based include:** Adds async complexity, requires CORS/server handling, and can fail silently. The shared function is small enough to duplicate or inline — the data is the only thing that changes per page.

**Example:**
```html
<!-- Source: W3C APG breadcrumb pattern + CONTEXT.md D-07/D-08 -->
<nav aria-label="Breadcrumb" id="breadcrumb"></nav>

<script>
const breadcrumbItems = [
  { label: "Game Tools Hub", href: "/" },
  { label: "Where Winds Meet", href: "/games/where-winds-meet/" },
  { label: "Spawn Timer", href: null }  // null = current page, not a link
];

(function renderBreadcrumb(items, containerId) {
  const html = '<ol>' + items.map((item, i) => {
    const isLast = i === items.length - 1;
    const seg = isLast
      ? `<span aria-current="page">${item.label}</span>`
      : `<a href="${item.href}">${item.label}</a>`;
    return `<li>${seg}</li>`;
  }).join('') + '</ol>';
  document.getElementById(containerId).innerHTML = html;
})(breadcrumbItems, 'breadcrumb');
</script>
```

CSS separators via `li + li::before { content: " / "; color: var(--color-text-secondary); }` — separators are not in the markup, so screen readers do not announce them.

### Pattern 4: SVG Favicon

**What:** A 32×32 SVG file served from `/favicon.svg`, linked via `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`.

**When to use:** In the `<head>` of every HTML page.

**Example:**
```html
<!-- Source: web.dev adaptive favicon article + UI-SPEC.md -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
```

**SVG template (GT monogram concept from UI-SPEC.md):**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0f1115"/>
  <text x="5" y="23" font-family="system-ui, sans-serif"
        font-size="18" font-weight="600" fill="#e8e4d8">G</text>
  <text x="17" y="23" font-family="system-ui, sans-serif"
        font-size="18" font-weight="600" fill="#3fb98f">T</text>
</svg>
```

### Anti-Patterns to Avoid

- **Relative asset paths (`../shared/theme.css`):** Break when HTML is served from different nesting depths. Use root-absolute (`/shared/theme.css`) exclusively. [CITED: CONTEXT.md CF-05 / STATE.md Architecture Conventions]
- **Uppercase or mixed-case filenames:** GitHub Pages runs on Linux (case-sensitive). A file named `Cover.svg` referenced as `/games/where-winds-meet/cover.svg` will 404 in production. [CITED: devactivity.com GitHub Pages 404 article]
- **Setting `git config core.ignorecase false` on Windows:** Windows NTFS cannot distinguish `file.txt` from `File.txt`; setting this breaks git operations. Safe strategy: use only lowercase names from the start, never introduce mixed-case. [CITED: dev.to git case sensitivity article]
- **Underscore-prefixed directories without .nojekyll:** Jekyll silently drops `_assets/`, `_shared/`, etc. The shared directory is named `shared/` (no underscore), but `.nojekyll` must still be in root to prevent any other Jekyll-processing surprises. [CITED: GitHub Blog "Bypassing Jekyll on GitHub Pages"]
- **Using `setInterval` or `Date.now()` for timing:** Out of scope for Phase 1, but noted per STATE.md Pitfall Watch — relevant when Phase 2 builds on this shell.
- **Injecting user-supplied or URL-derived values into `innerHTML`:** Even on static content pages, avoid this pattern to establish safe habits for Phase 2+ tool pages.
- **`auto-fit` instead of `auto-fill` for the card grid:** `auto-fit` collapses empty tracks and stretches cards beyond `max-width` on wide viewports. Use `auto-fill` to keep the card at natural column width and center the grid with `justify-content: center` on the container.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS theming with theme switching | Custom JS-driven class toggling, localStorage theme toggle | CSS `[data-attribute]` selector override | No JS needed; browser handles cascade; trivially extensible to new games |
| Responsive grid layout | JS-calculated column widths, resize observer | CSS Grid `auto-fill` + `minmax(280px, 1fr)` | Native, zero-JS, handles resize automatically |
| Breadcrumb separators | Markup `<span> / </span>` between segments | CSS `li + li::before { content: " / " }` | Screen readers won't announce CSS-generated content; markup separators are read aloud |
| Favicon at multiple sizes | Multiple PNG files + ICO bundle | Single SVG file | SVG scales perfectly to any size; one file replaces 5-6 PNG exports |

**Key insight:** Every capability in this phase has a native browser solution. Building custom JS for layout, theming, or icon serving adds maintenance burden with no benefit.

---

## Common Pitfalls

### Pitfall 1: Jekyll Drops Files Before Site Is Served

**What goes wrong:** GitHub Pages runs Jekyll by default on pushed branches. Jekyll's conventions cause it to drop: (a) files/directories starting with `_` or `.` (except `.nojekyll` itself), (b) files in `_drafts/`, and (c) files listed in `_config.yml`'s exclude list. The site deploys silently with missing assets.

**Why it happens:** Jekyll is the default static site processor for GitHub Pages unless explicitly bypassed.

**How to avoid:** Commit an empty `.nojekyll` file to the repo root as the very first commit before any other files. This signals to the Pages build system to skip Jekyll processing entirely. [CITED: GitHub Blog "Bypassing Jekyll on GitHub Pages"; STATE.md Pitfall Watch]

**Warning signs:** Assets 404 in production even though files exist in the repo. Particularly affects any file/directory beginning with `_` (though this project avoids underscore-prefixed names regardless).

### Pitfall 2: Case Mismatch Between Filename and Link

**What goes wrong:** HTML references `/games/Where-Winds-Meet/index.html` but the directory is `/games/where-winds-meet/`. On macOS/Windows (case-insensitive filesystems) this works locally. On GitHub Pages (Linux, case-sensitive), it 404s.

**Why it happens:** Windows and macOS don't distinguish case at the filesystem level, so developers never see the error locally. GitHub Pages serves from Linux.

**How to avoid:** Use exclusively lowercase filenames and directory names for every file in the project. Enforce this as a team/personal convention from the first commit. Do NOT set `git config core.ignorecase false` on Windows — this causes git to malfunction on case-insensitive NTFS. Instead, just never create mixed-case names. [CITED: devactivity.com GitHub Pages 404 article; dev.to git case sensitivity]

**Warning signs:** Site works locally, 404s on `kcharkiewicz.github.io`. Run `git ls-files | grep -E '[A-Z]'` to find uppercase-containing tracked filenames.

### Pitfall 3: Root-Absolute Paths Break on Project Sites (Not User Sites)

**What goes wrong:** A developer reads a tutorial for a GitHub Pages *project* site (served at `username.github.io/repo-name/`) where root-absolute paths like `/shared/theme.css` resolve to `username.github.io/shared/theme.css` (missing the subpath) and 404.

**Why it happens:** Confusion between user/org sites (served at domain root) and project sites (served at a subpath).

**How to avoid:** This project is a *user site* (`kcharkiewicz.github.io`) served at the apex domain. Root-absolute paths (`/shared/theme.css`, `/favicon.svg`) resolve correctly with no subpath prefix. This is confirmed — root-absolute paths are the correct and safe approach for this site. [CITED: devactivity.com mastering GitHub Pages base paths]

**Warning signs:** Would only occur if the repo were renamed from `kcharkiewicz.github.io` to something else, converting it to a project site.

### Pitfall 4: Breadcrumb Separators Announced by Screen Readers

**What goes wrong:** Breadcrumb separators implemented as literal text in markup (`<span> / </span>` or `<li> › </li>`) are read aloud by screen readers: "Game Tools Hub slash Where Winds Meet slash Spawn Timer". The `/` or `›` characters are announced as words.

**Why it happens:** Screen readers read visible text content. CSS-generated content (via `::before`) is treated differently — most screen readers skip CSS-generated decorative content.

**How to avoid:** Implement separators as CSS `li + li::before { content: " / "; color: var(--color-text-secondary); }` — not in HTML markup. [CITED: W3C APG Breadcrumb Example]

**Warning signs:** Testing with a screen reader (or NVDA/VoiceOver simulation) announces the slash characters.

### Pitfall 5: Single Card Looks Broken/Lonely in Auto-Fill Grid

**What goes wrong:** With `auto-fill` and `minmax(280px, 1fr)`, a single card on a wide viewport stretches to full container width (960px), looking like an oversized rectangle. OR the single card aligns to the left of the grid while the rest of the container is empty.

**Why it happens:** `auto-fill` creates tracks up to the container width; the 1fr card fills the full available column. Left-aligned default behavior makes a single card look orphaned.

**How to avoid:** Add `justify-content: center` on the grid container. The single card then occupies one natural-width column centered in the container. The UI-SPEC specifies exactly this. With `minmax(280px, 1fr)`, the card will be full container width only when the container is narrower than one min track + gap — i.e., on mobile, where full-width is desirable anyway. [CITED: ishadeed.com CSS Grid minmax deep dive + UI-SPEC.md]

**Warning signs:** On a 1200px viewport, the single WWM card spans the entire 960px max-width container like a banner.

### Pitfall 6: Pages Not Enabled / Wrong Branch Configured

**What goes wrong:** After pushing the initial commit to `main`, the site is not live at `kcharkiewicz.github.io` because GitHub Pages has not been enabled in the repository settings, or is configured to deploy from a different branch/folder.

**Why it happens:** GitHub Pages is not automatically enabled for new repos. The repository must be named `kcharkiewicz.github.io` exactly (lowercase), and Pages must be configured manually in Settings → Pages.

**How to avoid:** After the first push, go to Settings → Pages → Source: "Deploy from a branch" → branch: `main` → folder: `/(root)`. The first deployment takes up to 10 minutes; subsequent pushes take 1-10 minutes to go live. [CITED: GitHub Docs - Configuring a publishing source]

**Warning signs:** Visiting `kcharkiewicz.github.io` returns a 404 GitHub "There isn't a GitHub Pages site here" page even after pushing `index.html`.

---

## Code Examples

### Hub Landing Page Shell (`/index.html`)

```html
<!-- Source: CONTEXT.md CF-02, CF-03, CF-04, D-04, D-08; UI-SPEC.md -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game Tools Hub</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/shared/theme.css">
  <link rel="stylesheet" href="/shared/hub.css">
</head>
<body>
  <header class="site-header">
    <span class="site-title">Game Tools Hub</span>
  </header>
  <main>
    <div id="card-grid" class="card-grid"></div>
  </main>
  <footer class="site-footer">Game Tools Hub — personal project</footer>

  <script>
    const games = [
      {
        slug: "where-winds-meet",
        name: "Where Winds Meet",
        toolCount: 1,
        href: "/games/where-winds-meet/",
        cover: "/games/where-winds-meet/cover.svg"
      }
    ];
    // renderCards injected here (inline or from shared module)
  </script>
</body>
</html>
```

### Game Page Shell (`/games/where-winds-meet/index.html`)

```html
<!-- Source: CONTEXT.md CF-02, D-03, D-07, D-08; UI-SPEC.md -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Where Winds Meet — Game Tools Hub</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/shared/theme.css">
</head>
<body data-game="where-winds-meet">
  <header class="site-header">
    <span class="site-title">Game Tools Hub</span>
  </header>
  <nav aria-label="Breadcrumb" id="breadcrumb"></nav>
  <main>
    <h1>Where Winds Meet</h1>
    <div id="card-grid" class="card-grid"></div>
  </main>
  <footer class="site-footer">Game Tools Hub — personal project</footer>

  <script>
    // Breadcrumb items for this page
    const breadcrumbItems = [
      { label: "Game Tools Hub", href: "/" },
      { label: "Where Winds Meet", href: null }
    ];
    // Tools registry
    const tools = [
      {
        name: "Spawn Timer",
        description: "GvG jungle spawn timer",
        href: "/games/where-winds-meet/tools/spawn-timer/"
      }
    ];
    // renderBreadcrumb and renderCards inline here
  </script>
</body>
</html>
```

### CSS Grid Single-Card Centering

```css
/* Source: UI-SPEC.md + CSS Grid auto-fill pattern */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  justify-content: center;
  gap: var(--space-lg);
  max-width: 960px;
  margin-inline: auto;
  padding-inline: var(--space-xl);
}

@media (max-width: 600px) {
  .card-grid {
    padding-inline: var(--space-md);
  }
}
```

### Accessible Breadcrumb CSS

```css
/* Source: W3C APG Breadcrumb Example */
.site-breadcrumb ol {
  list-style: none;
  margin: 0;
  padding: 12px var(--space-xl);
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  background: var(--color-bg);
}

.site-breadcrumb li {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.site-breadcrumb li + li::before {
  content: " / ";
  color: var(--color-text-secondary);
  padding: 0 var(--space-xs);
}

.site-breadcrumb a {
  color: var(--color-text-secondary);
  text-decoration: none;
}

.site-breadcrumb a:hover {
  color: var(--color-text-primary);
}

.site-breadcrumb [aria-current="page"] {
  color: var(--color-accent);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GitHub Pages default Jekyll build | `.nojekyll` to bypass; or "Deploy from branch" with no Jekyll | ~2013 (nojekyll introduced) | Jekyll no longer silently drops non-Jekyll files |
| Multiple PNG favicons (16×16, 32×32, 96×96) + ICO | Single SVG favicon | ~2020 (Chrome 80, gradual adoption) | One file instead of 5-6; scales to any resolution |
| `git config core.ignorecase false` on Windows | Never set this; enforce lowercase names by convention | Ongoing knowledge | Setting it on Windows causes git malfunction; convention is safer |
| GitHub Pages auto-deploys from master/main | Must explicitly configure Pages in repo Settings | 2022+ (Actions-based deploy introduced) | First-time setup requires a manual Settings step |

**Deprecated/outdated:**
- Jekyll-based GitHub Pages build: Bypassed via `.nojekyll`; Jekyll is irrelevant for this project.
- ICO favicon: Still works as fallback, but unnecessary for modern browser audiences.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | SVG favicons are supported by Safari 26+ on iOS and macOS | Standard Stack / Favicon | If iOS Safari < 26 is a significant audience concern, an ICO fallback (`<link rel="icon" href="/favicon.ico" sizes="any">`) should be added — tab shows default globe icon without it, but site fully functions |
| A2 | GitHub Pages enables the Pages tab in settings for public repos on GitHub Free | Pitfall 6 | If repo is private, Pages requires GitHub Pro; user must ensure repo is public |
| A3 | The breadcrumb rendering function (6 lines of JS) is acceptable to duplicate inline per page vs extracting to a shared module | Architecture Patterns / Pattern 3 | If duplication feels unacceptable, an ES module at `/shared/breadcrumb.js` can be imported — but adds a `<script type="module">` dependency and async load |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed. (Three low-stakes assumptions remain; all have safe fallbacks.)

---

## Open Questions

1. **Should the breadcrumb renderer be a shared ES module or inlined per page?**
   - What we know: Inlining 6 lines per page is DRY enough for 3 pages; a shared module requires `<script type="module">` and browser ES module support.
   - What's unclear: Personal preference for duplication tolerance.
   - Recommendation: Inline for Phase 1 (3 pages). Extract to `/shared/breadcrumb.js` as a module in Phase 2 when the fourth page (timer interactive) is added.

2. **Does the repo `kcharkiewicz.github.io` already exist on GitHub?**
   - What we know: Research cannot confirm the repo's current state from this machine.
   - What's unclear: Whether the repo exists and whether Pages is already enabled.
   - Recommendation: Plan should include a "verify repo exists and Pages is enabled" task as Wave 0.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | No runtime dep (static files only) | ✓ | 22.5.1 | — |
| npm | No packages to install | ✓ | 10.8.2 | — |
| git | Version control + first commit | ✓ | 2.53.0 | — |
| GitHub repository (`kcharkiewicz.github.io`) | SITE-01 deployment | Unknown | — | Create new public repo |
| GitHub Pages (enabled on repo) | SITE-01 | Unknown | — | Enable in Settings → Pages |
| Browser for local preview | Manual verification | ✓ | Any modern browser | — |

**Missing dependencies with no fallback:** None — all confirmed available or trivially creatable.

**Missing dependencies with fallback:** GitHub repo + Pages configuration (unknown state — plan must include a setup task).

---

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None (plain static HTML — no test runner needed for Phase 1) |
| Config file | None |
| Quick run command | Open `/index.html` in browser via `python3 -m http.server 8080` or equivalent |
| Full suite command | Manual checklist (see Phase Requirements → Test Map below) |

Phase 1 has zero JavaScript business logic and no npm project — no automated test runner applies. Validation is structural (file existence, link correctness, color contrast, visual inspection). Wave 0 establishes a local HTTP server for testing root-absolute paths.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SITE-01 | Site reachable at kcharkiewicz.github.io | smoke/manual | `curl -I https://kcharkiewicz.github.io` (after deploy) | ❌ Wave 0 |
| SITE-02 | No 404s; .nojekyll present; lowercase paths | structural | `git ls-files \| grep -E '[A-Z]'` → zero results | ❌ Wave 0 |
| HUB-01 | Hub landing shows WWM game card with link | visual/manual | Local HTTP server + browser inspection | ❌ Wave 0 |
| HUB-02 | WWM game page shows spawn-timer tool card | visual/manual | Local HTTP server + browser inspection | ❌ Wave 0 |
| HUB-03 | Every non-root page has breadcrumb with correct ancestors | structural/manual | Browser inspection of nav[aria-label="Breadcrumb"] | ❌ Wave 0 |
| HUB-04 | All 3 URLs bookmarkable; no 404 | structural/smoke | `curl -s -o /dev/null -w "%{http_code}" https://kcharkiewicz.github.io/games/where-winds-meet/` | ❌ Wave 0 |
| HUB-05 | Add second registry entry; no file structural change | extensibility/manual | Insert second item in games array; verify new card renders | ❌ Wave 0 |
| THEME-01 | Dark theme applied on all 3 pages | visual/manual | Browser inspection (background `#0f1115`) | ❌ Wave 0 |
| THEME-02 | WWM accent visible; hub landing has neutral accent | visual/manual | DevTools: `getComputedStyle(body).getPropertyValue('--color-accent')` | ❌ Wave 0 |
| THEME-03 | Custom favicon visible in browser tab | visual/manual | Browser tab inspection after local serve | ❌ Wave 0 |

### Local HTTP Server (Required for Root-Absolute Path Testing)

Root-absolute paths (`/shared/theme.css`) resolve relative to the server root, not the filesystem. Opening HTML files directly via `file://` will fail to load these assets. A local HTTP server is required:

```bash
# Python (available: Python 3.10.11 confirmed)
python3 -m http.server 8080 --directory "E:/Projekty/GithubIO"
# Then open: http://localhost:8080
```

### Sampling Rate

- **Per task commit:** Visual inspection in browser (30 seconds)
- **Per wave merge:** Full manual checklist against Req IDs above
- **Phase gate:** All 10 Req IDs manually verified + `curl` smoke test on live Pages URL before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] Local HTTP server command documented in a dev note or README
- [ ] `.nojekyll` file created (must be first commit)
- [ ] `git ls-files | grep -E '[A-Z]'` case audit script noted

*(No automated test files needed — Phase 1 is structure + visual, not logic.)*

---

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1` in `.planning/config.json`.

### Applicable ASVS Categories (ASVS Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this phase (static public site) |
| V3 Session Management | No | No sessions in this phase |
| V4 Access Control | No | No protected resources; all content is public |
| V5 Input Validation | No (Phase 1) | No user input or forms in this phase; registry data is static developer-defined |
| V6 Cryptography | No | No sensitive data handled in this phase |
| V7 Error Handling | Partial | No dynamic errors; 404 handled by GitHub Pages default; no custom error page needed in Phase 1 |
| V13 API / Web Service | No | No APIs; pure static file delivery |

**Phase 1 security surface is minimal:** no user input, no dynamic server, no authentication, no sensitive data. The only security-relevant decision is **never injecting URL-derived or user-supplied values into `innerHTML`** — establish this as a code convention from the first file, even though no user input exists in Phase 1, to prevent habit-drift into Phase 2+ tool pages.

### Known Threat Patterns for Static HTML

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via innerHTML with user-supplied data | Tampering | Registry data is static; never pass `location.href`, URL params, or `document.cookie` to innerHTML — encode if ever needed in future phases |
| Dependency confusion / supply chain | Tampering | Zero external dependencies in this phase; nothing to confuse |
| Clickjacking | Tampering | Out of scope for ASVS Level 1 / personal tool; no sensitive actions exist |

---

## Sources

### Primary (HIGH confidence)

- [GitHub Docs — Configuring a publishing source for GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) — "Deploy from a branch" vs Actions; user/org site behavior
- [GitHub Docs — Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) — repository naming requirement; setup steps
- [GitHub Docs — Troubleshooting 404 errors for GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites) — case-sensitivity, index.html requirement
- [W3C APG — Breadcrumb Example](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/examples/breadcrumb/) — `aria-label="Breadcrumb"`, `aria-current="page"`, CSS separator pattern
- [MDN — Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties) — custom property cascade and inheritance
- [MDN — :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — browser support baseline
- [Can I Use — SVG favicons](https://caniuse.com/link-icon-svg) — 88.52% global support; Chrome 80+, Firefox 41+, Edge 80+, Safari 26+
- [W3C WCAG 2.1 — Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) — 4.5:1 normal text, 3:1 large text
- [web.dev — Building an adaptive favicon](https://web.dev/articles/building/an-adaptive-favicon) — SVG favicon `link rel` pattern
- CONTEXT.md / STATE.md / UI-SPEC.md — locked architectural decisions (CF-01 through D-10)

### Secondary (MEDIUM confidence)

- [devactivity.com — Mastering GitHub Pages base paths](https://devactivity.com/posts/apps-tools/mastering-github-pages-configure-base-paths-for-seamless-project-deployments/) — root-absolute paths safe on user/org sites
- [devactivity.com — Decoding GitHub Pages 404s](https://devactivity.com/insights/decoding-github-pages-404s-essential-fixes-for-broken-links/) — case sensitivity confirmed Linux filesystem
- [dev.to — Fixing File Renaming Issues in Git](https://dev.to/iediong/fixing-file-renaming-issues-in-git-handling-case-sensitivity-and-coreignorecase-1mf6) — core.ignorecase false risks on Windows
- [ishadeed.com — CSS Grid minmax deep dive](https://ishadeed.com/article/css-grid-minmax/) — auto-fill vs auto-fit; single card centering pattern
- [benfrain.com — HTML templating with ES2015 template literals](https://benfrain.com/html-templating-with-vanilla-javascript-es2015-template-literals/) — template literal card rendering pattern

### Tertiary (LOW confidence)

- None — all claims in this research are backed by primary or secondary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pure browser/platform native; no library versions to track
- GitHub Pages deployment: HIGH — official GitHub Docs consulted directly
- Architecture patterns: HIGH — W3C APG + MDN + CONTEXT.md locked decisions
- WCAG contrast: HIGH — exact hex values from UI-SPEC.md; verified against WCAG 2.1 criteria
- SVG favicon support: HIGH — caniuse.com data (88.52%)
- Pitfalls: HIGH — multiple official and community sources cross-verified

**Research date:** 2026-06-04
**Valid until:** 2026-12-04 (stable browser platform features; GitHub Pages behavior rarely changes)
