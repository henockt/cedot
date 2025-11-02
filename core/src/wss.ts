import { WebSocketServer } from 'ws';
import logger from './utils/logger';

const wss = new WebSocketServer({ noServer: true, clientTracking: true });

const textMap: Map<string, string> = new Map();
const clientMap: Map<string, any[]> = new Map();

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  logger.debug(`Client connected to ${req.url} from ${clientIP}`);

  const reqUrl = req.url || '/';
  // Send the latest version of text on connection
  ws.send(textMap.get(reqUrl) || '');
  // Store client connection
  clientMap.get(reqUrl) ? clientMap.get(reqUrl)?.push(ws) : clientMap.set(reqUrl, [ws]);

  ws.on('message', (message) => {
    logger.debug(`Received to ${reqUrl} from client: ${message.toString()}`);
    textMap.set(reqUrl, message.toString());
    clientMap.get(reqUrl)?.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => {
    logger.debug('Client disconnected');
  });
});

export default wss;