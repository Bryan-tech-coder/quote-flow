import { describe, it, expect } from "vitest";
import { backoffFor } from "@/lib/notifications/backoff";

describe("backoffFor", () => {
  it("starts at the base backoff on the first attempt", () => {
    expect(backoffFor(0)).toBe(30_000);
  });

  it("doubles with each subsequent attempt", () => {
    expect(backoffFor(1)).toBe(60_000);
    expect(backoffFor(2)).toBe(120_000);
    expect(backoffFor(3)).toBe(240_000);
  });

  it("caps at the maximum backoff instead of growing unbounded", () => {
    expect(backoffFor(10)).toBe(60 * 60_000);
    expect(backoffFor(20)).toBe(60 * 60_000);
  });
});
