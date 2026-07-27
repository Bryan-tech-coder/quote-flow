import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications/channels/email";
import { renderTemplate } from "@/lib/notifications/templates";
import { backoffFor } from "@/lib/notifications/backoff";
import { calculateTotal } from "@/lib/quotes";
import type { NotificationEvent } from "@/generated/prisma/client";

function quoteUrl(quoteId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/dashboard/quotes/${quoteId}`;
}

export async function enqueueQuoteNotification(
  quoteId: string,
  event: NotificationEvent
) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: true,
      items: true,
      organization: { include: { users: true } },
    },
  });
  if (!quote) return;

  const total = calculateTotal(quote.items);

  const ctx = {
    quoteTitle: quote.title,
    clientName: quote.client.name,
    businessName: quote.organization.name,
    total,
    quoteUrl: quoteUrl(quote.id),
  };

  const recipients: string[] =
    event === "QUOTE_SENT"
      ? quote.client.email
        ? [quote.client.email]
        : []
      : quote.organization.users
          .filter((u) => u.emailNotifications)
          .map((u) => u.email);

  if (recipients.length === 0) return;

  const { subject, body } = renderTemplate(event, ctx);

  await prisma.notification.createMany({
    data: recipients.map((recipient) => ({
      organizationId: quote.organizationId,
      quoteId: quote.id,
      event,
      recipient,
      subject,
      body,
    })),
  });

  await processPendingNotifications();
}

export async function processPendingNotifications(limit = 20) {
  const pending = await prisma.notification.findMany({
    where: { status: "PENDING", nextAttemptAt: { lte: new Date() } },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  for (const notification of pending) {
    try {
      await sendEmail({
        to: notification.recipient,
        subject: notification.subject,
        body: notification.body,
      });
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    } catch (error) {
      const attempts = notification.attempts + 1;
      const failed = attempts >= notification.maxAttempts;
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          attempts,
          status: failed ? "FAILED" : "PENDING",
          lastError: error instanceof Error ? error.message : String(error),
          nextAttemptAt: failed
            ? notification.nextAttemptAt
            : new Date(Date.now() + backoffFor(attempts)),
        },
      });
    }
  }

  return pending.length;
}
