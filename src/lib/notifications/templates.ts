import type { NotificationEvent } from "@/generated/prisma/client";

type QuoteContext = {
  quoteTitle: string;
  clientName: string;
  businessName: string;
  total: number;
  quoteUrl: string;
  depositAmount?: number;
};

export function renderTemplate(
  event: NotificationEvent,
  ctx: QuoteContext
): { subject: string; body: string } {
  const totalFormatted = `$${ctx.total.toFixed(2)}`;

  switch (event) {
    case "QUOTE_SENT":
      return {
        subject: `${ctx.businessName} sent you a quote: ${ctx.quoteTitle}`,
        body: `Hi ${ctx.clientName},\n\n${ctx.businessName} has sent you a quote for "${ctx.quoteTitle}" totaling ${totalFormatted}. It's attached as a PDF.\n\nTo approve or reject it, visit: ${ctx.quoteUrl}\n\nThanks,\n${ctx.businessName}`,
      };
    case "QUOTE_APPROVED":
      return {
        subject: `Quote approved: ${ctx.quoteTitle}`,
        body: `Good news — ${ctx.clientName} approved the quote "${ctx.quoteTitle}" (${totalFormatted}).\n\nView it here: ${ctx.quoteUrl}`,
      };
    case "QUOTE_REJECTED":
      return {
        subject: `Quote rejected: ${ctx.quoteTitle}`,
        body: `${ctx.clientName} rejected the quote "${ctx.quoteTitle}" (${totalFormatted}).\n\nView it here: ${ctx.quoteUrl}`,
      };
    case "QUOTE_REMINDER":
      return {
        subject: `Reminder: quote awaiting your response — ${ctx.quoteTitle}`,
        body: `Hi ${ctx.clientName},\n\nJust a reminder that ${ctx.businessName} sent you a quote for "${ctx.quoteTitle}" (${totalFormatted}) that's still awaiting your response.\n\nView and respond here: ${ctx.quoteUrl}\n\nThanks,\n${ctx.businessName}`,
      };
    case "DEPOSIT_PAID": {
      const depositFormatted = `$${(ctx.depositAmount ?? 0).toFixed(2)}`;
      return {
        subject: `Deposit received: ${ctx.quoteTitle}`,
        body: `${ctx.clientName} paid a ${depositFormatted} deposit on the quote "${ctx.quoteTitle}" (${totalFormatted} total).\n\nView it here: ${ctx.quoteUrl}`,
      };
    }
  }
}
