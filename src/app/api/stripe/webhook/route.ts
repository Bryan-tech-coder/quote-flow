import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { enqueueQuoteNotification } from "@/lib/notifications/queue";

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const quoteId = session.metadata?.quoteId;

    if (quoteId) {
      const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
      if (quote && !quote.depositPaidAt) {
        await prisma.quote.update({
          where: { id: quoteId },
          data: { depositPaidAt: new Date() },
        });
        await enqueueQuoteNotification(quoteId, "DEPOSIT_PAID");
      }
    }
  }

  return NextResponse.json({ received: true });
}
