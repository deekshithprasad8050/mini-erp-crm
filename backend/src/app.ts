import express from 'express';
import cors from 'cors';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { sendSuccess } from './utils/response';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  sendSuccess(res, null, 200, 'API is running');
});

app.use('/api', routes);

app.use(errorHandler);

export default app;
