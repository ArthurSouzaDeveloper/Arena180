import { subscriptionService } from "../../application/services/subscriptionService";

const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

export async function runSubscriptionSweep() {
  await subscriptionService.expireStaleHolds();
  await subscriptionService.extendOccurrences();
  await subscriptionService.sendRenewalNotices();
}

export function startSubscriptionScheduler() {
  setInterval(() => {
    runSubscriptionSweep().catch((err) => console.error("Falha na rotina de mensalista:", err));
  }, SWEEP_INTERVAL_MS);
}
