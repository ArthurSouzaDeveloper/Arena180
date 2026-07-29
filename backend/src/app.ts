import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import api from './presentation/routes';
import { errorHandler, notFoundHandler } from './presentation/middlewares/error.middleware';
import { apiLimiter } from './presentation/middlewares/rateLimit.middleware';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Fotos de produtos
  app.use(`/${env.uploadDir}`, express.static(path.resolve(process.cwd(), env.uploadDir)));

  app.use('/api', apiLimiter, api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
