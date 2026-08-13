import { prisma } from "../../config/database";
import { notificationService } from "../../application/services/notificationService";

const REMINDER_LEAD_HOURS = 3;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

function hoursUntil(date: Date, startTime: string) {
  const startsAt = new Date(`${date.toISOString().slice(0, 10)}T${startTime}:00`);
  return (startsAt.getTime() - Date.now()) / (1000 * 60 * 60);
}

export async function runReminderSweep() {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const candidates = await prisma.booking.findMany({
    where: {
      status: "CONFIRMADA",
      reminderSentAt: null,
      date: { gte: today, lte: tomorrow },
    },
    include: { court: { include: { quadra: true } } },
  });

  for (const booking of candidates) {
    const hoursLeft = hoursUntil(booking.date, booking.startTime);
    if (hoursLeft <= 0 || hoursLeft > REMINDER_LEAD_HOURS) continue;

    await notificationService.sendBookingReminder(
      booking.court.quadra,
      { customerName: booking.customerName, customerPhone: booking.customerPhone, startTime: booking.startTime },
      booking.court.name,
    );

    await prisma.booking.update({ where: { id: booking.id }, data: { reminderSentAt: new Date() } });
  }
}

export function startReminderScheduler() {
  setInterval(() => {
    runReminderSweep().catch((err) => console.error("Falha na rotina de lembrete:", err));
  }, SWEEP_INTERVAL_MS);
}
