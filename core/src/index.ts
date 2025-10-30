import app from './app';
import wss from './wss';
import logger from './utils/logger';

const PORT = 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});