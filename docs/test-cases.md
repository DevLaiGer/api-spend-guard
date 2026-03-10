# Test Cases: Happy Paths and Edge Cases

Unit tests for detection, idempotency, queue, DLQ, encryption, and alerting live in `tests/*.test.ts` and are run with `npm test`. API and integration cases below are specified for manual or future e2e coverage.

## 1. Policy detection (`lib/detection.ts`)

| ID | Scenario | Input | Expected |
|----|----------|--------|----------|
| D1 | **Happy:** No breach | spendToday=10, limit=100, baseline=5, burst=0 | `[]` |
| D2 | **Happy:** Daily limit breached | spendToday=150, limit=100 | One signal `DAILY_LIMIT`, severity high |
| D3 | **Happy:** Velocity spike | spendToday=200, baseline=100, spikePct=150 | One signal `VELOCITY_SPIKE`, +100% |
| D4 | **Happy:** Burst only | burstSpend=60, dailyLimit=100 | One signal `BURST` |
| D5 | **Happy:** Multiple signals | spendToday=200, limit=100, baseline=50, burst=60 | Up to 3 signals |
| D6 | **Edge:** Zero baseline (no velocity) | baseline=0, spendToday=100 | No velocity signal |
| D7 | **Edge:** Exactly at limit | spendToday=100, limit=100 | One `DAILY_LIMIT` |
| D8 | **Edge:** Just below spike threshold | spendToday=149, baseline=100, spikePct=50 | No velocity signal |
| D9 | **Edge:** Burst below 50% of limit | burstSpend=40, dailyLimit=100 | No burst signal |
| D10 | **Edge:** Zero/negative policy values | dailyLimit=0, spikePct=0 | Behavior defined (no divide-by-zero) |

---

## 2. Idempotency key (`lib/queue/idempotency.ts`)

| ID | Scenario | Input | Expected |
|----|----------|--------|----------|
| I1 | **Happy:** Same input → same key | (tenantId, provider, wStart, wEnd) twice | Identical 64-char hex |
| I2 | **Edge:** Different window → different key | Same tenant/provider, different times | Different keys |
| I3 | **Edge:** Different tenant → different key | Same provider/window, different tenantId | Different keys |

---

## 3. In-memory queue (`lib/queue/in-memory-queue.ts`)

| ID | Scenario | Expected |
|----|----------|----------|
| Q1 | **Happy:** Enqueue then dequeue | Job returned with `id`, same payload |
| Q2 | **Happy:** Empty dequeue | `undefined` |
| Q3 | **Happy:** `visibleAt` in future | dequeue returns nothing until time passes |
| Q4 | **Happy:** queueDepth | Increases on enqueue, decreases on dequeue |
| Q5 | **Edge:** dequeue with type filter | Only job of that type returned |
| Q6 | **Edge:** Multiple enqueues, FIFO order | Dequeue order matches enqueue |

---

## 4. Dead-letter queue (`lib/queue/dlq.ts`)

| ID | Scenario | Expected |
|----|----------|----------|
| DLQ1 | **Happy:** push then list | Job appears in listDlq() |
| DLQ2 | **Happy:** pop by id | Job removed and returned |
| DLQ3 | **Edge:** pop unknown id | `null` |
| DLQ4 | **Edge:** pop same id twice | First returns job, second returns null |

---

## 5. Encryption (`lib/encryption.ts`)

| ID | Scenario | Expected |
|----|----------|----------|
| E1 | **Happy:** Round-trip | decrypt(encrypt(plain)) === plain |
| E2 | **Happy:** Different plaintexts → different ciphertexts | No reuse of ciphertext |
| E3 | **Edge:** Empty string | Round-trip succeeds |
| E4 | **Edge:** Long string (e.g. 10k chars) | Round-trip succeeds |
| E5 | **Edge:** Missing ENCRYPTION_SECRET | encrypt/decrypt throws |
| E6 | **Edge:** Tampered ciphertext | decrypt throws |
| E7 | **Edge:** Wrong key (different secret) | decrypt throws |

---

## 6. Alerting (`lib/alerting.ts`)

| ID | Scenario | Expected |
|----|----------|----------|
| A1 | **Happy:** Discord with valid URL | fetch called, returns { ok: true } when 2xx |
| A2 | **Edge:** Discord empty webhook | { ok: false, error: "missing_discord_webhook" } |
| A3 | **Edge:** SMS, Twilio not configured | { ok: false, error: "twilio_not_configured" } |
| A4 | **Edge:** SMS, empty destination | { ok: false, error: "missing_destination" } |

---

## 7. API: POST /api/cron/check-spend

| ID | Scenario | Expected |
|----|----------|----------|
| C1 | **Happy:** Valid x-cron-token | 200, { enqueued, minute, tenants } |
| C2 | **Edge:** Missing token | 401 |
| C3 | **Edge:** Wrong token | 401 |
| C4 | **Edge:** Empty CRON_AUTH_TOKEN in env | 401 |

---

## 8. API: POST /api/providers/connect

| ID | Scenario | Expected |
|----|----------|----------|
| P1 | **Happy:** tenantId + provider + apiKey | 200, { status: "connected" } |
| P2 | **Edge:** Missing tenantId | 400, error message |
| P3 | **Edge:** Missing provider | 400 |
| P4 | **Edge:** Missing apiKey | 400 |
| P5 | **Edge:** Invalid JSON body | 500 or 400 |

---

## 9. API: POST /api/policies

| ID | Scenario | Expected |
|----|----------|----------|
| POL1 | **Happy:** Valid tenantId + limits | 200, { status: "saved" } |
| POL2 | **Edge:** Missing tenantId | 400 |

---

## 10. API: GET /api/dashboard/summary

| ID | Scenario | Expected |
|----|----------|----------|
| S1 | **Happy:** tenantId + range | 200, { summary } |
| S2 | **Edge:** Missing tenantId | 400 |

---

## 11. API: GET /api/dashboard/breakdown

| ID | Scenario | Expected |
|----|----------|----------|
| B1 | **Happy:** tenantId + day | 200, { breakdown } |
| B2 | **Edge:** Missing tenantId | 400 |
| B3 | **Edge:** Missing day | 400 |

---

## 12. API: GET /api/alerts

| ID | Scenario | Expected |
|----|----------|----------|
| AL1 | **Happy:** tenantId | 200, { alerts } |
| AL2 | **Edge:** Missing tenantId | 400 |

---

## 13. API: POST /api/webhooks/gcp-budget

| ID | Scenario | Expected |
|----|----------|----------|
| G1 | **Happy:** tenantId + amountUsd (optional eventId) | 200, { status: "accepted" } |
| G2 | **Edge:** Missing tenantId | 400 |
| G3 | **Edge:** amountUsd omitted | Treated as 0, 200 |

---

## 14. API: POST /api/queue/dlq

| ID | Scenario | Expected |
|----|----------|----------|
| R1 | **Happy:** jobId present, job in DLQ | 200, { status: "requeued", jobId } |
| R2 | **Edge:** Missing jobId | 400 |
| R3 | **Edge:** jobId not in DLQ | 404 |

---

## 15. API: POST /api/queue/consume

| ID | Scenario | Expected |
|----|----------|----------|
| M1 | **Happy:** Job available, process succeeds | 200, { status: "ok", jobId, type } |
| M2 | **Happy:** No job | 200, { status: "idle" } |
| M3 | **Edge:** Job throws, retries < max | 500, { status: "retry", retries } |
| M4 | **Edge:** Job throws, retries >= max | 500, { status: "dlq", jobId } |

---

## 16. API: GET /api/observability/metrics

| ID | Scenario | Expected |
|----|----------|----------|
| O1 | **Happy:** No DB errors | 200, { queueLag, dlqDepth, openAlerts, ... } |
| O2 | **Edge:** DB unreachable | 500, error message |
