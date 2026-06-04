# kcharkiewicz.github.io — Game Tools Hub

Personal static site hosting companion tools for video games.

## Local Development

Root-absolute asset paths (`/shared/theme.css`, `/favicon.svg`, etc.) only resolve
correctly under an HTTP server root — NOT via `file://` directly in the browser.

Run a local server from the repo root:

```
python -m http.server 8080
```

Then open: http://localhost:8080

## Case Audit

All filenames must be all-lowercase (GitHub Pages runs on Linux, case-sensitive).
Verify with:

```
git ls-files | grep -E '[A-Z]'
```

This command must return zero results. If it returns any filenames, rename them to lowercase.
