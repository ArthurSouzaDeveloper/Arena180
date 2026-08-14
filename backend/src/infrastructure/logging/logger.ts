import pino from "pino";

// Structured JSON logs to stdout — docker/journald already capture and
// timestamp container output, so this is compatible as-is with shipping to
// Loki/ELK/OpenTelemetry later without any code change, just a sidecar
// collector pointed at the container logs.
//
// `redact` strips anything that could leak a credential into a log line
// (Authorization header, JWTs, third-party access tokens we store encrypted,
// the app's own secrets) regardless of where in the logged object it shows
// up, since request/response payloads and error contexts get logged as
// structured objects rather than string-concatenated messages.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.adminPassword",
      "*.token",
      "*.accessToken",
      "*.access_token",
      "*.refreshToken",
      "*.refresh_token",
      "*.mercadoPagoAccessToken",
      "*.whatsappAccessToken",
      "*.jwtSecret",
      "*.tokenEncryptionKey",
      "*.cancelToken",
      "*.authorization",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { env: process.env.NODE_ENV ?? "development" },
});
