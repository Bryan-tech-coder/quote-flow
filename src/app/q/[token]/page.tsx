import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { calculateTotal } from "@/lib/quotes";
import { PublicQuoteActions } from "@/components/quotes/PublicQuoteActions";

export const metadata: Metadata = {
  title: "Quote — QuoteFlow",
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const quote = await prisma.quote.findUnique({
    where: { accessToken: token },
    include: {
      client: true,
      items: { orderBy: { order: "asc" } },
      organization: true,
    },
  });

  if (!quote) notFound();

  const total = calculateTotal(quote.items);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">
          {quote.organization.name}
        </h1>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[quote.status]}`}
        >
          {quote.status}
        </span>
      </div>

      <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
        <div className="flex items-start justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <div>
            <p className="text-lg font-semibold">{quote.title}</p>
            <p className="text-sm text-neutral-500">Quote #{quote.id.slice(-8)}</p>
          </div>
          <div className="text-right text-sm text-neutral-500">
            <p>{new Date(quote.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="py-4">
          <p className="text-xs font-medium uppercase text-neutral-500">
            Bill to
          </p>
          <p className="text-sm font-medium">{quote.client.name}</p>
          {quote.client.address && (
            <p className="text-sm text-neutral-500">{quote.client.address}</p>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-neutral-100 dark:border-neutral-900"
              >
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="py-2 text-right">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end pt-4">
          <p className="text-base font-semibold">Total: ${total.toFixed(2)}</p>
        </div>

        {quote.notes && (
          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <p className="text-xs font-medium uppercase text-neutral-500">
              Notes
            </p>
            <p className="text-sm">{quote.notes}</p>
          </div>
        )}
      </div>

      {quote.status === "SENT" && (
        <PublicQuoteActions accessToken={quote.accessToken} />
      )}
      {quote.status === "APPROVED" && (
        <p className="text-sm text-neutral-500">
          This quote was approved on {new Date(quote.updatedAt).toLocaleDateString()}.
        </p>
      )}
      {quote.status === "REJECTED" && (
        <p className="text-sm text-neutral-500">
          This quote was rejected on {new Date(quote.updatedAt).toLocaleDateString()}.
        </p>
      )}
    </main>
  );
}
