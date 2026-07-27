export function calculateTotal(items: { quantity: number; unitPrice: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

/** Deposit amount in cents for a given quote total and percentage (0-100). Returns null when disabled. */
export function calculateDepositCents(total: number, depositPercent: number): number | null {
  if (depositPercent <= 0) return null;
  return Math.round(total * (depositPercent / 100) * 100);
}
