import { describe, it, expect } from "vitest";
import { calculateTotal, calculateDepositCents } from "@/lib/quotes";

describe("calculateTotal", () => {
  it("returns 0 for no items", () => {
    expect(calculateTotal([])).toBe(0);
  });

  it("multiplies quantity by unit price for a single item", () => {
    expect(calculateTotal([{ quantity: 3, unitPrice: 10 }])).toBe(30);
  });

  it("sums multiple line items", () => {
    const items = [
      { quantity: 2, unitPrice: 15.5 },
      { quantity: 1, unitPrice: 100 },
      { quantity: 5, unitPrice: 4.25 },
    ];
    expect(calculateTotal(items)).toBeCloseTo(2 * 15.5 + 100 + 5 * 4.25);
  });

  it("treats zero quantity as contributing nothing", () => {
    expect(calculateTotal([{ quantity: 0, unitPrice: 999 }])).toBe(0);
  });
});

describe("calculateDepositCents", () => {
  it("returns null when deposits are disabled (0%)", () => {
    expect(calculateDepositCents(500, 0)).toBeNull();
  });

  it("returns null for a negative percentage", () => {
    expect(calculateDepositCents(500, -10)).toBeNull();
  });

  it("computes a percentage of the total in cents", () => {
    expect(calculateDepositCents(500, 20)).toBe(10000);
  });

  it("rounds to the nearest cent for fractional totals", () => {
    expect(calculateDepositCents(99.99, 33)).toBe(Math.round(99.99 * 0.33 * 100));
  });

  it("supports a 100% deposit (pay in full upfront)", () => {
    expect(calculateDepositCents(250, 100)).toBe(25000);
  });
});
