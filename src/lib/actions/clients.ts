"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().optional(),
});

export type ClientActionState = { error?: string } | undefined;

export async function createClient(
  _state: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, phone, email, address } = parsed.data;

  await prisma.client.create({
    data: {
      organizationId: session.user.organizationId,
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
    },
  });

  revalidatePath("/dashboard/clients");
}

export async function deleteClient(clientId: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.client.deleteMany({
    where: { id: clientId, organizationId: session.user.organizationId },
  });

  revalidatePath("/dashboard/clients");
}
