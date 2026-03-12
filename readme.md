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
- **Threshold-based alerts:** Discord, Telegram, and SMS notifications when spend spikes
- **Read-only by design:** No proxying production traffic; no latency impact
- **Encrypted credentials:** API keys encrypted at rest with server-side controls
- **Dual onboarding modes:** no-auth free mode (single key) and OAuth mode (multi-key with paid tier)

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
- **Free + Pro tiers:** Free supports 1 key + Discord/Telegram, Pro unlocks 5 keys and SMS

---

## Documentation

- System design and architecture: `docs/system-design.md`
- Developer setup and environment isolation: `docs/developer-setup.md`
- **Cursor + Figma (MCP):** Project includes `.cursor/mcp.json` for the [Framelink MCP for Figma](https://www.npmjs.com/package/figma-developer-mcp). Add a Figma personal access token in Cursor **Settings → MCP** (env `FIGMA_API_KEY`) to get design-to-code context from Figma links in chat.
- Repository maintenance and contribution policy: `docs/repository-maintenance.md`
- SLOs and observability: `docs/observability.md`
- Test cases (happy paths and edge): `docs/test-cases.md`
- Contributor guide: `CONTRIBUTING.md`

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

## Getting Started

See `docs/developer-setup.md` for local setup, environment variables, and COSS dev/prod isolation rules.

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