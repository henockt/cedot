// WebSocket connection to one pad. See core/src/wss.ts for the message format.
import type { RemoteCursor } from './cursors';

export type Status = 'connecting' | 'connected' | 'offline';

export interface PadInit {
  you: number
  text: string
  lang: string
  peers: number
  cursors: RemoteCursor[]
}

export interface PadHandlers {
  onInit: (init: PadInit) => void
  onText: (text: string) => void
  onLang: (lang: string) => void
  onPeers: (count: number) => void
  onStatus: (status: Status) => void
  onCursor: (cursor: RemoteCursor) => void
  onLeave: (id: number) => void
}

const wsBase = (): string => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws`;
};

export class PadConnection {
  private ws: WebSocket | null = null;
  private retry: ReturnType<typeof setTimeout> | undefined;
  private closed = false;

  constructor(private id: string, private handlers: PadHandlers) {
    this.connect();
  }

  private connect() {
    const socket = new WebSocket(`${wsBase()}/${encodeURIComponent(this.id)}`);
    this.ws = socket;
    this.handlers.onStatus('connecting');

    socket.onopen = () => this.handlers.onStatus('connected');

    socket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === 'init') this.handlers.onInit(data);
      if (data.type === 'text') this.handlers.onText(data.text);
      if (data.type === 'lang') this.handlers.onLang(data.lang);
      if (data.type === 'peers') this.handlers.onPeers(data.count);
      if (data.type === 'cursor') this.handlers.onCursor({ id: data.id, anchor: data.anchor, head: data.head });
      if (data.type === 'leave') this.handlers.onLeave(data.id);
    };

    socket.onclose = () => {
      if (this.closed || this.ws !== socket) return;
      this.handlers.onStatus('offline');
      this.retry = setTimeout(() => this.connect(), 1000);
    };
  }

  get open(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // returns false if the message couldn't be sent (offline)
  send(
    data:
      | { type: 'text', text: string }
      | { type: 'lang', lang: string }
      | { type: 'cursor', anchor: number, head: number },
  ): boolean {
    if (!this.open) return false;
    this.ws!.send(JSON.stringify(data));
    return true;
  }

  close() {
    this.closed = true;
    clearTimeout(this.retry);
    this.ws?.close();
  }
}
