# Architecture notes: the notification engine

QuoteFlow's core CRUD (organizations, clients, quotes) is standard Next.js/Prisma work. The part worth explaining is the piece that isn't: a small, self-contained delivery system for "the client needs to hear about this quote" that has to survive a flaky email provider without losing a message or spamming anyone.

## The problem

A quote's lifecycle triggers emails: sent to the client, approved/rejected back to the business, a reminder if the client goes quiet. Any of these can fail — a slow DNS lookup, a 500 from the email provider, a bad recipient. A naive `await sendEmail(...)` inside the server action that changes quote status means:

- A slow provider makes the user's "send quote" click hang.
- A failed send is silently lost — there's no record it was ever supposed to happen.
- A transient failure (provider hiccup) becomes permanent, when a retry a minute later would have worked.

## The design: a Postgres-backed queue, not a job runner

Rather than reach for a message queue (Redis, SQS) for what's fundamentally a low-volume, non-realtime workload, notifications are just rows in the existing Postgres database:

```prisma
model Notification {
  status        NotificationStatus  @default(PENDING)  // PENDING | SENT | FAILED
  attempts       Int                @default(0)
  maxAttempts    Int                @default(5)
  nextAttemptAt  DateTime           @default(now())
  lastError      String?
  @@index([status, nextAttemptAt])
}
```

Changing a quote's status calls `enqueueQuoteNotification()` ([`src/lib/notifications/queue.ts`](src/lib/notifications/queue.ts)), which writes one `Notification` row per recipient and returns immediately — the user-facing action never blocks on network I/O to a third party. A worker function, `processPendingNotifications()`, then does the actual sending: it pulls due rows (`status = PENDING AND nextAttemptAt <= now()`), attempts delivery, and updates each row's status.

This gets called two ways: once inline, right after enqueueing (so a healthy send goes out in the same request-response cycle with no perceptible delay), and once from `/api/cron/process-notifications`, a Vercel Cron endpoint that sweeps anything still pending — the safety net for whatever the inline attempt didn't clear.

## Retry math

On failure, the row isn't marked `FAILED` outright — `attempts` increments and `nextAttemptAt` moves forward using exponential backoff:

```ts
// src/lib/notifications/backoff.ts
export function backoffFor(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** attempts, MAX_BACKOFF_MS);
}
```

30s, 1m, 2m, 4m, ... capped at an hour, up to `maxAttempts` (5) before the row is finally marked `FAILED` and stops retrying. This is the same backoff shape used in [billing-engine](https://github.com/Bryan-tech-coder/billing-engine)'s webhook delivery queue — same problem (unreliable downstream, need bounded retries), same fix, two different stacks (Next.js/Prisma here, FastAPI/SQLAlchemy there), which is deliberate: it's a pattern, not a coincidence.

## Failure isolation

`processPendingNotifications` loops over due rows and wraps each send in its own try/catch — one recipient's bounce doesn't stop the others in the same batch from being attempted, and the error message gets written to `lastError` on that row specifically, so `/dashboard/notifications` shows exactly which sends failed and why instead of a generic "something went wrong."

## Degrading safely without a provider configured

`sendEmail()` ([`src/lib/notifications/channels/email.ts`](src/lib/notifications/channels/email.ts)) checks for `RESEND_API_KEY` and, if it's unset, logs the would-be email to the console and returns successfully instead of throwing. That means the entire quote lifecycle — including the parts that "send email" — works end-to-end in local dev or a fresh clone with zero external accounts required. This isn't a stub that gets ripped out later; it's the permanent behavior for missing config, and the same pattern shows up in [support-desk-live](https://github.com/Bryan-tech-coder/support-desk-live)'s Pusher integration (real-time degrades to "just works without live updates" rather than crashing).

## What I'd change with more time

- **At-least-once, not exactly-once**: if the process crashes between sending an email and updating the row to `SENT`, the next sweep will resend it. Fine for this volume (a few emails per quote), but a real payments-adjacent system would need an idempotency key on the provider side.
- **No dead-letter visibility beyond the dashboard table**: `FAILED` rows just sit there. At meaningful volume this wants an alert, not just a page someone has to remember to check.
- **Single worker, no locking**: `processPendingNotifications` assumes it isn't called concurrently with itself. True today (one cron schedule, one inline call per request), but would need a `SELECT ... FOR UPDATE SKIP LOCKED`-style claim if this ever ran on multiple instances.
