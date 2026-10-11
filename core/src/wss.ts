import { WebSocketServer, WebSocket } from 'ws';
import logger from './utils/logger';

// Messages are JSON.
// client -> server: { type: 'text', text } | { type: 'lang', lang } | { type: 'cursor', anchor, head }
// server -> client: { type: 'init', you, text, lang, peers, cursors } | { type: 'text', text }
//                 | { type: 'lang', lang } | { type: 'peers', count }
//                 | { type: 'cursor', id, anchor, head } | { type: 'leave', id }

interface Cursor {
  id: number
  anchor: number
  head: number
}

interface Pad {
  text: string
  lang: string
  clients: Set<WebSocket>
  // keyed by a per-pad client id, used to tell cursors apart
  cursors: Map<number, Cursor>
  nextId: number
}

const wss = new WebSocketServer({ noServer: true, clientTracking: true });

const pads: Map<string, Pad> = new Map();

const getPad = (key: string): Pad => {
  let pad = pads.get(key);
  if (!pad) {
    pad = { text: '', lang: 'javascript', clients: new Set(), cursors: new Map(), nextId: 1 };
    pads.set(key, pad);
  }
  return pad;
};

const broadcast = (pad: Pad, data: object, except?: WebSocket) => {
  const msg = JSON.stringify(data);
  pad.clients.forEach((client) => {
    if (client !== except && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
};

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  logger.debug(`Client connected to ${req.url} from ${clientIP}`);

  const reqUrl = req.url || '/';
  const pad = getPad(reqUrl);
  pad.clients.add(ws);
  const id = pad.nextId++;

  // Send the latest version of the pad on connection
  ws.send(JSON.stringify({
    type: 'init',
    you: id,
    text: pad.text,
    lang: pad.lang,
    peers: pad.clients.size,
    cursors: [...pad.cursors.values()],
  }));
  broadcast(pad, { type: 'peers', count: pad.clients.size }, ws);

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch {
      logger.warn(`Ignoring non-JSON message to ${reqUrl}`);
      return;
    }

    if (data.type === 'text' && typeof data.text === 'string') {
      logger.debug(`Received text to ${reqUrl} (${data.text.length} chars)`);
      pad.text = data.text;
      broadcast(pad, { type: 'text', text: pad.text }, ws);
    } else if (data.type === 'lang' && typeof data.lang === 'string') {
      logger.debug(`Language of ${reqUrl} set to ${data.lang}`);
      pad.lang = data.lang;
      broadcast(pad, { type: 'lang', lang: pad.lang }, ws);
    } else if (data.type === 'cursor' && Number.isInteger(data.anchor) && Number.isInteger(data.head)) {
      const cursor = { id, anchor: data.anchor, head: data.head };
      pad.cursors.set(id, cursor);
      broadcast(pad, { type: 'cursor', ...cursor }, ws);
    }
  });

  ws.on('close', () => {
    logger.debug(`Client disconnected from ${reqUrl}`);
    pad.clients.delete(ws);
    pad.cursors.delete(id);
    broadcast(pad, { type: 'leave', id });
    broadcast(pad, { type: 'peers', count: pad.clients.size });
  });
});

export default wss;
