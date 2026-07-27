"use client";

import { useState, useTransition } from "react";
import { respondToQuote } from "@/lib/actions/publicQuotes";

export function PublicQuoteActions({ quoteId }: { quoteId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [responded, setResponded] = useState<"APPROVED" | "REJECTED" | null>(null);

  const respond = (decision: "APPROVED" | "REJECTED") => {
    setError(null);
    startTransition(async () => {
      const result = await respondToQuote(quoteId, decision);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setResponded(decision);
    });
  };

  if (responded) {
    return (
      <p className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm font-medium dark:border-neutral-800 dark:bg-neutral-900">
        {responded === "APPROVED"
          ? "You approved this quote. The business has been notified."
          : "You rejected this quote. The business has been notified."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => respond("APPROVED")}
          className="flex-1 rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Approve quote
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => respond("REJECTED")}
          className="flex-1 rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Reject quote
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
