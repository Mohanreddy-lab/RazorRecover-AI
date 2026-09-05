# Production Deployment

## Runtime

The root app is a single Node/Express process serving the built React client and API. It now persists recovery state to SQLite. For a single-instance deployment, mount a persistent volume at `/data` and set `DATABASE_PATH=/data/razorrecover.db`.

Build and run:

```bash
npm ci
npm run build
NODE_ENV=production DATABASE_PATH=/data/razorrecover.db node dist/server.cjs
```

The included `Dockerfile` uses Node 22 and exposes port `3000`.

## Required secrets

Copy `.env.example` into the deployment secret manager. Production startup refuses to run without:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `APP_URL`
- `DATABASE_PATH`
- `AUTH_SESSION_SECRET`
- `AUTH_ADMIN_EMAIL` and `AUTH_ADMIN_PASSWORD`
- `AUTH_MERCHANT_EMAIL` and `AUTH_MERCHANT_PASSWORD`

Never commit `.env` or put a secret in a Vite environment variable.

## Razorpay webhook

In Razorpay Dashboard, create a webhook with URL:

```text
https://YOUR_DOMAIN/webhook/payment.failed
```

Use the exact value of `RAZORPAY_WEBHOOK_SECRET`. Subscribe to `payment.failed` and keep the webhook URL on HTTPS. Production rejects requests with a missing or invalid `x-razorpay-signature`.

Configure the checkout key and secret from the same Razorpay account and environment. Do not mix `rzp_test_` and `rzp_live_` credentials.

## Provider adapters

The current deterministic engine is safe to deploy with provider adapters disabled. Set these only after implementing and testing the corresponding provider contract:

- `BANK_SETTLEMENT_PROVIDER` and `BANK_SETTLEMENT_API_URL` for settlement/status polling.
- `WHATSAPP_PROVIDER`, `WHATSAPP_API_URL`, and `WHATSAPP_API_TOKEN` for customer notifications.
- `FX_PROVIDER`, `FX_API_URL`, and `FX_API_KEY` for live exchange rates.
- `MANDATE_PROVIDER`, `MANDATE_API_URL`, and `MANDATE_API_KEY` for mandate changes.

Razorpay does not expose a merchant's bank-account balance through Checkout. The engine verifies payment settlement state and captured/outstanding amounts; a bank balance integration requires a separate bank or account-information provider.

## TLS and operations

Terminate TLS at the platform load balancer or reverse proxy, forward traffic to port `3000`, and configure health checks against `/api/health`. Restrict CORS to the deployed origin before going live. Back up the SQLite volume, or move the store to PostgreSQL before running multiple application replicas.

## Auth and access control

Production uses signed, HTTP-only eight-hour sessions. The admin account can use scenarios, bank controls, reset, reconciliation, and audit access. The merchant account can use the merchant dashboard and reconciliation. Customer checkout and Razorpay webhooks remain public because customers and Razorpay must reach them without an operator session.

Set the auth values from a deployment secret manager. Do not use the sample passwords or expose them in source control. For larger organizations, replace this built-in layer with an OIDC provider and keep the same role boundary at the API.
