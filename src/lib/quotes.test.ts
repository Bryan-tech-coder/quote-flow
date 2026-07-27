import { describe, it, expect } from "vitest";
import { calculateTotal } from "@/lib/quotes";

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
