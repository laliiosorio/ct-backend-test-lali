import 'dotenv/config';
import './shared/env';
import routes from './routes';
import express from 'express';

const app = express();
const port = Number(process.env.PORT);

app.use(express.json());

app.use('/', routes);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
