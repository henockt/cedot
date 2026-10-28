---
name: run-cedot
description: Launch cedot (Express/WebSocket backend in core/ + Svelte/Vite UI in ui/) and drive the collaborative editor in a real browser.
---

# Running cedot

Two processes. Start both in the background.

```bash
(cd core && npm install && npm run dev)            # http/ws on :3000 (PORT env overrides)
(cd ui && npm install && npm run dev -- --host 127.0.0.1)   # http://127.0.0.1:5173
```

Ready when `core` logs `Server running on port 3000` and Vite prints `Local:`.

- UI: `http://127.0.0.1:5173/#/` (home) and `#/session/<id>` (editor).
- The editor connects to `/ws/<id>` on its own origin; Vite proxies that to
  core (`CORE_URL`, default `http://localhost:3000`) and strips `/ws`. This is
  what makes it work when the user reaches the UI through port forwarding,
  where :3000 isn't reachable from their browser. `VITE_WS_URL` overrides it.
- `core` also serves its own plain textarea page at `http://localhost:3000/<id>`.
  It uses the same pad key, so the textarea and the Svelte editor share pads.
- To check whether a user's browser actually connected, grep the core log for
  `Client connected to`.

## Protocol

JSON frames, documented at the top of `core/src/wss.ts`. Text is sent as the
whole document (`text`); the pad's language (`lang`) and connected-client count
(`peers`) are synced too. State is in memory and is lost on restart.

## Gotcha: duplicate CodeMirror packages

If syntax highlighting silently disappears, check that `@codemirror/language`,
`@codemirror/state` and `@codemirror/view` each resolve to one copy
(`npm ls @codemirror/language`). Fix with `npm dedupe`, then restart Vite with
`--force` to drop its prebundled deps.

## Driving it

Open the same `#/session/<id>` in two pages, type in one, and assert the other
page's `.cm-content` matches. Wait for the header text `connected` before typing.

```bash
mkdir -p $SCRATCH/pw && cd $SCRATCH/pw && npm init -y && npm i playwright
cp <repo>/.claude/skills/run-cedot/drive.mjs . && node drive.mjs $SCRATCH
```

`drive.mjs` is ESM, so `playwright` must sit in a `node_modules` next to it
(NODE_PATH is ignored). If the installed Playwright version doesn't
match the cached browser, pass the binary via `CHROME=~/.cache/ms-playwright/chromium-XXXX/chrome-linux/chrome`.

Typing `{` + Enter in tests produces an extra `}` from CodeMirror's
auto-close brackets. That's expected, not a sync bug.
