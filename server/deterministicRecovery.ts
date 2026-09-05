import { RecoveryDecision, FailureReason, RecoveryAction, PaymentMethod, BankHealthInfo } from "./types.js";

export interface TriageInput {
  orderId: string;
  amount: number;
  bank?: string;
  errorCode?: string;
  errorDescription?: string;
  isPaid: boolean;
  bankHealth?: BankHealthInfo;
  customerName?: string;
  categoryMarginPercent?: number;
  maxAllowedDiscount?: number;
  paymentStatus?: string;
  amountPaidPaise?: number;
  amountDuePaise?: number;
  currency?: string;
  requestedCurrency?: string;
  isInternational?: boolean;
  mandateLimitPaise?: number;
}

export function diagnoseFailure(input: TriageInput): {
  decision: RecoveryDecision;
  rawRuleOutput: Record<string, unknown>;
  guardrailTriggered: boolean;
  aiModelUsed: string;
} {
  const {
    orderId, bank, errorCode, isPaid, bankHealth, maxAllowedDiscount = 5,
    paymentStatus, amount, amountPaidPaise = 0, amountDuePaise, currency = 'INR', requestedCurrency,
    isInternational = false, mandateLimitPaise
  } = input;
  if (isPaid) {
    return {
      decision: {
        order_id: orderId,
        failure_reason: 'ALREADY_PAID',
        action: 'HALT_ALREADY_PAID',
        discount_percent: 0,
        customer_message: `Your payment for order ${orderId} is already complete. No further action is needed.`,
        guardrail_applied: true,
        guardrail_notes: 'Order reconciliation halted recovery before rule evaluation.'
      },
      rawRuleOutput: { rule: 'already_paid' },
      guardrailTriggered: true,
      aiModelUsed: 'Deterministic-Rule-Engine'
    };
  }

  if (paymentStatus === 'pending' || paymentStatus === 'processing' || errorCode === 'PENDING_BANK_VERIFICATION' || errorCode === 'BANK_PROCESSING_DELAY') {
    return {
      decision: {
        order_id: orderId,
        failure_reason: 'GHOST_PROCESSING',
        action: 'HOLD_AND_POLL_VERIFY',
        discount_percent: 0,
        customer_message: 'Your bank is verifying this transaction. Do not initiate a new payment to avoid double charges.',
        guardrail_applied: true,
        guardrail_notes: 'Recovery links are blocked for 15 minutes while Razorpay status is polled.'
      },
      rawRuleOutput: { rule: 'ghost_processing', poll_window_minutes: 15 },
      guardrailTriggered: true,
      aiModelUsed: 'Deterministic-Settlement-Guard'
    };
  }

  if (errorCode === 'PARTIAL_PAYMENT_FAILED' || (amountDuePaise !== undefined && amountDuePaise > 0 && amountPaidPaise > 0 && amountDuePaise < amount)) {
    const remainingBalancePaise = amountDuePaise ?? Math.max(0, amount - amountPaidPaise);
    return {
      decision: {
        order_id: orderId,
        failure_reason: 'SPLIT_PAYMENT_FAILURE',
        action: 'GENERATE_PARTIAL_RECOVERY_LINK',
        discount_percent: 0,
        suggested_method: 'UPI',
        amount_paid_paise: amountPaidPaise,
        amount_due_paise: remainingBalancePaise,
        recovery_amount_paise: remainingBalancePaise,
        customer_message: `Your ₹${(amountPaidPaise / 100).toFixed(2)} wallet balance is protected. Complete the remaining ₹${(amountDuePaise / 100).toFixed(2)} securely.`,
        guardrail_notes: 'Recovery is limited to the unpaid balance; the wallet hold remains active for 15 minutes.'
      },
      rawRuleOutput: { rule: 'split_payment_failure', wallet_hold: 'ACTIVE' },
      guardrailTriggered: true,
      aiModelUsed: 'Deterministic-Split-Payment-Guard'
    };
  }

  if (errorCode === 'BAD_REQUEST_MANDATE_MAX_AMOUNT_EXCEEDED' || errorCode === 'MANDATE_LIMIT_EXCEEDED' || (mandateLimitPaise !== undefined && amount > mandateLimitPaise)) {
    return {
      decision: {
        order_id: orderId,
        failure_reason: 'MANDATE_MAX_AMOUNT_EXCEEDED',
        action: 'SPLIT_MANDATE_OR_UPGRADE_LINK',
        discount_percent: 0,
        suggested_method: 'NETBANKING',
        customer_message: `Your mandate limit is below this ₹${(amount / 100).toFixed(2)} invoice. Authorize a one-time top-up or upgrade your mandate securely with 2FA.`,
        guardrail_notes: 'Repeated mandate retries are suppressed because the configured single-transaction limit was exceeded.'
      },
      rawRuleOutput: { rule: 'mandate_max_amount_exceeded', retry_suppressed: true },
      guardrailTriggered: true,
      aiModelUsed: 'Deterministic-Mandate-Router'
    };
  }

  if (errorCode === 'BAD_REQUEST_INTERNATIONAL_CARDS_NOT_ALLOWED' || errorCode === 'INTERNATIONAL_CARD_BLOCKED' || isInternational || (currency !== 'INR' && requestedCurrency === 'INR')) {
    const currencyRoute = requestedCurrency || 'USD';
    const fxRate = currencyRoute === 'EUR' ? 0.92 : 0.011;
    return {
      decision: {
        order_id: orderId,
        failure_reason: 'INTERNATIONAL_CARD_BLOCK',
        action: 'DYNAMIC_CURRENCY_ROUTING',
        discount_percent: 0,
        suggested_method: 'CARD',
        currency_route: currencyRoute,
        fx_rate: fxRate,
        customer_message: `Your international card requires an alternate ${currencyRoute} checkout with 3DS verification. We will protect the exchange rate before authorization.`,
        guardrail_notes: 'International card route selected with FX rate protection and 3DS-compatible checkout.'
      },
      rawRuleOutput: { rule: 'international_card_block', currency_route: currencyRoute, fx_rate: fxRate },
      guardrailTriggered: true,
      aiModelUsed: 'Deterministic-Currency-Router'
    };
  }

  const isBankOutage = errorCode === 'GATEWAY_TIMEOUT' || errorCode === 'BANK_DOWN' || bankHealth?.status === 'DOWN' || bankHealth?.status === 'DEGRADED';
  const isInsufficientFunds = errorCode === 'BAD_REQUEST_INSUFFICIENT_FUNDS' || errorCode === 'INSUFFICIENT_FUNDS';
  const discount = isBankOutage ? Math.min(5, Math.max(0, maxAllowedDiscount)) : 0;
  const failureReason: FailureReason = isBankOutage ? 'BANK_DOWN' : isInsufficientFunds ? 'INSUFFICIENT_FUNDS' : 'USER_TIMEOUT';
  const action: RecoveryAction = isBankOutage ? 'GENERATE_FALLBACK_LINK' : isInsufficientFunds ? 'WAIT_RETRY' : 'GENERATE_FALLBACK_LINK';
  const suggestedMethod: PaymentMethod = isBankOutage ? 'CARD' : 'UPI';
  const customerMessage = isBankOutage
    ? `${bank || 'Bank'} UPI is experiencing latency. Continue securely via Card${discount ? ` with ${discount}% off` : ''}.`
    : isInsufficientFunds
      ? 'Your bank declined the payment due to balance or limit. Retry with another account or Card.'
      : `Your payment for ${orderId} was incomplete. Please retry securely.`;

  return {
    decision: {
      order_id: orderId,
      failure_reason: failureReason,
      action,
      discount_percent: discount,
      suggested_method: suggestedMethod,
      customer_message: customerMessage,
      guardrail_applied: isBankOutage && discount < 5,
      guardrail_notes: `Evaluated by deterministic rules with a ${maxAllowedDiscount}% margin ceiling.`
    },
    rawRuleOutput: { rule: isBankOutage ? 'bank_outage' : isInsufficientFunds ? 'insufficient_funds' : 'retry' },
    guardrailTriggered: isBankOutage && discount < 5,
    aiModelUsed: 'Deterministic-Rule-Engine'
  };
}