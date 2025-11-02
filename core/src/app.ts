import express from 'express';
import morgan from 'morgan';
import path from 'path';

const app = express();

app.use(morgan('dev'));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.status(200).send('hello, world');
});

app.get('/:id', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

export default app;