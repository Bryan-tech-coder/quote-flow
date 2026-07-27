# QuoteFlow

![CI](https://github.com/Bryan-tech-coder/quote-flow/actions/workflows/ci.yml/badge.svg)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![NextAuth.js](https://img.shields.io/badge/NextAuth.js-000000?logo=auth0&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)

A multi-tenant SaaS for contractors and service businesses to send professional quotes, track their status, and manage clients — built to be a real product, not just a demo.

**[Read the architecture case study →](CASE_STUDY.md)** — how the notification engine's Postgres-backed queue, retry/backoff, and failure isolation work, and what I'd change with more time.

## Features

- Multi-tenant auth (NextAuth.js credentials provider) — signing up creates a business (`Organization`) with its own clients and quotes, isolated from every other tenant
- Client management (contact info, address)
- Quotes with dynamic line items, computed totals, status tracking (Draft → Sent → Approved/Rejected)
- Print-friendly quote view (browser print-to-PDF) for the business's own copy
- **Real PDF generation** (`@react-pdf/renderer`) attached to the "quote sent" email — the client gets an actual PDF, not just a link
- **Public, no-login approve/reject page** (`/q/[id]`) — the link sent to clients in the "quote sent" email; approving or rejecting there updates the quote status and fires the same notification pipeline as a manual status change
- **Automatic follow-up reminders** — quotes left in "Sent" for 3+ days with no client response get one reminder email, swept in by the same daily cron that retries failed notifications
- **Stripe deposit collection**: businesses can require a configurable percentage of the quote upfront (Settings → Deposits); once a client approves a quote, they're offered a Stripe Checkout session for that deposit, and a webhook confirms payment and notifies the business — real Stripe test-mode integration, not a stub
- **Omnichannel notification engine**: quote status changes enqueue notifications processed by a Postgres-backed job queue with exponential backoff retries (up to 5 attempts), a delivery log with per-notification error tracking, and per-user email preferences — a Vercel Cron job sweeps failed/pending sends and stale-quote reminders on a schedule so nothing is lost to a transient failure
- Pluggable email channel (Resend API) that gracefully logs to the console in local dev when no API key is configured

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- TypeScript, Tailwind CSS
- PostgreSQL + [Prisma ORM](https://www.prisma.io/) (driver adapters)
- [NextAuth.js (Auth.js v5)](https://authjs.dev/)
- [Resend](https://resend.com/) for transactional email

## Getting started

1. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

   Point `DATABASE_URL` at a Postgres instance (a free [Neon](https://neon.tech) project works well) and generate `AUTH_SECRET`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   `RESEND_API_KEY` is optional — without it, notification emails are logged to the server console instead of sent.

   `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` are optional — without them, deposit collection is simply disabled (no "Pay deposit" button appears, and `/api/stripe/webhook` returns 501).

2. Install dependencies and run migrations:

   ```bash
   npm install
   npx prisma migrate dev
   ```

   Optionally seed realistic demo data (a contractor org with clients and quotes across every status):

   ```bash
   npx prisma db seed
   ```

   Logs in as `demo@quoteflow.app` / `Demo1234!`. Safe to re-run — it replaces the previous demo org instead of duplicating it.

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), create a business account, add a client, and create a quote.

## Project structure

```
prisma/schema.prisma              Organization, User, Client, Quote, QuoteItem, Notification models
src/auth.ts                       NextAuth config (credentials provider, JWT sessions)
src/lib/actions/                  Server Actions (auth, clients, quotes, settings, public quote responses)
src/lib/notifications/            Notification queue, retry/backoff, stale-quote reminders, templates, email channel adapter
src/lib/pdf/                      PDF quote generation (@react-pdf/renderer)
src/lib/stripe.ts                 Stripe client, returns null when unconfigured
src/app/api/cron/process-notifications/  Cron endpoint: sends reminders, then sweeps pending/failed notifications
src/app/api/stripe/webhook/       Stripe webhook: confirms deposit payment, marks the quote paid, notifies the business
src/app/(auth)/                    Login / register pages
src/app/dashboard/                 Protected app: quotes, clients, notifications log, settings
src/app/q/[id]/                    Public, no-login quote view + approve/reject
```

## Deployment

Deployed on [Vercel](https://vercel.com) with a [Neon](https://neon.tech) Postgres database. `package.json` includes a `postinstall: prisma generate` script so the generated client (gitignored) is rebuilt on every install. `vercel.json` schedules the notification retry sweep via Vercel Cron — daily, since Vercel's Hobby plan only allows daily cron schedules (a Pro plan would allow hourly or finer). This only affects the retry sweep for failed sends; new notifications still attempt delivery immediately when enqueued.

## Deposits (Stripe)

Set a deposit percentage per business at Settings → Deposits. Once a client approves a quote, if a deposit is configured, they see a "Pay deposit" button that opens a Stripe Checkout session (test mode — use [Stripe's test cards](https://docs.stripe.com/testing#cards), e.g. `4242 4242 4242 4242`). On `checkout.session.completed`, `/api/stripe/webhook` marks the quote's deposit paid and notifies the business via the same notification engine used everywhere else.

To test locally, forward webhooks with the [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Possible extensions

- SMS channel alongside email
- Stripe Connect (each contractor's own Stripe account) instead of a single platform account
- CSV export of quotes and clients

## Author

**Bryan Ramos** — Software developer student at Holberton Coding School, Puerto Rico.
[GitHub](https://github.com/Bryan-tech-coder) · [Portfolio](https://portfolio-site-topaz-theta.vercel.app)
