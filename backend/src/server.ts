import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/prisma';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  logger.info('Database connected');

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.port, () => {
    logger.info(`GestQuadra API running on http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

process.on('uncaughtException', (err) => {
  logger.fatal('uncaught_exception', { error: err });
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.fatal('unhandled_rejection', { error: reason });
  process.exit(1);
});

bootstrap().catch((err) => {
  logger.fatal('bootstrap_failed', { error: err });
  process.exit(1);
});
