import { prisma } from "@/lib/prisma";
import { enqueueQuoteNotification } from "@/lib/notifications/queue";

const REMINDER_AFTER_DAYS = 3;

export async function sendStaleQuoteReminders(): Promise<number> {
  const cutoff = new Date(Date.now() - REMINDER_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const staleQuotes = await prisma.quote.findMany({
    where: {
      status: "SENT",
      reminderSentAt: null,
      updatedAt: { lte: cutoff },
    },
    select: { id: true },
  });

  for (const quote of staleQuotes) {
    await enqueueQuoteNotification(quote.id, "QUOTE_REMINDER");
    await prisma.quote.update({
      where: { id: quote.id },
      data: { reminderSentAt: new Date() },
    });
  }

  return staleQuotes.length;
}
