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

// Requesting a WhatsApp code costs money per message and is an easy abuse
// target (spamming a stranger's phone) - keep it far tighter than login.
export const forgotPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Tente novamente em alguns minutos." },
});

// Booking/subscription creation is unauthenticated and each call opens a
// 20-minute hold on a court slot. Without a tighter cap here, a script could
// spam PENDENTE_PAGAMENTO holds fast enough to keep every slot perpetually
// "taken" for real customers — the general API limit (600/15min) is far too
// loose to stop that specific abuse.
export const bookingCreateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas de reserva. Tente novamente em alguns minutos." },
});
