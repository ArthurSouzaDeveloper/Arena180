import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const INSECURE_DEFAULTS = new Set(["dev-secret-change-me", "dev-token-encryption-key-change-me", "change-me"]);

function requiredSecret(name: string): string {
  const value = required(name);
  if (INSECURE_DEFAULTS.has(value)) {
    // These placeholder values are documented in .env.example for local dev only.
    // Refusing to boot with them in a real deployment prevents an accidentally
    // unset/misconfigured secret from silently degrading to a publicly known
    // value that lets anyone forge JWTs or decrypt stored Pix/WhatsApp tokens.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Environment variable ${name} is set to a known insecure placeholder value. Set a real secret before running in production.`,
      );
    }
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: requiredSecret("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  uploadsDir: process.env.UPLOADS_DIR ?? "uploads",
  corsOrigin: required("CORS_ORIGIN"),
  tokenEncryptionKey: requiredSecret("TOKEN_ENCRYPTION_KEY"),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "",
};
