import winston from 'winston';
import { env } from './env';

const levels = { fatal: 0, error: 1, warn: 2, info: 3, debug: 4 };
winston.addColors({ fatal: 'magenta', error: 'red', warn: 'yellow', info: 'green', debug: 'blue' });

export const logger = winston.createLogger({
  levels,
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.isProd
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const extraKeys = Object.keys(meta);
            const extra = extraKeys.length ? ' ' + JSON.stringify(meta) : '';
            return `${timestamp} [${level}] ${stack ?? message}${extra}`;
          }),
        ),
  ),
  transports: [new winston.transports.Console()],
}) as winston.Logger & Record<'fatal', winston.LeveledLogMethod>;
