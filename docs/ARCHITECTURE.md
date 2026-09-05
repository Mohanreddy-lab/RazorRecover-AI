# RazorRecover AI Architecture

## Runtime Layout

```text
razorrecover-ai/
├── src/                     React operations dashboard
│   ├── App.tsx              Dashboard composition and API actions
│   ├── types.ts             Frontend state contracts
│   └── components/          Pipeline, scenarios, reconciliation, audit UI
├── server.ts                Express server and HTTP routes
├── server/                  Backend domain services
│   ├── deterministicRecovery.ts
│   ├── reconciliation.ts
│   ├── circuitBreaker.ts
│   ├── marginEngine.ts
│   ├── stateVerifier.ts
│   ├── immutableLink.ts
│   ├── auditLedger.ts
│   ├── store.ts
│   └── types.ts
├── python-export/           Standalone FastAPI webhook bundle
├── public/                  Static assets
├── docs/                    Architecture and demo documentation
└── package.json             Frontend/server scripts and dependencies
```

## Main Flows

1. `payment.failed` enters `server.ts`.
2. Signature, idempotency, terminal-state, and paid-order guards run first.
3. Bank failures use the circuit breaker and margin policy.
4. Deterministic rules choose a fallback link, retry, or halt.
5. Every action receives an immutable link and SHA-256 audit entry.
6. `/api/reconcile` handles missed webhooks, underpayments, and duplicates.

## Useful Routes

- `GET /health`
- `GET /api/state`
- `POST /webhook/payment.failed`
- `POST /api/simulate-scenario`
- `POST /api/reconcile`
- `POST /api/reset`
