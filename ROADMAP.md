# Roadmap

What's planned for cedot, roughly in order.

## Now: solid collaborative editing

- [x] Live editing over WebSockets, one pad per link
- [x] Other people's cursors and selections
- [x] Shared language and syntax highlighting, themes, download
- [ ] Conflict-free editing with a CRDT (Yjs) so simultaneous typing never loses keystrokes
- [ ] Send edits as changes instead of the whole document
- [ ] Tests for the server protocol and the editor sync logic
- [ ] Longer pad codes so they can't be guessed

## Next: running code

- [ ] Execution servers that run the pad's code in a sandbox (container per run, CPU/memory/time limits, no network)
- [ ] Shared output panel, so everyone on the pad sees the same result
- [ ] Standard input and a "run" button that only one person triggers at a time
- [ ] Support for the main languages the editor already highlights (JavaScript/TypeScript, Python, C/C++, Java, Go, Rust)

## Later: accounts and technical interviews

- [ ] Authentication, with chosen display names instead of "guest N"
- [ ] Private, invite-only pads and read-only sharing
- [ ] Interview mode for companies: interviewer and candidate roles, question templates, a timer
- [ ] Playback of how the code was written during a session

## Hosting

- [ ] Persist pads in a database so they survive restarts, with expiry
- [ ] Docker images for the backend and the execution servers
- [ ] A public deployment
