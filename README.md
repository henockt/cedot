<img src="ui/public/favicon.svg" width="48" alt="">

# cedot

A collaborative code pad. Open a pad, send the link, and edit together in real time.

## Features

- Live editing: everyone on a pad sees changes as they're typed
- Other people's cursors and selections, each in their own color with a name tag
- Syntax highlighting for 13 languages; the language is shared across the pad
- Shows how many people are on the pad and whether you're connected
- Reconnects automatically; edits made while offline are sent when the connection returns
- Light and dark themes (or follow the system), line wrapping, adjustable font size
- Copy the pad link, or download the code as a file (`Ctrl+S`)

## Project layout

```
core/   Express + ws server: holds pad state and relays edits
ui/     Svelte 5 + Vite frontend with a CodeMirror 6 editor
```

## Running locally

Requires Node.js 20.19 or newer.

```bash
# backend, on :3000
cd core
npm install
npm run dev

# frontend, on :5173 (in another terminal)
cd ui
npm install
npm run dev
```

Open http://localhost:5173, click **new pad**, and open the same link in a second tab or browser.

The frontend talks to the backend at `/ws/<pad-id>` on its own origin, and the Vite dev server proxies that to `core`. This means only the frontend port needs to be reachable, which helps with port forwarding and tunnels.

### Configuration

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `PORT` | `core` (or `core/.env`) | `3000` | Port the backend listens on |
| `CORE_URL` | `ui` dev server | `http://localhost:3000` | Where Vite proxies `/ws` to |
| `VITE_WS_URL` | `ui` build | same origin `/ws` | Connect directly to a WebSocket URL instead of the proxy |

### Production build

```bash
cd core && npm run build && npm start
cd ui && npm run build    # static files in ui/dist
```

The `/ws` proxy only exists in the Vite dev server. When serving `ui/dist`, either proxy `/ws` to `core` (stripping the `/ws` prefix) in your web server, or build with `VITE_WS_URL` pointing at the backend.

## How it works

Each pad is identified by the path of its WebSocket connection. Clients and server exchange JSON messages:

| Direction | Message | Meaning |
|---|---|---|
| client → server | `{ type: 'text', text }` | Full document after a local edit |
| client → server | `{ type: 'lang', lang }` | Language changed |
| client → server | `{ type: 'cursor', anchor, head }` | Local selection moved |
| server → client | `{ type: 'init', you, text, lang, peers, cursors }` | Current pad state on connect |
| server → client | `text`, `lang`, `cursor`, `peers`, `leave` | Changes from other clients |

Incoming text is applied as a minimal change to the editor, so your cursor stays in place while others type.

## Limitations

- Pads are kept in memory and are lost when the server restarts.
- The whole document is sent on each edit and the last write wins. If two people type at the same moment, one keystroke can be lost. A CRDT (such as Yjs) would fix this.
- Pad codes are short random strings; anyone with the code can open the pad.

## License

[MIT](LICENSE)
