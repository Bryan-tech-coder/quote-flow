import Stripe from "stripe";

/** Returns null when STRIPE_SECRET_KEY isn't configured — deposit collection is an optional feature. */
export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}
