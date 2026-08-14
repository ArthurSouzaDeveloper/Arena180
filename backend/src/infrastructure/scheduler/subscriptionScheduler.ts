import { subscriptionService } from "../../application/services/subscriptionService";
import { logger } from "../logging/logger";

const SWEEP_INTERVAL_MS = 15 * 60 * 1000;
const log = logger.child({ component: "subscriptionScheduler" });

export async function runSubscriptionSweep() {
  await subscriptionService.expireStaleHolds();
  await subscriptionService.extendOccurrences();
  await subscriptionService.sendRenewalNotices();
}

export function startSubscriptionScheduler() {
  setInterval(() => {
    runSubscriptionSweep().catch((err) => log.error({ err }, "Falha na rotina de mensalista"));
  }, SWEEP_INTERVAL_MS);
}
