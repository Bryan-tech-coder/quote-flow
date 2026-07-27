"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { enqueueQuoteNotification } from "@/lib/notifications/queue";

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
