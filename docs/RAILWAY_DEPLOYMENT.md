# Railway Deployment

## 1. Create the service

1. Push this repository to GitHub.
2. In Railway, choose **New Project** -> **Deploy from GitHub repo**.
3. Select this repository. Railway will use `railway.json`.
4. Add a Railway Volume and mount it at `/data`.

The volume is required because the application stores SQLite state at `/data/razorrecover.db`.

## 2. Add variables

In the Railway service Variables tab, add the values from `.env.example`:

```text
NODE_ENV=production
DATABASE_PATH=/data/razorrecover.db
APP_URL=https://YOUR-RAILWAY-DOMAIN
RAZORPAY_KEY_ID=rzp_test_or_live_key
RAZORPAY_KEY_SECRET=your_server_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
AUTH_REQUIRED=true
AUTH_SESSION_SECRET=a-long-random-secret
AUTH_ADMIN_EMAIL=admin@example.com
AUTH_ADMIN_PASSWORD=a-long-admin-password
AUTH_MERCHANT_EMAIL=merchant@example.com
AUTH_MERCHANT_PASSWORD=a-long-merchant-password
```

Use Railway's generated domain first. Add a custom domain later and update `APP_URL`.

## 3. Generate a domain

Open the service's **Settings** -> **Networking** -> **Generate Domain**. Railway terminates HTTPS and forwards the request to the Node process. The app listens on Railway's `PORT` automatically.

## 4. Configure Razorpay

In Razorpay Dashboard, open **Settings** -> **Webhooks** and create:

```text
https://YOUR-RAILWAY-DOMAIN/webhook/payment.failed
```

Subscribe to `payment.failed` and set the webhook secret to the exact value of `RAZORPAY_WEBHOOK_SECRET`. Test the webhook after deployment. The production server rejects unsigned or incorrectly signed requests.

Use matching environments: `rzp_test_` with Test Mode and `rzp_live_` with Live Mode.

## 5. Verify deployment

Open:

```text
https://YOUR-RAILWAY-DOMAIN/api/health
https://YOUR-RAILWAY-DOMAIN/checkout
```

Use the configured admin credentials for `/admin` and merchant credentials for `/merchant`.

## Important limitation

This deployment is single-instance because SQLite is stored on one Railway Volume. Move the persistence layer to PostgreSQL before scaling the service horizontally. Bank-account balance, WhatsApp, FX, wallet/refund, and mandate integrations still require their respective provider accounts and adapter implementations.
