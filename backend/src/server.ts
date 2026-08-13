import { createApp } from "./app";
import { env } from "./config/env";
import { startReminderScheduler } from "./infrastructure/scheduler/reminderScheduler";

const app = createApp();

app.listen(env.port, () => {
  console.log(`GestQuadra API rodando em http://localhost:${env.port}`);
  startReminderScheduler();
});
