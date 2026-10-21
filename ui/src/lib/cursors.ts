// Other people's cursors and selections, drawn as CodeMirror decorations.
import { StateField, StateEffect, type Extension } from '@codemirror/state';
import { Decoration, EditorView, WidgetType, type DecorationSet } from '@codemirror/view';

export interface RemoteCursor {
  id: number
  anchor: number
  head: number
}

export const setCursor = StateEffect.define<RemoteCursor>();
export const removeCursor = StateEffect.define<number>();
export const clearCursors = StateEffect.define<null>();

// colors are CSS variables in app.css (--peer-0 ... --peer-5)
const PALETTE = 6;
export const peerColor = (id: number) => `var(--peer-${id % PALETTE})`;
export const peerName = (id: number) => `guest ${id}`;

class Caret extends WidgetType {
  // `below` puts the name tag under the caret, for the first line where above would be clipped
  constructor(readonly id: number, readonly below: boolean) {
    super();
  }

  eq(other: Caret) {
    return other.id === this.id && other.below === this.below;
  }

  toDOM() {
    const el = document.createElement('span');
    el.className = 'cm-remote-caret';
    el.style.setProperty('--peer', peerColor(this.id));
    const label = document.createElement('span');
    label.className = this.below ? 'cm-remote-label cm-remote-label-below' : 'cm-remote-label';
    label.textContent = peerName(this.id);
    el.appendChild(label);
    return el;
  }

  ignoreEvent() {
    return true;
  }
}

const field = StateField.define<RemoteCursor[]>({
  create: () => [],

  update(cursors, tr) {
    let next = cursors;
    // keep positions attached to the same text when the doc changes
    if (tr.docChanged) {
      next = next.map((c) => ({
        ...c,
        anchor: tr.changes.mapPos(c.anchor),
        head: tr.changes.mapPos(c.head, 1),
      }));
    }
    for (const e of tr.effects) {
      if (e.is(setCursor)) next = [...next.filter((c) => c.id !== e.value.id), e.value];
      if (e.is(removeCursor)) next = next.filter((c) => c.id !== e.value);
      if (e.is(clearCursors)) next = [];
    }
    return next;
  },

  provide: (f) =>
    EditorView.decorations.from(f, (cursors) => (view) => {
      const len = view.state.doc.length;
      const ranges = [];
      for (const c of cursors) {
        // positions can be ahead of our copy of the text for a moment; clamp them
        const anchor = Math.min(c.anchor, len);
        const head = Math.min(c.head, len);
        const style = `--peer: ${peerColor(c.id)}`;
        if (anchor !== head) {
          ranges.push(
            Decoration.mark({ class: 'cm-remote-selection', attributes: { style } })
              .range(Math.min(anchor, head), Math.max(anchor, head)),
          );
        }
        const below = view.state.doc.lineAt(head).number === 1;
        ranges.push(Decoration.widget({ widget: new Caret(c.id, below), side: 1 }).range(head));
      }
      return Decoration.set(ranges, true) as DecorationSet;
    }),
});

const theme = EditorView.baseTheme({
  '.cm-remote-selection': {
    backgroundColor: 'color-mix(in srgb, var(--peer) var(--peer-alpha, 25%), transparent)',
  },
  '.cm-remote-caret': {
    position: 'relative',
    borderLeft: '2px solid var(--peer)',
    marginLeft: '-1px',
    marginRight: '-1px',
  },
  '.cm-remote-label': {
    position: 'absolute',
    bottom: '100%',
    left: '-2px',
    padding: '0 3px',
    fontSize: '10px',
    lineHeight: '14px',
    whiteSpace: 'nowrap',
    color: 'var(--bg)',
    backgroundColor: 'var(--peer)',
    pointerEvents: 'none',
    zIndex: '10',
  },
  '.cm-remote-label-below': {
    bottom: 'auto',
    top: '100%',
  },
});

export const remoteCursors = (): Extension => [field, theme];
