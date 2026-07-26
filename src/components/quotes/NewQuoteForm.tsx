"use client";

import { useActionState, useState } from "react";
import { createQuote } from "@/lib/actions/quotes";

type Item = { description: string; quantity: string; unitPrice: string };

const emptyItem: Item = { description: "", quantity: "1", unitPrice: "" };

export function NewQuoteForm({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createQuote, undefined);
  const [items, setItems] = useState<Item[]>([{ ...emptyItem }]);

  const updateItem = (index: number, field: keyof Item, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="clientId" className="text-sm font-medium">
          Client
        </label>
        <select
          id="clientId"
          name="clientId"
          required
          className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="Kitchen remodel"
          className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Line items</span>
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_5rem_6rem_auto] gap-2">
            <input
              name="itemDescription"
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(i, "description", e.target.value)}
              className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
            />
            <input
              name="itemQuantity"
              type="number"
              step="0.01"
              min="0"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateItem(i, "quantity", e.target.value)}
              className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
            />
            <input
              name="itemUnitPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="Price"
              value={item.unitPrice}
              onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
              className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
            />
            <button
              type="button"
              onClick={() =>
                setItems((prev) => prev.filter((_, idx) => idx !== i))
              }
              disabled={items.length === 1}
              className="rounded-md border border-neutral-300 px-2 text-sm text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              &times;
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}
          className="self-start text-sm font-medium underline"
        >
          + Add line item
        </button>
      </div>

      <p className="text-sm font-medium">Total: ${total.toFixed(2)}</p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {pending ? "Creating..." : "Create quote"}
      </button>
    </form>
  );
}
