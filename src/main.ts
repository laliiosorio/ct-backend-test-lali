import 'dotenv/config';
import express from 'express';
import routes from './routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Test in navegation
app.get('/', (_, res) => res.send('Hello from GET!'));

app.use('/', routes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
