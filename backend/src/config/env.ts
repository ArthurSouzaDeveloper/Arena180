import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';

function required(key: string, devFallback?: string): string {
  const value = process.env[key];
  if (value) return value;
  if (!isProd && devFallback !== undefined) return devFallback;
  throw new Error(`Missing required environment variable: ${key}`);
}

export const env = {
  nodeEnv,
  isProd,
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: required('DATABASE_URL', 'postgresql://gestquadra:gestquadra@localhost:5432/gestquadra'),
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '12h',
  },
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  logLevel: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
};
