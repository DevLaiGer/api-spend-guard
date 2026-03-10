# Observability and SLOs

This document defines the MVP observability contract for API Spend Guard.

## SLO Targets

- Freshness p95: `< 10m` (time since last successful sync per tenant)
- Alert latency p95: `< 60s` (policy match to channel dispatch)
- Delivery success: `> 99%` with retries

## Core Metrics

- `queueLag` - number of jobs waiting in queue
- `dlqDepth` - dead-letter queue depth
- `openAlerts` - active unresolved alerts
- `failedDeliveries` - count of failed channel delivery attempts
- `failedRuns` - count of failed ingest runs

## Metrics Endpoint

- `GET /api/observability/metrics`

This endpoint provides a lightweight JSON summary suitable for dashboards and uptime checks.

## Operator Checks

- If `dlqDepth > 0`, replay from `/api/queue/dlq`.
- If `failedRuns` spikes by provider, inspect `error_logs`.
- If `failedDeliveries` rises, validate Discord/Twilio credentials and cooldown policy.
