import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateTotal } from "@/lib/quotes";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function QuotesPage() {
  const session = await auth();
  const quotes = await prisma.quote.findMany({
    where: { organizationId: session!.user.organizationId },
    include: { client: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Quotes</h1>
        <Link
          href="/dashboard/quotes/new"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          New quote
        </Link>
      </div>

      <div className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {quotes.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">
            No quotes yet.{" "}
            <Link href="/dashboard/quotes/new" className="underline">
              Create your first one.
            </Link>
          </p>
        )}
        {quotes.map((quote) => {
          const total = calculateTotal(quote.items);
          return (
            <Link
              key={quote.id}
              href={`/dashboard/quotes/${quote.id}`}
              className="flex items-center justify-between gap-4 p-4 transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <div>
                <p className="text-sm font-medium">{quote.title}</p>
                <p className="text-sm text-neutral-500">{quote.client.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  ${total.toFixed(2)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[quote.status]}`}
                >
                  {quote.status}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
