import { describe, it, expect, afterEach } from "vitest";
import { getStripeClient } from "@/lib/stripe";

describe("getStripeClient", () => {
  const original = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = original;
  });

  it("returns null when STRIPE_SECRET_KEY is unset", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(getStripeClient()).toBeNull();
  });

  it("returns a Stripe client when STRIPE_SECRET_KEY is set", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    expect(getStripeClient()).not.toBeNull();
  });
});
