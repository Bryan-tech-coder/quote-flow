import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications/channels/email";
import { renderTemplate } from "@/lib/notifications/templates";
import { backoffFor } from "@/lib/notifications/backoff";
import { calculateTotal } from "@/lib/quotes";
import { publicQuoteUrl, dashboardQuoteUrl } from "@/lib/notifications/urls";
import { generateQuotePdfBuffer } from "@/lib/pdf/quotePdf";
import type { NotificationEvent } from "@/generated/prisma/client";

const CLIENT_FACING_EVENTS: NotificationEvent[] = ["QUOTE_SENT", "QUOTE_REMINDER"];

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
  const isClientFacing = CLIENT_FACING_EVENTS.includes(event);

  const ctx = {
    quoteTitle: quote.title,
    clientName: quote.client.name,
    businessName: quote.organization.name,
    total,
    quoteUrl: isClientFacing ? publicQuoteUrl(quote.id) : dashboardQuoteUrl(quote.id),
  };

  const recipients: string[] = isClientFacing
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

async function buildQuotePdfAttachment(
  quoteId: string
): Promise<{ filename: string; content: Buffer } | undefined> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { client: true, organization: true, items: true },
  });
  if (!quote) return undefined;

  const content = await generateQuotePdfBuffer(quote);
  return { filename: `quote-${quote.id.slice(-8)}.pdf`, content };
}

export async function processPendingNotifications(limit = 20) {
  const pending = await prisma.notification.findMany({
    where: { status: "PENDING", nextAttemptAt: { lte: new Date() } },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  for (const notification of pending) {
    try {
      const attachment =
        notification.event === "QUOTE_SENT" && notification.quoteId
          ? await buildQuotePdfAttachment(notification.quoteId)
          : undefined;

      await sendEmail({
        to: notification.recipient,
        subject: notification.subject,
        body: notification.body,
        attachment,
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
