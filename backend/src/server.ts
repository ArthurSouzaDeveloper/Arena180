import { createApp } from "./app";
import { env } from "./config/env";
import { startReminderScheduler } from "./infrastructure/scheduler/reminderScheduler";
import { startSubscriptionScheduler } from "./infrastructure/scheduler/subscriptionScheduler";

const app = createApp();

app.listen(env.port, () => {
  console.log(`GestQuadra API rodando em http://localhost:${env.port}`);
  startReminderScheduler();
  startSubscriptionScheduler();
});
