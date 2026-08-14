import { createApp } from "./app";
import { env } from "./config/env";
import { startReminderScheduler } from "./infrastructure/scheduler/reminderScheduler";
import { startSubscriptionScheduler } from "./infrastructure/scheduler/subscriptionScheduler";
import { logger } from "./infrastructure/logging/logger";

// Last line of defense: a truly uncaught exception or unhandled rejection
// anywhere (including outside the request cycle, e.g. inside a scheduler
// tick that forgot a .catch) would otherwise either crash the process with
// no record of why, or in Node's older/looser modes keep running in a
// possibly-corrupted state. Log with full context, then fail fast — an
// unknown state is worse than a restart, and docker-compose's
// `restart: unless-stopped` brings it back up.
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled promise rejection");
  process.exit(1);
});

const app = createApp();

app.listen(env.port, () => {
  logger.info({ port: env.port }, "Arena180 API rodando");
  startReminderScheduler();
  startSubscriptionScheduler();
});
