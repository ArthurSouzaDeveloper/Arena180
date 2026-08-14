import rateLimit from "express-rate-limit";

// Strict limit on login to blunt password brute-forcing / credential stuffing.
// Keyed by IP (default), which is what express-rate-limit derives from
// X-Forwarded-For once `app.set("trust proxy", ...)` is configured — required
// since the app sits behind the nginx reverse proxy in production.
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

// General API-wide ceiling. Generous enough not to bother real usage (the
// booking flow and dashboard poll a handful of endpoints per interaction),
// but bounds scraping, brute-force of other endpoints, and accidental
// runaway clients (e.g. the payment-status polling loop misbehaving).
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas requisições. Tente novamente em alguns minutos." },
});
