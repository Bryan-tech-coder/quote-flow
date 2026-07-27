"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { enqueueQuoteNotification } from "@/lib/notifications/queue";
import { calculateTotal, calculateDepositCents } from "@/lib/quotes";
import { publicQuoteUrl } from "@/lib/notifications/urls";
import { getStripeClient } from "@/lib/stripe";

export type PublicQuoteActionState = { error?: string } | undefined;

export async function respondToQuote(
  accessToken: string,
  decision: "APPROVED" | "REJECTED"
): Promise<PublicQuoteActionState> {
  const quote = await prisma.quote.findUnique({ where: { accessToken } });
  if (!quote) return { error: "Quote not found." };
  if (quote.status !== "SENT") {
    return { error: "This quote has already been responded to." };
  }

  await prisma.quote.update({
    where: { accessToken },
    data: { status: decision },
  });

  await enqueueQuoteNotification(
    quote.id,
    decision === "APPROVED" ? "QUOTE_APPROVED" : "QUOTE_REJECTED"
  );

  revalidatePath(`/q/${accessToken}`);
}

export type DepositCheckoutState = { url?: string; error?: string };

export async function createDepositCheckout(
  accessToken: string
): Promise<DepositCheckoutState> {
  const stripe = getStripeClient();
  if (!stripe) {
    return { error: "This business hasn't enabled online deposit payments yet." };
  }

  const quote = await prisma.quote.findUnique({
    where: { accessToken },
    include: { client: true, items: true, organization: true },
  });
  if (!quote) return { error: "Quote not found." };
  if (quote.status !== "APPROVED") {
    return { error: "This quote hasn't been approved yet." };
  }
  if (quote.depositPaidAt) {
    return { error: "The deposit has already been paid." };
  }

  const depositCents =
    quote.depositAmountCents ??
    calculateDepositCents(calculateTotal(quote.items), quote.organization.depositPercent);
  if (!depositCents) {
    return { error: "This business doesn't require a deposit." };
  }

  const baseUrl = publicQuoteUrl(accessToken);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: depositCents,
          product_data: { name: `Deposit — ${quote.title}` },
        },
        quantity: 1,
      },
    ],
    customer_email: quote.client.email ?? undefined,
    success_url: `${baseUrl}?deposit=success`,
    cancel_url: `${baseUrl}?deposit=cancelled`,
    metadata: { quoteId: quote.id },
  });

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      depositAmountCents: depositCents,
      stripeCheckoutSessionId: session.id,
    },
  });

  if (!session.url) return { error: "Could not start checkout. Try again." };
  return { url: session.url };
}
