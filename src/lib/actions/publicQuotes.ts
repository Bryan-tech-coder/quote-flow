"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { enqueueQuoteNotification } from "@/lib/notifications/queue";

export type PublicQuoteActionState = { error?: string } | undefined;

export async function respondToQuote(
  quoteId: string,
  decision: "APPROVED" | "REJECTED"
): Promise<PublicQuoteActionState> {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) return { error: "Quote not found." };
  if (quote.status !== "SENT") {
    return { error: "This quote has already been responded to." };
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: decision },
  });

  await enqueueQuoteNotification(
    quoteId,
    decision === "APPROVED" ? "QUOTE_APPROVED" : "QUOTE_REJECTED"
  );

  revalidatePath(`/q/${quoteId}`);
}
