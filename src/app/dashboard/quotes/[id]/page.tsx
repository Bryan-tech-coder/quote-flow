import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateTotal } from "@/lib/quotes";
import { QuoteStatusControls } from "@/components/quotes/QuoteStatusControls";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const quote = await prisma.quote.findFirst({
    where: { id, organizationId: session!.user.organizationId },
    include: {
      client: true,
      items: { orderBy: { order: "asc" } },
      organization: true,
    },
  });

  if (!quote) notFound();

  const total = calculateTotal(quote.items);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold tracking-tight">{quote.title}</h1>
      </div>

      <QuoteStatusControls
        quoteId={quote.id}
        accessToken={quote.accessToken}
        status={quote.status}
      />

      {quote.depositAmountCents != null && (
        <p className="text-sm text-neutral-500 print:hidden">
          Deposit: ${(quote.depositAmountCents / 100).toFixed(2)} —{" "}
          {quote.depositPaidAt
            ? `paid ${new Date(quote.depositPaidAt).toLocaleDateString()}`
            : "awaiting payment"}
        </p>
      )}

      <div className="rounded-lg border border-neutral-200 p-6 print:border-0 dark:border-neutral-800">
        <div className="flex items-start justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <div>
            <p className="text-lg font-semibold">{quote.organization.name}</p>
            <p className="text-sm text-neutral-500">Quote #{quote.id.slice(-8)}</p>
          </div>
          <div className="text-right text-sm text-neutral-500">
            <p>{new Date(quote.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-neutral-500">
              Bill to
            </p>
            <p className="text-sm font-medium">{quote.client.name}</p>
            {quote.client.address && (
              <p className="text-sm text-neutral-500">{quote.client.address}</p>
            )}
            {quote.client.email && (
              <p className="text-sm text-neutral-500">{quote.client.email}</p>
            )}
            {quote.client.phone && (
              <p className="text-sm text-neutral-500">{quote.client.phone}</p>
            )}
          </div>
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
    </div>
  );
}
