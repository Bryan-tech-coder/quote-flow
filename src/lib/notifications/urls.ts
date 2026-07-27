function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Public, no-login link the client uses to view and approve/reject the quote. */
export function publicQuoteUrl(accessToken: string): string {
  return `${baseUrl()}/q/${accessToken}`;
}

/** Login-gated link for the business's own dashboard. */
export function dashboardQuoteUrl(quoteId: string): string {
  return `${baseUrl()}/dashboard/quotes/${quoteId}`;
}
