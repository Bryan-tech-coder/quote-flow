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
