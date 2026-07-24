import winston from 'winston';
import { env } from './env';

const levels = { fatal: 0, error: 1, warn: 2, info: 3, debug: 4 };
winston.addColors({ fatal: 'magenta', error: 'red', warn: 'yellow', info: 'green', debug: 'blue' });

// Defesa em profundidade: mesmo que algum call site logue um objeto que
// contenha um campo sensível por engano (ex: passar `req.body` inteiro),
// essas chaves nunca chegam ao transporte de log.
const SENSITIVE_KEY_PATTERN =
  /password|senha|passwordhash|token|jwt|authorization|secret|apikey|api_key|cookie|cpf|rg|cartao|card|cvv/i;
const REDACTED = '[REDACTED]';
const MAX_DEPTH = 6;

function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH || value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  if (value instanceof Error) {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    output[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(val, depth + 1);
  }
  return output;
}

const redactSensitive = winston.format((info) => {
  for (const key of Object.keys(info)) {
    if (key === 'level' || key === 'message' || key === 'timestamp' || key === 'stack') continue;
    info[key] = redact(info[key]);
  }
  return info;
});

export const logger = winston.createLogger({
  levels,
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    redactSensitive(),
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
