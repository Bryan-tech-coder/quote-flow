"use client";

import { useState, useTransition } from "react";
import { createDepositCheckout } from "@/lib/actions/publicQuotes";

export function DepositCheckoutButton({
  accessToken,
  amountCents,
}: {
  accessToken: string;
  amountCents: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pay = () => {
    setError(null);
    startTransition(async () => {
      const result = await createDepositCheckout(accessToken);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) window.location.href = result.url;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={pay}
        className="self-start rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {isPending
          ? "Redirecting to secure checkout…"
          : `Pay deposit — $${(amountCents / 100).toFixed(2)}`}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
