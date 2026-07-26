import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NewQuoteForm } from "@/components/quotes/NewQuoteForm";

export default async function NewQuotePage() {
  const session = await auth();
  const clients = await prisma.client.findMany({
    where: { organizationId: session!.user.organizationId },
    orderBy: { name: "asc" },
  });

  if (clients.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold tracking-tight">New quote</h1>
        <p className="text-sm text-neutral-500">
          Add a client first before creating a quote.
        </p>
        <Link
          href="/dashboard/clients"
          className="self-start rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Add a client
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">New quote</h1>
      <NewQuoteForm clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
