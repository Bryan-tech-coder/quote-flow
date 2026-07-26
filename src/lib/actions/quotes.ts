"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { QuoteStatus, NotificationEvent } from "@/generated/prisma/client";
import { enqueueQuoteNotification } from "@/lib/notifications/queue";

const itemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

const quoteSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  title: z.string().trim().min(1, "Title is required"),
  notes: z.string().trim().optional(),
});

export type QuoteActionState = { error?: string } | undefined;

export async function createQuote(
  _state: QuoteActionState,
  formData: FormData
): Promise<QuoteActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const parsed = quoteSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const descriptions = formData.getAll("itemDescription");
  const quantities = formData.getAll("itemQuantity");
  const unitPrices = formData.getAll("itemUnitPrice");

  const items = descriptions
    .map((description, i) => ({
      description,
      quantity: quantities[i],
      unitPrice: unitPrices[i],
    }))
    .filter((item) => String(item.description).trim().length > 0)
    .map((item, order) => {
      const parsedItem = itemSchema.safeParse(item);
      if (!parsedItem.success) return null;
      return { ...parsedItem.data, order };
    });

  if (items.some((item) => item === null) || items.length === 0) {
    return { error: "Each line item needs a description, quantity, and price" };
  }

  const { clientId, title, notes } = parsed.data;

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: session.user.organizationId },
  });
  if (!client) return { error: "Client not found" };

  const quote = await prisma.quote.create({
    data: {
      organizationId: session.user.organizationId,
      clientId,
      title,
      notes: notes || null,
      items: {
        create: items as { description: string; quantity: number; unitPrice: number; order: number }[],
      },
    },
  });

  redirect(`/dashboard/quotes/${quote.id}`);
}

const notificationEventForStatus: Partial<Record<QuoteStatus, NotificationEvent>> = {
  SENT: "QUOTE_SENT",
  APPROVED: "QUOTE_APPROVED",
  REJECTED: "QUOTE_REJECTED",
};

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus) {
  const session = await auth();
  if (!session?.user) return;

  const { count } = await prisma.quote.updateMany({
    where: { id: quoteId, organizationId: session.user.organizationId },
    data: { status },
  });

  const event = notificationEventForStatus[status];
  if (count > 0 && event) {
    await enqueueQuoteNotification(quoteId, event);
  }

  revalidatePath(`/dashboard/quotes/${quoteId}`);
  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/notifications");
}

export async function deleteQuote(quoteId: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.quote.deleteMany({
    where: { id: quoteId, organizationId: session.user.organizationId },
  });

  revalidatePath("/dashboard/quotes");
  redirect("/dashboard/quotes");
}
