"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updateEmailNotifications(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const enabled = formData.get("emailNotifications") === "on";

  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailNotifications: enabled },
  });

  revalidatePath("/dashboard/settings");
}

export async function updateDepositSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const raw = Number(formData.get("depositPercent"));
  const depositPercent = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : 0;

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: { depositPercent },
  });

  revalidatePath("/dashboard/settings");
}
