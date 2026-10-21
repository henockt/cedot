<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorState, Annotation, Compartment } from '@codemirror/state';
  import { EditorView, keymap, placeholder } from '@codemirror/view';
  import { indentWithTab } from '@codemirror/commands';
  import { basicSetup } from 'codemirror';
  import { languages, getLanguage } from './languages';
  import { highlight } from './highlight';
  import { remoteCursors, setCursor, removeCursor, clearCursors, peerColor, peerName } from './cursors';
  import { PadConnection, type Status } from './pad';
  import { getSettings, saveSettings } from './storage';
  import { applyTheme } from './util';

  export let params: { sessionId: string | undefined } = {
    sessionId: undefined,
  };

  // marks transactions that came from the server so they aren't echoed back
  const remote = Annotation.define<boolean>();

  const langConf = new Compartment();
  const wrapConf = new Compartment();
  const themeConf = new Compartment();
  const sizeConf = new Compartment();

  let editorContainer: HTMLDivElement;
  let view: EditorView;
  let pad: PadConnection | null = null;
  let padId: string | undefined;

  let status: Status = 'connecting';
  let peers = 1;
  // our client id on this pad, as others see it
  let me: number | null = null;
  let lang = 'javascript';
  let settings = getSettings();
  let dark = applyTheme(settings.theme);

  // local edits made while offline; pushed to the server on reconnect
  let unsent = false;
  let line = 1;
  let col = 1;
  let lines = 1;
  let chars = 0;
  let selected = 0;
  let flash = '';
  let flashTimer: ReturnType<typeof setTimeout> | undefined;

  const say = (msg: string) => {
    flash = msg;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => (flash = ''), 1500);
  };

  // replace the doc with `text`, touching only the changed span so the cursor stays put
  const applyRemote = (text: string) => {
    const current = view.state.doc.toString();
    if (text === current) return;

    let start = 0;
    while (start < text.length && start < current.length && text[start] === current[start]) start++;
    let endA = current.length;
    let endB = text.length;
    while (endA > start && endB > start && current[endA - 1] === text[endB - 1]) {
      endA--;
      endB--;
    }

    view.dispatch({
      changes: { from: start, to: endA, insert: text.slice(start, endB) },
      annotations: remote.of(true),
    });
  };

  const setLang = (id: string) => {
    lang = getLanguage(id).id;
    view?.dispatch({ effects: langConf.reconfigure(getLanguage(lang).load()) });
  };

  const connect = (id: string) => {
    pad?.close();
    padId = id;
    unsent = false;
    peers = 1;
    me = null;
    view.dispatch({ effects: clearCursors.of(null) });

    pad = new PadConnection(id, {
      onStatus: (s) => (status = s),
      onPeers: (n) => (peers = n),
      onLang: setLang,
      onText: applyRemote,
      onCursor: (c) => view.dispatch({ effects: setCursor.of(c) }),
      onLeave: (id) => view.dispatch({ effects: removeCursor.of(id) }),
      onInit: ({ you, text, lang: serverLang, peers: count, cursors }) => {
        me = you;
        peers = count;
        if (unsent) {
          // we edited while offline, our copy wins
          pad?.send({ type: 'text', text: view.state.doc.toString() });
          pad?.send({ type: 'lang', lang });
          unsent = false;
        } else {
          applyRemote(text);
          setLang(serverLang);
        }
        view.dispatch({ effects: [clearCursors.of(null), ...cursors.map((c) => setCursor.of(c))] });
        sendCursor();
      },
    });
  };

  const sendCursor = () => {
    const { anchor, head } = view.state.selection.main;
    pad?.send({ type: 'cursor', anchor, head });
  };

  const updateStats = (state: EditorState) => {
    const sel = state.selection.main;
    const l = state.doc.lineAt(sel.head);
    line = l.number;
    col = sel.head - l.from + 1;
    lines = state.doc.lines;
    chars = state.doc.length;
    selected = state.selection.ranges.reduce((n, r) => n + r.to - r.from, 0);
  };

  const editorTheme = (size: number) =>
    EditorView.theme({
      '&': { fontSize: `${size}px` },
    });

  const darkFlag = (isDark: boolean) => EditorView.theme({}, { dark: isDark });

  onMount(() => {
    const state = EditorState.create({
      doc: '',
      extensions: [
        basicSetup,
        highlight,
        remoteCursors(),
        keymap.of([
          indentWithTab,
          {
            key: 'Mod-s',
            preventDefault: true,
            run: () => {
              download();
              return true;
            },
          },
        ]),
        placeholder('start typing. everyone with the link sees it live.'),
        langConf.of(getLanguage(lang).load()),
        wrapConf.of(settings.wrap ? EditorView.lineWrapping : []),
        themeConf.of(darkFlag(dark)),
        sizeConf.of(editorTheme(settings.fontSize)),

        EditorView.updateListener.of((update) => {
          if (update.docChanged || update.selectionSet) updateStats(update.state);
          if (update.transactions.some((tr) => tr.annotation(remote))) return;
          if (update.docChanged && !pad?.send({ type: 'text', text: update.state.doc.toString() })) unsent = true;
          // after the text, so others place the cursor in the new text
          if (update.selectionSet) sendCursor();
        }),
      ],
    });

    view = new EditorView({
      state,
      parent: editorContainer,
    });
    view.focus();
  });

  // reconnect when navigating between sessions
  $: if (view && params.sessionId && params.sessionId !== padId) connect(params.sessionId);

  onDestroy(() => {
    clearTimeout(flashTimer);
    pad?.close();
    view?.destroy();
  });

  const update = (patch: Partial<typeof settings>) => {
    settings = { ...settings, ...patch };
    saveSettings(settings);
  };

  const changeLang = (e: Event) => {
    setLang((e.target as HTMLSelectElement).value);
    if (!pad?.send({ type: 'lang', lang })) unsent = true;
  };

  const toggleWrap = () => {
    update({ wrap: !settings.wrap });
    view.dispatch({ effects: wrapConf.reconfigure(settings.wrap ? EditorView.lineWrapping : []) });
  };

  const fontSize = (delta: number) => {
    update({ fontSize: Math.min(24, Math.max(10, settings.fontSize + delta)) });
    view.dispatch({ effects: sizeConf.reconfigure(editorTheme(settings.fontSize)) });
  };

  const cycleTheme = () => {
    const order = ['system', 'light', 'dark'] as const;
    update({ theme: order[(order.indexOf(settings.theme) + 1) % order.length]! });
    dark = applyTheme(settings.theme);
    view.dispatch({ effects: themeConf.reconfigure(darkFlag(dark)) });
  };

  const copyLink = async () => {
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard API needs a secure context; fall back to a temporary input
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    say('link copied');
  };

  const download = () => {
    const blob = new Blob([view.state.doc.toString()], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${padId}.${getLanguage(lang).ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
    say(`saved ${a.download}`);
  };
</script>

<div class="page">
  <header>
    <nav>
      <a href="#/" class="home">cedot</a>
      <span class="muted">/</span>
      <span>{params.sessionId}</span>
    </nav>

    <div class="tools">
      <select value={lang} on:change={changeLang} title="language (shared with everyone on this pad)">
        {#each languages as l (l.id)}
          <option value={l.id}>{l.name}</option>
        {/each}
      </select>
      <button aria-pressed={settings.wrap} on:click={toggleWrap} title="wrap long lines">wrap</button>
      <span class="group">
        <button on:click={() => fontSize(-1)} title="smaller text">A-</button>
        <button on:click={() => fontSize(1)} title="larger text">A+</button>
      </span>
      <button on:click={cycleTheme} title="theme: system / light / dark">{settings.theme}</button>
      <button on:click={download} title="download (Ctrl+S)">download</button>
      <button class="primary" on:click={copyLink}>copy link</button>
    </div>
  </header>

  <div class="editor" bind:this={editorContainer}></div>

  <footer>
    <span>Ln {line}, Col {col}</span>
    {#if selected}<span>({selected} selected)</span>{/if}
    <span class="muted">{lines} lines, {chars} chars</span>
    <span class="flash">{flash}</span>
    <span class="spacer"></span>
    {#if status === 'connected'}
      {#if me !== null}
        <span>you're <b style="color: {peerColor(me)}">{peerName(me)}</b></span>
      {/if}
      <span>{peers === 1 ? 'just you' : `${peers} people here`}</span>
    {/if}
    <span class="status {status}">
      {status}{status === 'offline' && unsent ? ', edits pending' : ''}
    </span>
  </footer>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    padding: 0.4rem 0.75rem;
    border-bottom: 1px solid var(--rule);
  }
  nav {
    display: flex;
    gap: 0.75ch;
    min-width: 0;
  }
  .home {
    font-weight: 600;
    text-decoration: none;
  }
  .tools {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .group {
    display: inline-flex;
  }
  .group button + button {
    border-left: none;
  }
  button.primary {
    background: var(--fg);
    color: var(--bg);
    border-color: var(--fg);
  }
  .editor {
    flex: 1;
    min-height: 0;
  }
  .editor :global(.cm-editor) {
    height: 100%;
    background: var(--bg);
    color: var(--fg);
  }
  .editor :global(.cm-editor.cm-focused) {
    outline: none;
  }
  .editor :global(.cm-scroller) {
    font-family: inherit;
  }
  .editor :global(.cm-gutters) {
    background: var(--bg-alt);
    color: var(--muted);
    border-right: 1px solid var(--rule);
  }
  .editor :global(.cm-activeLineGutter) {
    background: var(--rule);
    color: var(--fg);
  }
  /* must stay see-through: CodeMirror draws selections underneath lines */
  .editor :global(.cm-activeLine) {
    background: var(--line-highlight);
  }
  .editor :global(.cm-selectionLayer .cm-selectionBackground),
  .editor :global(.cm-editor.cm-focused .cm-selectionLayer .cm-selectionBackground) {
    background: var(--selection);
  }
  footer {
    display: flex;
    gap: 1.25rem;
    padding: 0.2rem 0.75rem;
    border-top: 1px solid var(--rule);
    background: var(--bg-alt);
    font-size: 0.9em;
    white-space: nowrap;
    overflow: hidden;
  }
  .muted {
    color: var(--muted);
  }
  .flash {
    color: var(--accent);
  }
  .spacer {
    flex: 1;
  }
  .status.connected {
    color: var(--accent);
  }
  .status.connecting {
    color: var(--muted);
  }
  .status.offline {
    color: var(--danger);
  }
</style>
