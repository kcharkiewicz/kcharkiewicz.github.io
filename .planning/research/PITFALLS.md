# Pitfalls Research

**Domain:** Browser-based repeating countdown timer + static GitHub Pages multi-tool hub
**Researched:** 2026-06-04
**Confidence:** HIGH (timer/audio pitfalls verified against MDN, Chrome Dev Blog, WebKit bug tracker; GH Pages verified against GitHub Docs)

---

## Critical Pitfalls

### Pitfall 1: Timer Drift from Naive setInterval

**What goes wrong:**
`setInterval(tick, 1000)` accumulates error over time because the callback fires at a minimum of the specified interval — not exactly. Each invocation is slightly late. After 3 minutes the displayed time can be several seconds behind wall-clock time. For a GvG spawn timer, a 3–5 second drift per cycle means alerts fire noticeably late and the user misses the spawn.

**Why it happens:**
JavaScript runs on a single thread. If the main thread is busy (layout, repaint, other script), the interval callback is queued and fires after the busy work completes. The delay compounds across hundreds of ticks. Developers trust the delay argument as a guarantee rather than a minimum.

**How to avoid:**
Never track elapsed time by counting ticks. Instead, record a start timestamp with `performance.now()` or `Date.now()` at the start of each cycle and compute remaining time as `targetTime - Date.now()` on every tick. The tick interval itself (e.g. 200 ms) only drives UI refresh rate; the time calculation is always wall-clock-anchored. Pattern:

```js
let cycleEnd; // absolute timestamp when this cycle ends

function startCycle(durationMs) {
  cycleEnd = Date.now() + durationMs;
  intervalId = setInterval(update, 200);
}

function update() {
  const remaining = cycleEnd - Date.now();
  if (remaining <= 0) { onCycleComplete(); return; }
  renderDisplay(remaining);
}
```

**Warning signs:**
- Timer displayed time falls behind a phone stopwatch after 2+ minutes.
- Alerts consistently fire 2–4 seconds late.
- Tick counter * 1000 !== elapsed wall time.

**Phase to address:** Timer core implementation (first coding phase).

---

### Pitfall 2: Background-Tab Throttling Stalls the Timer

**What goes wrong:**
When the user switches to the game window and the browser tab containing the timer goes to the background, Chrome (since v88) throttles chained timers to once per minute if the tab has been hidden for 5+ minutes and has been silent for 30+ seconds. Firefox applies a minimum 1-second interval in hidden tabs. The countdown freezes or jumps wildly when the user returns. Alerts that should fire mid-game never fire.

**Why it happens:**
Browsers throttle background tab timers to save battery and CPU. The throttling is aggressive: Chrome's "intensive throttling" reduces a 1-second interval to once per 60 seconds. This is a deliberate platform policy, not a bug.

**How to avoid:**
Two complementary defences:

1. **Wall-clock anchoring** (from Pitfall 1): Even if the tick fires late, the remaining-time calculation is always accurate. The UI snaps to the correct value when the tab regains focus.

2. **Web Worker for scheduling**: Move the `setInterval` into a `Worker`. Worker timers are not subject to background-tab throttling. The worker posts a message to the main thread on each tick; the main thread renders and plays audio on receipt.

```js
// timer.worker.js
let id;
self.onmessage = ({ data }) => {
  if (data.type === 'start') id = setInterval(() => self.postMessage({ type: 'tick' }), 200);
  if (data.type === 'stop')  clearInterval(id);
};
```

Use the Page Visibility API (`document.visibilitychange`) as a safety net: when the tab becomes visible again, recalculate remaining time from wall clock and immediately render the correct state regardless of how many ticks were skipped.

**Warning signs:**
- Timer stops updating when the browser is minimised during manual testing.
- Alert does not fire while the tab is hidden.
- Timer jumps forward suddenly when focus returns.

**Phase to address:** Timer core implementation; confirmed during integration testing with tab-switching.

---

### Pitfall 3: Web Audio Blocked by Autoplay Policy — No Sound on Start

**What goes wrong:**
`new AudioContext()` created on page load starts in `suspended` state in all major browsers (Chrome since v71, Firefox, Safari). Calling `.play()` or scheduling oscillator nodes before a user gesture produces no sound and may throw `NotAllowedError`. The timer appears to work perfectly but the audio alert is silently dropped, which is the entire point of the tool.

**Why it happens:**
Browser autoplay policy requires that audio output be initiated (or at minimum resumed) within the call stack of a direct user gesture (click, keydown, touchstart). Creating an `AudioContext` at module init time, before any interaction, leaves it in `suspended` state. The `start()` call on a node scheduled later will succeed technically but produce no output because the context never ran.

**How to avoid:**
- Create the `AudioContext` lazily inside the first user-gesture handler (e.g. the "Start" button click), OR
- Create it at init but call `audioCtx.resume()` inside the "Start" handler before scheduling any nodes.
- Always check `audioCtx.state` before playing; call `resume()` and `await` the promise if it is `'suspended'`.
- Provide a visible "Unlock Audio" button or note if the context cannot be resumed, so the user knows why there is no sound.

```js
async function playAlert() {
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  // schedule oscillator / buffer source here
}
```

**Warning signs:**
- No sound on first run after page load.
- Console shows `DOMException: The AudioContext was not allowed to start`.
- `audioCtx.state` logs `'suspended'` when alert is expected.

**Phase to address:** Audio alert implementation, immediately when writing the first beep.

---

### Pitfall 4: iOS Silent Switch Mutes Web Audio

**What goes wrong:**
On iOS, when the hardware ringer/silent switch is in the muted position, the Web Audio API is routed to the "ringer" audio channel, which is muted. The user hears nothing even though audio is technically playing. This is exactly the failure mode that matters here: a player using a phone as a second screen with the ringer muted (common during gaming sessions) gets no alerts.

**Why it happens:**
iOS maps Web Audio to the ringer channel by default. HTML `<audio>` and `<video>` elements use the media playback channel, which respects silent-mode differently (video at least stays audible). Apple has an open WebKit bug (237322) for this behaviour but it has not been fixed.

**How to avoid:**
Force the audio session onto the media playback channel by continuously playing a short, silent `<audio>` element alongside the Web Audio output. This "tricks" iOS into routing Web Audio to the media channel. Libraries that implement this: `swevans/unmute` and `feross/unmute-ios-audio`. The technique requires a user gesture to start the silent audio element (same constraint as Pitfall 3).

Alternatively, provide a clear UI callout: "On iOS, disable silent mode or use headphones for audio alerts."

**Warning signs:**
- Sound works on desktop / Android but not on iOS with ringer switch muted.
- Audio context state is `'running'` but no sound is audible.

**Phase to address:** Audio alert implementation; verified on an iOS device before considering the feature done.

---

### Pitfall 5: Audio Fails on Repeated Cycles (Context / Node Reuse)

**What goes wrong:**
Web Audio nodes (`OscillatorNode`, `AudioBufferSourceNode`) are single-use. After `.stop()` is called (or the scheduled end time passes) they cannot be restarted. Calling `.start()` on an already-started node throws `InvalidStateError`. In a repeating timer that fires an alert at the end of each cycle, this surfaces as: first beep plays, all subsequent cycles are silent.

**Why it happens:**
The `AudioContext` itself is reusable, but individual source nodes are not. Developers create one node at module level and try to replay it each cycle.

**How to avoid:**
Create a fresh source node for every alert. The `AudioContext` lives for the page lifetime; only the source nodes are created per-alert:

```js
function beep(ctx, frequency = 880, duration = 0.3) {
  const osc = ctx.createOscillator(); // new node every time
  const gain = ctx.createGain();
  osc.connect(gain).connect(ctx.destination);
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}
```

**Warning signs:**
- First alarm plays; subsequent cycles are silent.
- Console shows `InvalidStateError: Cannot call start on an AudioBufferSourceNode that has already been started`.

**Phase to address:** Audio alert implementation.

---

### Pitfall 6: GitHub Pages Silently Drops Underscore-Prefixed Files and Folders

**What goes wrong:**
Jekyll (the default processor GitHub Pages applies) treats files and directories whose names begin with an underscore as internal template resources and does not copy them to the built site. A folder named `_assets/` or a file named `_config.js` simply does not exist at the served URL. Requests return 404 with no warning in the build log.

**Why it happens:**
GitHub Pages runs Jekyll by default even when you are not deliberately using it. Jekyll's convention for "private" files uses an underscore prefix. Developers unaware of this create asset structures with underscore names that work locally but 404 in production.

**How to avoid:**
Place an empty `.nojekyll` file in the root of the publishing source. This disables Jekyll processing entirely, and all files are served as-is. The file must be committed to the branch/folder that is the GitHub Pages source. Do not use underscore-prefixed folder names even with `.nojekyll` in place — it is safer to avoid them altogether.

For this project: since the site is pure HTML/CSS/JS with no Jekyll templates, `.nojekyll` should be committed as the very first file in the repo.

**Warning signs:**
- Assets load locally but return 404 on `github.io`.
- Folder names start with `_` (e.g. `_js/`, `_css/`).
- No `.nojekyll` file in the repository root.

**Phase to address:** Repository setup / initial deployment (before any asset structure is finalised).

---

### Pitfall 7: Relative vs. Absolute Asset Paths Break on Subdirectory Deployments

**What goes wrong:**
Root-absolute paths (`/css/style.css`, `/js/app.js`) resolve correctly on a user/org site served at `kcharkiewicz.github.io` (the root of the domain). However, if the project is ever hosted as a project site (`kcharkiewicz.github.io/game-tools/`), all root-absolute paths point to the domain root and return 404. Links between pages inside the site also break if they mix path styles.

**Why it happens:**
Browsers interpret paths starting with `/` as relative to the origin root, not the document's directory. A project site is not at the origin root.

**How to avoid:**
For this site (a user/org site at the apex of the domain): root-absolute paths (`/css/style.css`) are safe and recommended for clarity. Document this decision. If the architecture ever changes to a project site, all paths must be audited.

As a belt-and-suspenders practice: use consistent document-relative paths (`../css/style.css`) within page subdirectories, which work regardless of deployment location.

**Warning signs:**
- CSS / JS loads on `index.html` but not on sub-pages.
- Browser devtools shows 404s for assets on pages in subdirectories.
- Inconsistent mix of `/absolute` and `relative` paths in markup.

**Phase to address:** Repository setup and site structure definition.

---

### Pitfall 8: Case-Sensitive Filenames Cause 404s on GitHub Pages (Linux Server)

**What goes wrong:**
A file committed as `Timer.js` is referenced as `timer.js` in a `<script>` tag. On Windows and macOS (case-insensitive filesystems) the page loads fine. GitHub Pages is served from Linux, which is case-sensitive: `timer.js` and `Timer.js` are different files. The page 404s on the live site only.

**Why it happens:**
Local development on Windows/Mac never exposes the bug. Git on Windows may also silently ignore case-only renames (`core.ignorecase = true` by default).

**How to avoid:**
- Adopt a strict lowercase-only naming convention for all files and folders from the start.
- Configure Git to respect case: `git config core.ignorecase false` in the repo.
- Use a linter or pre-commit hook that flags uppercase characters in committed filenames.

**Warning signs:**
- 404 errors only on the live site, never locally.
- File names contain uppercase letters.
- The local OS is Windows or macOS.

**Phase to address:** Repository setup; enforced from the first commit via naming convention.

---

### Pitfall 9: localStorage Errors Crash the App in Private Mode and on Quota

**What goes wrong:**
In Safari Private Browsing, `localStorage` throws `QuotaExceededError` immediately on any `setItem` call (quota is 0). In other browsers, private mode may return `null` from `getItem` even for keys that "exist". If the preset-save code is not wrapped in try/catch, an uncaught exception crashes the entire timer page — the user loses their running timer.

Additionally, if `JSON.parse` is called on a stored value that was corrupted (e.g. partial write, manual edit), it throws `SyntaxError`.

**Why it happens:**
`localStorage` access silently fails or throws in restrictive environments. Developers assume the API always works in the browser. JSON.parse is called without validation on values from external storage.

**How to avoid:**
Wrap every `localStorage` call in try/catch. Treat storage as "best effort" — the timer must function even if persistence is completely unavailable:

```js
function savePresets(presets) {
  try {
    localStorage.setItem('presets', JSON.stringify(presets));
  } catch (_) {
    // Storage unavailable (private mode, quota) — silently skip
  }
}

function loadPresets() {
  try {
    const raw = localStorage.getItem('presets');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return []; // Corrupted data — return empty
  }
}
```

**Warning signs:**
- App throws uncaught exceptions in Safari private mode.
- Console shows `QuotaExceededError` or `SyntaxError` from storage code.
- Presets feature works in one browser but crashes another.

**Phase to address:** Preset persistence implementation.

---

### Pitfall 10: localStorage Schema Migration — Stored Data Becomes Invalid After a Code Change

**What goes wrong:**
An old preset stored as `{ name: "Camp A", duration: 180 }` breaks when the schema changes to `{ name: "Camp A", durationMs: 180000, repeats: 1 }`. On next load, `JSON.parse` succeeds but the app tries to read `.durationMs` and gets `undefined`, producing `NaN` in the timer. The user's saved presets silently malfunction.

**Why it happens:**
`localStorage` persists across page refreshes and code deployments. Once a user saves data in format v1, it stays in format v1 until explicitly migrated. Developers who change the data model forget that existing users have old-format data in their browsers.

**How to avoid:**
Store a schema version alongside the data and run a migration on load:

```js
const SCHEMA_VERSION = 2;

function loadPresets() {
  try {
    const raw = localStorage.getItem('presetsV2'); // key includes version
    if (!raw) return migrateFromV1();
    return JSON.parse(raw);
  } catch (_) {
    return [];
  }
}
```

For this project, presets are simple and users are few (single user). A practical approach: include `schemaVersion` in the stored object; on load, if version mismatches, discard and start fresh (with a user-visible notice "Presets reset after update"). This is acceptable for a personal tool.

**Warning signs:**
- Preset values are `NaN` or `undefined` after a code deployment.
- `console.log(JSON.parse(localStorage.getItem(...)))` reveals old-format objects.

**Phase to address:** Preset persistence implementation; revisit when changing the preset data model.

---

### Pitfall 11: Screen Sleep Kills the Second-Screen Use Case

**What goes wrong:**
Mobile browsers let the device sleep after 30–60 seconds of inactivity. When the timer page is displayed on a second screen (phone propped beside the monitor) and the user is not touching the phone, the screen goes dark and the display is no longer visible. Audio may continue playing but the user cannot see the remaining time.

**Why it happens:**
Standard OS power-management behaviour. The browser tab counts as "inactive" from the OS perspective if there are no touch/pointer events.

**How to avoid:**
Request a screen wake lock while the timer is running using the Screen Wake Lock API (supported in all major browsers including Safari on iOS since 2021):

```js
let wakeLock = null;

async function acquireWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (_) {
    // Wake lock denied (e.g. battery saver mode) — acceptable, log only
  }
}

async function releaseWakeLock() {
  if (wakeLock) { await wakeLock.release(); wakeLock = null; }
}
```

Acquire on timer start, release on timer stop or page hide. Re-acquire on `visibilitychange` to `visible` (wake lock is automatically released when the tab goes to the background).

**Warning signs:**
- Phone screen goes black after <1 minute while timer is running.
- `navigator.wakeLock` is `undefined` (browser does not support it — add graceful degradation).

**Phase to address:** Timer UI / second-screen hardening phase, or as part of initial timer implementation.

---

### Pitfall 12: GitHub Pages Caching Serves Stale Assets After Deployment

**What goes wrong:**
After pushing a fix, the live site continues serving the old CSS or JS for minutes to hours. Users (including the developer testing) are confused about whether the deployment succeeded. GitHub Pages CDN caches assets; the CDN TTL is roughly 10 minutes but browsers additionally apply heuristic caching (up to days) when no `Cache-Control` header is set.

**Why it happens:**
GitHub Pages does not allow custom `Cache-Control` headers per file. The CDN and browser caches operate independently and GitHub does not guarantee instant propagation.

**How to avoid:**
- Use cache-busting query strings or versioned filenames for CSS/JS assets: `<script src="js/timer.js?v=2"></script>` or `js/timer.v2.js`.
- For development/testing: use hard-refresh (Ctrl+Shift+R) or open in a private window after each push.
- Accept the CDN delay (~10 min) as a known operational characteristic; do not redeploy repeatedly in quick succession.

**Warning signs:**
- Changes pushed to `main` are not visible on the live site after 15+ minutes.
- Devtools "Network" tab shows `304 Not Modified` or `(from cache)` for updated files.

**Phase to address:** Deployment workflow setup; cache-busting applied when final asset filenames are defined.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Count ticks to track time (no wall-clock anchor) | Simpler initial code | Drift accumulates; timer becomes inaccurate | Never — fix it in the first implementation |
| Single AudioContext node reused across cycles | Fewer objects | Silent alerts after cycle 1 | Never |
| No try/catch around localStorage | Less boilerplate | App crashes in private mode or on quota exceeded | Never |
| `setInterval` on main thread only, no Worker | No Worker overhead | Timer stalls when tab is backgrounded | Acceptable in MVP if wall-clock anchoring is in place; Worker is an enhancement |
| No schema version on localStorage presets | Simpler first save | Old-format data causes silent bugs after schema changes | Acceptable in MVP if the schema is unlikely to change in v1 |
| No `.nojekyll` in repo | Nothing to do | Underscore-named files silently 404 | Never — add it in the first commit |
| Root-absolute asset paths on a user site | Simpler and consistent | Breaks if ever moved to a project site | Acceptable for a permanent user site; document the assumption |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub Pages + Jekyll | Not adding `.nojekyll`; underscore folders disappear | Commit `.nojekyll` to publishing root in the first push |
| GitHub Pages + Windows dev | Committing mixed-case filenames that work locally | `git config core.ignorecase false`; use all-lowercase names |
| Web Audio API + autoplay | Creating `AudioContext` at page load, playing without gesture | Create or `resume()` inside the user gesture handler (Start button click) |
| Web Audio API + iOS silent switch | Relying solely on Web Audio for audio output | Play a silent `<audio>` element on user gesture to force media channel |
| localStorage + private browsing | No try/catch, assuming setItem always succeeds | Wrap all storage calls in try/catch; degrade gracefully |

---

## Performance Traps

For a single-user personal tool, performance bottlenecks are not a concern at scale. The only relevant trap:

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `setInterval` at 16 ms (attempting 60fps renders) on a low-end phone | Battery drain; UI jank | Use 100–200 ms interval for timer updates; use rAF only if animating progress bars | Continuously drains battery on devices in second-screen use |
| Leaking `AudioContext` objects (creating a new context per alert) | Audio starts failing; browser logs context limit warnings | Reuse one `AudioContext` for the page lifetime; create only source nodes per alert | After ~6 alerts (Chrome warns at 6+ contexts) |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual indication that audio is blocked | User starts timer, hears nothing, does not know why | Show an "Audio unlocked" / "Audio blocked — click Start to enable" state indicator |
| No confirmation that timer fired while tab was in background | User returns to tab, cannot tell if the alert went off | Flash the display or update the title bar (`document.title`) on cycle completion so the user can see "FIRED" in the tab list |
| Presets silently not saved (private mode) | User saves a preset, refreshes, it is gone with no explanation | Show a brief "Saved" confirmation; show a warning if storage is detected as unavailable |
| Silent failure when wake lock is denied | Screen goes to sleep; user unaware | Log the denial; optionally display "Screen may sleep — wake lock unavailable" |
| No feedback on cycle count | User cannot tell which cycle just fired | Display current cycle number (e.g. "Cycle 2 / 5") and remaining cycle count prominently |

---

## "Looks Done But Isn't" Checklist

- [ ] **Timer accuracy:** Verify against a wall clock after 5 minutes running — drift should be < 0.5 seconds.
- [ ] **Background tab:** Tab is switched away for 2+ minutes; return and verify timer is within 1 second of correct time and no alerts were missed (or were replayed).
- [ ] **Audio on load:** Refresh the page, immediately click Start — confirm audio plays on the first cycle end.
- [ ] **Audio on iOS silent mode:** Test on a real iOS device with the ringer switch muted — sound must still play.
- [ ] **Repeated alerts:** Run 5 full cycles in sequence — confirm audio fires on every cycle, not just the first.
- [ ] **Private mode:** Open the site in Safari Private Browsing — no crash, timer functions, presets silently not saved.
- [ ] **localStorage corruption:** Manually write invalid JSON to the presets key in DevTools — page loads without crashing.
- [ ] **Screen sleep:** Start timer on mobile, leave untouched for 2 minutes — screen should not go dark while timer runs.
- [ ] **GitHub Pages deployment:** Push a change; verify it appears at `kcharkiewicz.github.io` after 15 minutes.
- [ ] **Case sensitivity:** All filenames are lowercase; no 404s on the live site for any asset.
- [ ] **`.nojekyll` present:** Confirmed at root of repository.
- [ ] **Sub-page asset paths:** All pages in subdirectories (game pages) correctly load shared CSS/JS.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Timer drift discovered in production | LOW | Refactor tick handler to use wall-clock anchoring; no data migration needed |
| Background throttle discovered after shipping | MEDIUM | Add Web Worker timer; requires Worker file + message-passing refactor |
| Audio blocked — discovered during demo | LOW | Add `audioCtx.resume()` call to the Start button handler |
| iOS silent switch — discovered in testing | MEDIUM | Integrate `swevans/unmute` or equivalent silent-audio-element hack; test on device |
| Audio node reuse bug (silent after cycle 1) | LOW | Move node creation inside the alert function; one-line fix |
| `.nojekyll` missing — assets 404 on Pages | LOW | Add and push the file; propagates within 10 minutes |
| Case-sensitivity 404s on live site | LOW | Rename files to lowercase; `git mv` required on case-insensitive OS |
| localStorage crash in private mode | LOW | Wrap storage calls in try/catch; no data loss |
| Schema migration breakage | MEDIUM | Add version check + migration function; existing bad data purged and user notified |
| Stale CDN cache on Pages | LOW | Hard-refresh; add `?v=N` cache buster to asset URLs; wait 10–15 min |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Timer drift (Pitfall 1) | Timer core implementation | Run timer 5 min against wall clock; drift < 0.5 s |
| Background tab throttling (Pitfall 2) | Timer core implementation | Switch tabs for 2 min; verify correct resume |
| Autoplay policy blocking audio (Pitfall 3) | Audio alert implementation | Hard refresh; click Start; first beep fires |
| iOS silent switch (Pitfall 4) | Audio alert implementation | Test on iOS device with ringer muted |
| Audio node single-use (Pitfall 5) | Audio alert implementation | Run 5 cycles; all 5 beeps fire |
| Jekyll drops underscore files (Pitfall 6) | Repository setup (first commit) | `.nojekyll` present; no underscore folders |
| Relative vs. absolute paths (Pitfall 7) | Repository setup | All sub-pages load CSS/JS without 404 |
| Case-sensitive filenames (Pitfall 8) | Repository setup | All filenames lowercase; live site has no 404s |
| localStorage private mode crash (Pitfall 9) | Preset persistence implementation | Open in Safari private; no crash |
| localStorage schema migration (Pitfall 10) | Preset persistence implementation | Change schema; verify old data handled gracefully |
| Screen sleep on second screen (Pitfall 11) | Timer UI / second-screen hardening | Mobile untouched 2 min; screen stays on |
| GitHub Pages CDN caching (Pitfall 12) | Deployment workflow setup | Cache-busting in asset URLs; changes visible within 15 min |

---

## Sources

- [Chrome Dev Blog: Heavy throttling of chained JS timers in Chrome 88](https://developer.chrome.com/blog/timer-throttling-in-chrome-88)
- [Chrome Dev Blog: Autoplay policy in Chrome](https://developer.chrome.com/blog/autoplay)
- [Chrome Dev Blog: Web Audio, Autoplay Policy and Games](https://developer.chrome.com/blog/web-audio-autoplay)
- [MDN: Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [GitHub Blog: Bypassing Jekyll on GitHub Pages](https://github.blog/news-insights/bypassing-jekyll-on-github-pages/)
- [GitHub Docs: Troubleshooting 404 errors for GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites)
- [GitHub Docs: Securing your GitHub Pages site with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [WebKit Bug 237322: Web Audio API muted when iOS ringer is muted](https://bugs.webkit.org/show_bug.cgi?id=237322)
- [HackWild: More Accurate JavaScript Timers with Web Workers](https://hackwild.com/article/web-worker-timers/)
- [SitePoint: Creating Accurate Timers in JavaScript](https://www.sitepoint.com/creating-accurate-timers-in-javascript/)
- [Nolan Lawson: Why do browsers throttle JavaScript timers?](https://nolanlawson.com/2025/08/31/why-do-browsers-throttle-javascript-timers/)
- [swevans/unmute: Enables web audio with iOS mute switch](https://github.com/swevans/unmute)
- [web.dev: Screen Wake Lock API supported in all browsers](https://web.dev/blog/screen-wake-lock-supported-in-all-browsers)
- [TrackJS: How to fix setItem on Storage errors](https://trackjs.com/javascript-errors/failed-to-execute-setitem-on-storage/)

---
*Pitfalls research for: browser countdown timer + GitHub Pages static hub*
*Researched: 2026-06-04*
