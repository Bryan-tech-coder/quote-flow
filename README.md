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

## Features

- Multi-tenant auth (NextAuth.js credentials provider) — signing up creates a business (`Organization`) with its own clients and quotes, isolated from every other tenant
- Client management (contact info, address)
- Quotes with dynamic line items, computed totals, status tracking (Draft → Sent → Approved/Rejected)
- Print-friendly quote view (browser print-to-PDF) for sending to clients
- **Omnichannel notification engine**: quote status changes enqueue notifications processed by a Postgres-backed job queue with exponential backoff retries (up to 5 attempts), a delivery log with per-notification error tracking, and per-user email preferences — a Vercel Cron job sweeps failed/pending sends on a schedule so nothing is lost to a transient failure
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

2. Install dependencies and run migrations:

   ```bash
   npm install
   npx prisma migrate dev
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), create a business account, add a client, and create a quote.

## Project structure

```
prisma/schema.prisma              Organization, User, Client, Quote, QuoteItem, Notification models
src/auth.ts                       NextAuth config (credentials provider, JWT sessions)
src/lib/actions/                  Server Actions (auth, clients, quotes, settings)
src/lib/notifications/            Notification queue, retry/backoff logic, templates, email channel adapter
src/app/api/cron/process-notifications/  Cron endpoint that sweeps pending/failed notifications
src/app/(auth)/                    Login / register pages
src/app/dashboard/                 Protected app: quotes, clients, notifications log, settings
```

## Deployment

Deployed on [Vercel](https://vercel.com) with a [Neon](https://neon.tech) Postgres database. `package.json` includes a `postinstall: prisma generate` script so the generated client (gitignored) is rebuilt on every install. `vercel.json` schedules the notification retry sweep via Vercel Cron — daily, since Vercel's Hobby plan only allows daily cron schedules (a Pro plan would allow hourly or finer). This only affects the retry sweep for failed sends; new notifications still attempt delivery immediately when enqueued.

## Possible extensions

- Client-facing approve/reject link (no login required) instead of manual status changes
- SMS channel alongside email
- Stripe integration for deposit collection on approved quotes
- CSV export of quotes and clients

## Author

**Bryan Ramos** — Software developer student at Holberton Coding School, Puerto Rico.
[GitHub](https://github.com/Bryan-tech-coder) · [Portfolio](https://portfolio-site-topaz-theta.vercel.app)
