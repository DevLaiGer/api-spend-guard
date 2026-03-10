# API Spend Guard

**Stop surprise API bills before they happen.**  
API Spend Guard is a read-only, multi-provider cost monitoring platform for teams using OpenAI, Anthropic, GCP, and other AI/API services. It aggregates spend into one dashboard and sends real-time alerts when usage crosses your custom thresholds.

---

## The Problem

Modern SaaS products are now API-heavy and model-heavy:

- Spend is spread across multiple vendor dashboards
- Billing delays hide bad loops until damage is done
- One leaked key or runaway agent can burn budget overnight

Teams need a proactive cost alarm, not a post-mortem.

---

## The Solution

API Spend Guard gives you one place to monitor API costs and react early.

- **Unified spend visibility:** Daily and monthly breakdowns across providers
- **Threshold-based alerts:** Discord and SMS notifications the moment spend spikes
- **Read-only by design:** No proxying production traffic; no latency impact
- **Encrypted credentials:** API keys encrypted at rest with server-side controls

---

## Who This Is For

- AI startups with fast iteration cycles
- Agencies managing multiple client API keys
- Product teams running LLM features in production
- Founders who want simple cost guardrails without building internal tooling

---

## Product Positioning

API Spend Guard acts like a **financial smoke detector** for your API stack.

- Not a billing replacement
- Not an API gateway
- Not another analytics dashboard with vanity charts

It is focused on one high-value job: **detect abnormal spend fast and notify the right people immediately.**

---

## Deployment Options

1. **Self-hosted (free/open source)**  
   Run your own instance, configure your own database, and manage your own schedulers.
2. **Cloud hosted (SaaS)**  
   Managed infrastructure, uptime, secure webhook handling, and faster onboarding.

> Update the cloud pricing and production URL before public launch.

---

## Core Features

- **Multi-provider dashboard:** OpenAI, Anthropic, GCP, Twilio, and extensible adapters
- **Real-time threshold alerts:** Alert users when daily spend exceeds limits
- **Per-user guardrails:** Store budget thresholds and alert channels by tenant
- **Secure key lifecycle:** Encrypt at write, decrypt only in scheduled workers
- **Modular provider integration:** Add new providers with isolated adapter functions

---

## Architecture Overview (v3 Production Design)

The system is designed around two planes:

- **Control plane:** tenancy, policies, scheduler, key management
- **Data plane:** ingestion workers, normalization, rule evaluation, dispatch

This separation keeps sensitive control operations minimal while allowing ingestion and alerting to scale independently.

### 1) Logical Components

1. **Scheduler service**  
   Creates deterministic jobs per `tenant_id + provider + interval` and pushes them to queue.
2. **Ingestion workers**  
   Pull usage/cost data from provider APIs, handle pagination/rate limits, and emit normalized events.
3. **Normalization pipeline**  
   Converts provider-specific payloads into canonical events (`usage_events`) and rollups.
4. **Policy engine**  
   Evaluates hard limits, anomaly rules, and per-tenant cooldown windows.
5. **Alert dispatcher**  
   Delivers notifications to Discord/SMS with dedupe keys and retry guarantees.
6. **Dashboard/query API**  
   Serves aggregated spend and incident timelines with strict tenant isolation.

### 2) Ingestion Modes (Hybrid, Provider-Aware)

- **Pull mode (default):** periodic sync against billing/usage APIs (OpenAI, Anthropic, etc.)
- **Push mode (preferred when available):** billing-budget webhooks for providers like GCP/AWS

Design rule: use push where providers natively support budget events, and fall back to pull where they do not.  
Both paths feed the same normalization pipeline so downstream logic remains provider-agnostic.

### 3) MVP Operating Mode (30-Day Build)

To preserve zero-friction onboarding and ship quickly:

- Run a time-stepped cron every 60 seconds
- Process a small deterministic batch each tick (cursor-based tenant selection)
- Keep ingestion read-only and avoid traffic proxying
- Add exponential backoff immediately; defer heavy infra/proxy complexity

This gives predictable compute, simpler operations, and fast time-to-market.

#### Time-Stepped Cron Contract

Use deterministic sharding so each minute only processes a subset of tenants:

- Each tenant is assigned `check_minute` in `[0..59]`
- Every minute, cron runs `WHERE check_minute = current_utc_minute`
- Each execution processes a capped batch (`LIMIT N`) with continuation cursor
- Persist run metadata in `sync_runs` (`started_at`, `finished_at`, `status`, `error_count`)

This keeps function duration bounded and avoids noisy-neighbor effects.

### 4) Queue + Execution Semantics

Jobs are idempotent, isolated, and replay-safe.

- **Idempotency key:** `tenant_id:provider:window_start:window_end`
- **Delivery mode:** at-least-once, compensated by idempotent writes
- **Retries:** exponential backoff + jitter
- **Poison jobs:** dead-letter queue with replay tooling
- **Concurrency limits:** global + per-provider + per-tenant caps
- **Circuit breaker:** temporarily pause a provider adapter on sustained 5xx/429 storms

This prevents runaway retries and protects providers from burst traffic.

### 5) Data Model (Canonical)

- `provider_accounts` - encrypted credentials and scopes
- `usage_events` - normalized atomic usage/cost entries
- `spend_rollups_hourly` / `spend_rollups_daily` - query-optimized aggregates
- `policies` - limits, anomaly params, notification routing
- `alerts` - incident records and lifecycle state
- `alert_deliveries` - channel delivery attempts and outcomes
- `sync_runs` - ingestion audit trail, latency, and error metadata
- `error_logs` - operator-facing ingestion/provider failure records
- `tenants.check_minute` - deterministic minute bucket for staggered cron batches

Use append-only event writes where possible; build rollups asynchronously for fast dashboard reads.

### 6) Detection Strategy

Evaluate three rule classes in order:

1. **Hard budget breach:** `spend_today >= daily_limit`
2. **Velocity spike:** slope/percent growth against trailing baseline
3. **Burst anomaly:** short-window spend exceeds dynamic threshold

Each rule emits a normalized incident signal; dedupe and cooldown are applied before dispatch.

### 7) Security and Tenant Isolation

- API keys encrypted at rest (envelope encryption + rotatable data keys)
- Decryption only in trusted backend workers, never client-side
- Row-level security for all tenant-bound tables
- Service-layer authorization checks on every mutation and read path
- Signed internal queue payloads and short-lived worker auth tokens
- Audit logs for credential updates, policy changes, and manual replays

### 8) Reliability and SLOs

Primary reliability targets:

- **Freshness SLO:** 99% of tenants updated within configured sync interval + grace window
- **Alert latency SLO:** p95 policy-match to notification under target threshold
- **Delivery SLO:** channel success rate with bounded retry window

Operational metrics:

- Queue lag, retry ratio, DLQ depth
- Provider API latency/error budget by adapter
- Rule evaluation latency and false-positive rate
- Alert dedupe suppression counts

### 9) Scalability Notes

- Partition hot tables by date and tenant
- Pre-compute rollups and cache dashboard queries
- Keep workers stateless for horizontal autoscaling
- Add provider-specific throttling profiles
- Separate ingestion and alert queues to avoid head-of-line blocking

### 10) Disaster Recovery + Backfill

- Point-in-time recovery for primary datastore
- Replay pipeline from `sync_runs` and raw snapshots
- Backfill mode to rebuild rollups after schema/rule changes
- Graceful degradation: if one provider fails, others continue syncing

### 11) End-to-End Request Flow

1. Scheduler generates due sync jobs and enqueues them
2. Worker retrieves job, decrypts credential, fetches provider usage
3. Normalizer writes canonical events and updates rollups
4. Policy engine evaluates breaches/anomalies
5. Dispatcher sends deduped alerts with retries
6. Query API serves updated dashboard and incident feed

### 12) What We Deliberately Do Not Do (Yet)

- No request-level proxy in the MVP path
- No mandatory SDK instrumentation for customer apps
- No 15-second "real-time" polling before PMF

The product moat for early adoption is low setup friction and reliable alerts, not deep invasive integration.

### 13) Operator/Admin Plane (Post-Launch)

After first paying users, add a lightweight internal admin route for support and incident triage.

- **Fire alarm table:** live feed of recent `error_logs` (429s, auth failures, webhook signature errors)
- **User lookup:** search by email or billing ID to inspect tenant status
- **Critical support fields:** last successful sync time, alert cooldown state, delivery failures
- **Provider health lens:** grouped failures by provider + error code to detect systemic incidents

Keep this route minimal and locked down:

- Protect with middleware allowlist for owner/admin emails
- Do not expose decrypted secrets in admin views
- Focus on diagnosis speed, not broad internal tooling

Recommended minimum `error_logs` shape:

- `id`, `tenant_id`, `provider`, `error_code`, `message`
- `job_id`, `attempt`, `created_at`
- `resolved_at` (optional), `resolved_by` (optional)

### 14) Phased Architecture Evolution

- **Phase 1 (MVP):** time-stepped cron + pull ingestion + Discord/SMS alerting
- **Phase 2 (stability):** add operator admin plane, `error_logs`, delivery observability
- **Phase 3 (scale):** webhook-first providers, advanced anomaly tuning, autoscaled workers
- **Phase 4 (enterprise):** incident exports, audit trails, and role-based admin access

This phased plan keeps engineering focused on reliability and customer value before complexity.

---

## System Design (Implementation Blueprint)

This section is the practical build spec for the SaaS version.

### A) Service Boundaries

1. **Web App (Next.js)**
   - Auth, onboarding, provider key setup, dashboard UI
   - Read APIs for rollups, alerts, sync status
2. **Scheduler**
   - Triggers minute-level sync cycles
   - Selects due tenants and enqueues jobs
3. **Ingestion Worker**
   - Fetches provider usage data
   - Normalizes records and persists events/rollups
4. **Policy Engine**
   - Evaluates limits/anomalies on fresh rollups
5. **Alert Worker**
   - Sends Discord/SMS with retry, dedupe, cooldown
6. **Admin Plane (internal)**
   - Error triage, user lookup, provider health view

### B) Core Data Contracts

Minimum logical tables:

- `tenants(id, name, check_minute, timezone, plan_tier, created_at)`
- `provider_accounts(id, tenant_id, provider, encrypted_key, key_scope, status, created_at, updated_at)`
- `policies(id, tenant_id, daily_limit_usd, spike_pct, burst_window_min, cooldown_min, channels_json)`
- `usage_events(id, tenant_id, provider, metric_time, usage_units, cost_usd, source_type, source_ref, created_at)`
- `spend_rollups_hourly(tenant_id, provider, hour_bucket, cost_usd, usage_units)`
- `spend_rollups_daily(tenant_id, provider, day_bucket, cost_usd, usage_units)`
- `alerts(id, tenant_id, provider, alert_type, severity, state, fingerprint, opened_at, closed_at)`
- `alert_deliveries(id, alert_id, channel, destination, status, attempt, error, sent_at)`
- `sync_runs(id, tenant_id, provider, window_start, window_end, status, attempt_count, error_count, started_at, finished_at)`
- `error_logs(id, tenant_id, provider, error_code, message, job_id, attempt, created_at, resolved_at, resolved_by)`

### C) Minute Cron Algorithm

At each minute:

1. Compute `m = current_utc_minute`.
2. Query due tenants: `WHERE check_minute = m AND status = active`.
3. For each tenant, enqueue one job per enabled provider.
4. Worker pulls job with idempotency key:
   - `tenant_id:provider:window_start:window_end`.
5. Worker fetches provider usage, writes `usage_events`, updates rollups.
6. Policy engine evaluates and emits alert signals.
7. Alert worker dispatches deduped notifications.

### D) API Surface (v1)

- `POST /api/providers/connect` - save encrypted provider credentials
- `GET /api/dashboard/summary?range=7d` - tenant spend totals and trend
- `GET /api/dashboard/breakdown?day=YYYY-MM-DD` - provider-level daily breakdown
- `GET /api/alerts` - recent incidents and delivery states
- `POST /api/policies` - create/update spend thresholds
- `POST /api/cron/check-spend` - scheduler entrypoint (auth token required)
- `POST /api/webhooks/gcp-budget` - push-mode billing events
- `POST /api/webhooks/stripe` - subscription lifecycle updates

### E) Reliability Rules

- At-least-once job delivery, idempotent DB writes
- Exponential backoff with jitter for transient failures
- DLQ for poison jobs + replay endpoint in admin plane
- Provider circuit breaker when error rate exceeds threshold
- Cooldown windows to prevent notification spam

### F) Security Model

- Encrypt provider keys at rest (envelope encryption)
- Decrypt only inside worker runtime
- Never return decrypted values to frontend/admin
- Enforce tenant isolation with RLS + service checks
- Sign internal job payloads and verify on consume
- Restrict cron and webhook endpoints with HMAC/shared secret validation

### G) Capacity Planning (Initial Targets)

- **Tenants:** 1k active tenants
- **Providers per tenant:** 2 avg
- **Jobs/minute:** ~33 per minute (2k jobs/hour distributed by `check_minute`)
- **Worker concurrency:** start with 5-10, autoscale by queue lag
- **SLOs:**
  - Freshness p95 < 10 min
  - Alert dispatch p95 < 60 sec from policy match
  - Delivery success > 99% with retries

### H) Deployment Topology

- **Frontend/API:** Vercel or containerized Next.js
- **Database/Auth:** Supabase (Postgres + RLS)
- **Queue:** managed queue (Upstash/QStash, SQS, or Redis-based queue)
- **Scheduler:** Vercel Cron or Cloud Scheduler hitting cron endpoint
- **Workers:** serverless jobs or small autoscaled containers
- **Secrets:** platform secret manager (not plaintext env sharing)

### I) Build Order (Strict)

1. Auth + tenant model + policies
2. Provider key connect flow with encryption
3. Minute cron + one provider adapter (OpenAI)
4. Rollups + dashboard summary endpoint
5. Discord alerts + cooldown + dedupe
6. Add Anthropic + GCP push webhook path
7. Add admin plane (`error_logs`, replay, health)

---

## Project Structure

```text
api-spend-guard/
├── app/
│   ├── (auth)/             # Auth, onboarding, and billing-related flows
│   ├── dashboard/          # Spend views, filters, and charts
│   ├── api/
│   │   ├── cron/           # Scheduler triggers (enqueue jobs only)
│   │   ├── webhooks/       # Billing/subscription and provider event handlers
│   │   ├── queue/          # Queue producers/consumers
│   │   └── providers/      # Provider adapter modules (OpenAI, Anthropic, etc.)
├── components/
│   ├── charts/             # Visualization components
│   └── forms/              # Secure settings and key input forms
├── lib/
│   ├── supabase/           # DB client, RLS rules, and data access helpers
│   ├── encryption.ts       # Key encryption/decryption utilities
│   ├── detection.ts        # Threshold/anomaly evaluation logic
│   └── alerting.ts         # Alert routing (Discord, Twilio)
├── workers/
│   ├── ingest-worker.ts    # Provider fetch + normalize pipeline
│   └── alert-worker.ts     # Notification dispatch + retries
├── prisma/                 # Optional ORM layer (if used)
└── public/                 # Static assets
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- Supabase project
- Provider keys with **read-only billing/usage scopes**
- Discord webhook URL (optional)
- Twilio account (optional for SMS)

### Installation

```bash
git clone https://github.com/DevLaiGer/api-spend-guard.git
cd api-spend-guard
npm install
cp .env.example .env.local
```

### Required Environment Variables

Define these in `.env.local` (names may differ in your implementation):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_MASTER_KEY`
- `CRON_AUTH_TOKEN`
- `TWILIO_ACCOUNT_SID` (optional)
- `TWILIO_AUTH_TOKEN` (optional)
- `TWILIO_FROM_NUMBER` (optional)

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Suggested MVP Roadmap

- **MVP v1:** OpenAI + Anthropic + Discord alerts
- **MVP v1.1:** SMS fallback alerts and better anomaly labeling
- **MVP v1.2:** Team workspaces, role-based access, alert history
- **MVP v2:** Provider auto-discovery and forecasted spend warnings

---

## SaaS Metrics to Track

For product validation, track:

- Time-to-first-alert
- Alert-to-action rate
- Monthly prevented overspend (self-reported + measured)
- Retention after first incident detected
- Expansion from single-provider to multi-provider usage

---

## Contributing

Contributions are welcome, especially new provider adapters and reliability improvements.

1. Fork the repo
2. Create a branch (`feature/provider-x`)
3. Add tests for adapter logic and alert edge cases
4. Open a PR with screenshots/log samples

---

## License

This project is licensed under **AGPLv3**. See `LICENSE` for details.

If you need to embed this in a proprietary product, contact the maintainers about commercial licensing options.