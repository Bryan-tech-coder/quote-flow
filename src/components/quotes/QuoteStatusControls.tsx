"use client";

import { useTransition } from "react";
import { updateQuoteStatus, deleteQuote } from "@/lib/actions/quotes";
import type { QuoteStatus } from "@/generated/prisma/client";

const statuses: QuoteStatus[] = ["DRAFT", "SENT", "APPROVED", "REJECTED"];

export function QuoteStatusControls({
  quoteId,
  status,
}: {
  quoteId: string;
  status: QuoteStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {statuses.map((s) => (
        <button
          key={s}
          disabled={isPending || s === status}
          onClick={() => startTransition(() => updateQuoteStatus(quoteId, s))}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition hover:bg-neutral-100 disabled:cursor-default disabled:bg-neutral-900 disabled:text-white dark:border-neutral-700 dark:hover:bg-neutral-900 dark:disabled:bg-white dark:disabled:text-neutral-900"
        >
          {s}
        </button>
      ))}
      <button
        onClick={() => window.print()}
        className="ml-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
      >
        Print / Save as PDF
      </button>
      <button
        onClick={() => {
          if (confirm("Delete this quote?")) {
            startTransition(() => deleteQuote(quoteId));
          }
        }}
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        Delete
      </button>
    </div>
  );
}
