<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorState } from '@codemirror/state';
  import { EditorView, keymap, type KeyBinding } from '@codemirror/view';
  import { defaultKeymap, indentWithTab } from '@codemirror/commands';
  import { basicSetup } from 'codemirror';
  import { javascript } from '@codemirror/lang-javascript';

  let editorContainer: HTMLDivElement;
  let view: EditorView;

  onMount(() => {
    const state = EditorState.create({
      doc: "// Start typing here...",
      extensions: [
        basicSetup,
        javascript(),
        keymap.of([(indentWithTab as unknown) as KeyBinding, ...(defaultKeymap as unknown) as readonly KeyBinding[]]),
        
        EditorView.updateListener.of((update: any) => {
          if (update.docChanged) {
            console.log("doc change detected:", update.changes);
          }
        }),
      ],
    });

    // Create the view and attach it to the div
    view = new EditorView({
      state,
      parent: editorContainer,
    });
  });

  onDestroy(() => {
    view?.destroy();
  });
</script>

<div bind:this={editorContainer}></div>

<style>
  div :global(.cm-editor) {
    height: 50vh;
    border: 1px solid #000000;
    /* background: white; */
    /* color: black; */
  }
</style>