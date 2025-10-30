import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true, clientTracking: true });

// initial text
let currText = "Hello, from Server";

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`Client connected from ${clientIP}`);

  // Send the latest version of text on connection
  ws.send(currText);
  
  ws.on('message', (message) => {
    console.log('Received from client:', message.toString());
    currText = message.toString();
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(currText);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

export default wss;