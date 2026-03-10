# Developer Setup Guide

This guide is for contributors and maintainers running API Spend Guard locally.

## COSS Maintenance: Dev vs Production Isolation

In a commercial open-source project, contributors must be able to run and test features locally without any path to your live billing stack or production data.

### 1) Repository Contract

- Commit a documented `.env.example` with placeholder values and comments
- Never commit `.env`, `.env.local`, or `.env.production`
- Keep secret-bearing variables server-only unless explicitly public (`NEXT_PUBLIC_*`)

### 2) Supabase Environment Split

- **Production:** hosted Supabase project; keys only in Vercel **Production** env
- **Development:** contributor-local Supabase via CLI + Docker
- Avoid using one shared database for both local development and production

Contributor local DB flow:

```bash
npx supabase start
npx supabase db push
```

### 3) Stripe Environment Split

- **Development:** `pk_test_*`, `sk_test_*`, and test webhook secret
- **Production:** `pk_live_*`, `sk_live_*`, and live webhook secret
- Live Stripe keys should never exist in local contributor environments

### 4) Branch + Deployment Contract

- `main` is production-only and deploys to your primary domain
- Feature branches deploy to isolated preview URLs with **Preview** env vars
- Open-source PRs are reviewed before merge; secrets are never exposed to forks

### 5) Non-Negotiable Safety Rules

- No production service-role key in local files
- No production Stripe secret in local files
- No production webhook signing secret in local files
- No production cron auth token in public CI logs

These controls preserve contributor freedom while protecting the revenue engine.

## Local Development

### Prerequisites

- Node.js 18+
- Docker Desktop (for local Supabase CLI stack)
- Provider keys with **read-only billing/usage scopes**
- Discord webhook URL (optional)
- Twilio account (optional for SMS)
- Stripe test account (optional, for checkout/webhook testing)

### Installation

```bash
git clone https://github.com/DevLaiGer/api-spend-guard.git
cd api-spend-guard
npm install
cp .env.example .env.local
```

### Required Environment Variables

Define these in `.env.local` using **development/test** credentials:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_SECRET`
- `CRON_AUTH_TOKEN`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test key)
- `STRIPE_SECRET_KEY` (test key)
- `STRIPE_WEBHOOK_SECRET` (test endpoint secret)
- `TWILIO_ACCOUNT_SID` (optional)
- `TWILIO_AUTH_TOKEN` (optional)
- `TWILIO_FROM_NUMBER` (optional)

Production equivalents belong only in Vercel Production environment settings.

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Contributor Workflow

1. Fork the repo
2. Create a short-lived branch from `main`:
   - `feat/<name>`
   - `fix/<name>`
   - `docs/<name>`
3. Use a Conventional Commit message prefix (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`)
4. Add tests for adapter logic and alert edge cases
5. Open a PR with screenshots/log samples

For full GitHub Flow + CI + release policy, see `docs/repository-maintenance.md`.
