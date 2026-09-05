# Demo Script

## 1. Recovery and Circuit Breaker

Run the dashboard and open `http://localhost:3000`.

1. Run **Bank Outage Recovery** to generate a Card fallback.
2. Run **Circuit Breaker Burst** to trip HDFC after three failures.
3. Show the Production Safety Controls panel switching HDFC to `OPEN`.

## 2. Reconciliation

1. Run **Missed webhook** and show the order becoming `RECONCILED`.
2. Run **Amount mismatch** and show fulfillment held as `UNDERPAID`.
3. Run **Duplicate payment** and show `DUPLICATE_REFUND_PENDING` with one refund initiated.

## 3. Double-Charge and Audit Safety

1. Run **Double-Charge Guard** and show `HALT_ALREADY_PAID`.
2. Open an audit row and show the chained SHA-256 hash.
3. Use **Reset State** before repeating the demo.
