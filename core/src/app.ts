import express from 'express';
import morgan from 'morgan';

const app = express();

app.use(morgan('dev'));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.status(200).send('hello, world');
});

export default app;