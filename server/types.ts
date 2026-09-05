export type BankCode = 'HDFC' | 'SBI' | 'ICICI' | 'AXIS' | 'KOTAK';

export type BankStatus = 'OPERATIONAL' | 'DEGRADED' | 'DOWN';

export interface BankHealthInfo {
  code: BankCode;
  name: string;
  status: BankStatus;
  latencyMs: number;
  successRate: number; // percentage, e.g. 98.4% or 23.1%
  lastUpdated: string;
  notes?: string;
}

export type FailureReason = 
  | 'BANK_DOWN'
  | 'USER_TIMEOUT'
  | 'INSUFFICIENT_FUNDS'
  | 'ALREADY_PAID'
  | 'GHOST_PROCESSING'
  | 'SPLIT_PAYMENT_FAILURE'
  | 'MANDATE_MAX_AMOUNT_EXCEEDED'
  | 'INTERNATIONAL_CARD_BLOCK'
  | 'AUTH_FAILED'
  | 'CARD_EXPIRED'
  | 'NETWORK_DROP';

export type RecoveryAction = 
  | 'GENERATE_FALLBACK_LINK'
  | 'HOLD_AND_POLL_VERIFY'
  | 'GENERATE_PARTIAL_RECOVERY_LINK'
  | 'SPLIT_MANDATE_OR_UPGRADE_LINK'
  | 'DYNAMIC_CURRENCY_ROUTING'
  | 'WAIT_RETRY'
  | 'HALT_ALREADY_PAID';

export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET';

export interface RecoveryDecision {
  order_id: string;
  failure_reason: FailureReason;
  action: RecoveryAction;
  discount_percent: number; // Hard guardrail: [0.0, 10.0]
  suggested_method?: PaymentMethod;
  customer_message: string;
  guardrail_applied?: boolean;
  guardrail_notes?: string;
  recovery_amount_paise?: number;
  amount_paid_paise?: number;
  amount_due_paise?: number;
  currency_route?: string;
  fx_rate?: number;
}

export interface RazorpayOrder {
  id: string;
  amount: number; // in paise, e.g. 500000 = ₹5,000.00
  currency: string;
  status: 'created' | 'attempted' | 'paid' | 'expired' | 'VERIFICATION_PENDING';
  amountPaidPaise?: number;
  amountDuePaise?: number;
  isInternational?: boolean;
  mandateLimitPaise?: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  itemsDescription: string;
  createdAt: string;
  paidAt?: string;
  originalMethod?: string;
  activeRecoverySessionId?: string;
}

export interface RecoverySession {
  sessionId: string;
  orderId: string;
  token: string;
  status: 'ACTIVE' | 'EXPIRED' | 'COMPLETED' | 'INVALIDATED_ALREADY_PAID';
  recoveryUrl: string;
  discountPercent: number;
  originalAmount: number;
  discountedAmount: number;
  suggestedMethod: PaymentMethod;
  whatsappMessage: string;
  createdAt: string;
  expiresAt: string;
  paymentAttemptedAt?: string;
}

export interface WebhookAuditLog {
  id: string;
  timestamp: string;
  eventId?: string;
  orderId: string;
  paymentId?: string;
  bank?: string;
  errorCode?: string;
  errorDescription?: string;
  signatureVerified: boolean;
  isDuplicateEvent: boolean;
  orderStatusBefore: string;
  failureReason: FailureReason;
  actionTaken: RecoveryAction;
  discountPercent: number;
  guardrailClamped: boolean;
  customerMessage: string;
  recoveryUrl?: string;
  aiModel: string;
  processingTimeMs: number;
  status: 'PROCESSED' | 'HALTED' | 'DUPLICATE_IGNORED' | 'ERROR';
  circuitBreakerOpen?: boolean;
  maxAllowedDiscount?: number;
  terminalState?: string;
  auditHash?: string;
}
