<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { newId } from './util';

  let joinId = '';

  const join = () => {
    // accept a bare id or a pasted pad link
    const id = joinId.trim().split('/session/').pop()?.replace(/[^\w-]/g, '');
    if (id) push(`/session/${id}`);
  };

  // sample shown in the preview; [class, text] pairs per line
  const sample: [string, string][][] = [
    [['k', 'function'], ['', ' '], ['f', 'greet'], ['', '(name) {']],
    [['', '  '], ['c', '// runs for whoever just joined']],
    [['', '  '], ['k', 'const'], ['', ' msg = '], ['s', '`hi, ${name}`'], ['', ';']],
    [['', '  '], ['k', 'return'], ['', ' msg;']],
    [['', '}']],
    [],
    [['f', 'greet'], ['', '('], ['s', '"cedot"'], ['', ');']],
  ];
</script>

<main>
  <section class="left">
    <h1>cedot</h1>
    <p class="muted">a shared code pad. open one, send the link, edit together.</p>

    <div class="block">
      <button class="primary" on:click={() => push(`/session/${newId()}`)}>new pad</button>
    </div>

    <form class="block" on:submit|preventDefault={join}>
      <label for="join">have a code?</label>
      <div class="row">
        <input id="join" bind:value={joinId} placeholder="pad code or link" spellcheck="false" autocomplete="off" />
        <button type="submit" disabled={!joinId.trim()}>join</button>
      </div>
    </form>
  </section>

  <section class="right" aria-hidden="true">
    <div class="window">
      <div class="bar">
        <span><b>cedot</b> <span class="muted">/</span> k3f9x2</span>
        <span class="fake-tools">
          <span class="fake-btn">JavaScript</span>
          <span class="fake-btn">wrap</span>
          <span class="fake-btn dark">copy link</span>
        </span>
      </div>
      <div class="code">
        <div class="gutter">
          {#each sample as _, i}<div>{i + 1}</div>{/each}
        </div>
        <div class="lines">
          {#each sample as line, i}
            <div class:active={i === 6}>
              {#each line as [cls, text]}<span class={cls}>{text}</span>{/each}{#if i === 6}<span class="caret"></span>{/if}&#8203;
            </div>
          {/each}
        </div>
      </div>
      <div class="status">
        <span>Ln 7, Col 16</span>
        <span class="muted">7 lines, 118 chars</span>
        <span class="spacer"></span>
        <span>2 people here</span>
        <span class="ok">connected</span>
      </div>
    </div>
  </section>
</main>

<style>
  main {
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(0, 1.4fr);
    align-items: center;
    gap: 4rem;
    min-height: 100vh;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 3rem;
    box-sizing: border-box;
  }
  h1 {
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0 0 0.25rem;
  }
  p {
    margin: 0;
  }
  .muted {
    color: var(--muted);
  }
  .block {
    margin-top: 2rem;
  }
  label {
    display: block;
    color: var(--muted);
    margin-bottom: 0.4rem;
  }
  .row {
    display: flex;
    gap: 0.5rem;
  }
  input {
    flex: 1;
    max-width: 22ch;
  }
  button.primary {
    background: var(--fg);
    color: var(--bg);
    border-color: var(--fg);
    padding: 0 1.25rem;
    height: 30px;
  }
  .row input,
  .row button {
    height: 30px;
  }

  /* static picture of the editor */
  .window {
    border: 1px solid var(--rule);
    background: var(--bg);
    box-shadow: 6px 6px 0 var(--bg-alt);
    font-size: 12px;
    user-select: none;
  }
  .bar,
  .status {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.35rem 0.6rem;
  }
  .bar {
    justify-content: space-between;
    border-bottom: 1px solid var(--rule);
  }
  .fake-tools {
    display: flex;
    gap: 0.35rem;
  }
  .fake-btn {
    border: 1px solid var(--rule);
    border-radius: 2px;
    padding: 0 0.5rem;
  }
  .fake-btn.dark {
    background: var(--fg);
    color: var(--bg);
    border-color: var(--fg);
  }
  .code {
    display: flex;
    min-height: 220px;
    line-height: 1.6;
  }
  .gutter {
    padding: 0.4rem 0.6rem;
    text-align: right;
    color: var(--muted);
    background: var(--bg-alt);
    border-right: 1px solid var(--rule);
  }
  .lines {
    flex: 1;
    padding: 0.4rem 0;
    white-space: pre;
    overflow: hidden;
  }
  .lines > div {
    padding: 0 0.6rem;
  }
  .lines > div.active {
    background: var(--bg-alt);
  }
  .k { color: var(--hl-keyword); }
  .f { color: var(--hl-function); }
  .s { color: var(--hl-string); }
  .c { color: var(--hl-comment); font-style: italic; }
  .caret {
    display: inline-block;
    width: 1px;
    height: 1.1em;
    background: var(--fg);
    vertical-align: text-bottom;
    animation: blink 1.1s steps(1) infinite;
  }
  @keyframes blink {
    50% { opacity: 0; }
  }
  .status {
    white-space: nowrap;
    overflow: hidden;
    border-top: 1px solid var(--rule);
    background: var(--bg-alt);
    font-size: 0.9em;
  }
  .spacer {
    flex: 1;
  }
  .ok {
    color: var(--accent);
  }

  @media (max-width: 820px) {
    main {
      grid-template-columns: 1fr;
      gap: 3rem;
      padding: 3rem 1rem;
      align-content: start;
    }
    .fake-tools .fake-btn:not(.dark) {
      display: none;
    }
    .status .muted {
      display: none;
    }
  }
</style>
