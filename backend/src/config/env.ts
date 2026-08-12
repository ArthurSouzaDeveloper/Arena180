import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  uploadsDir: process.env.UPLOADS_DIR ?? "uploads",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  tokenEncryptionKey: required("TOKEN_ENCRYPTION_KEY", "dev-token-encryption-key-change-me"),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "",
};
