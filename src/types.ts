export type BankCode = 'HDFC' | 'SBI' | 'ICICI' | 'AXIS' | 'KOTAK';

export interface BankHealthInfo {
  code: BankCode;
  name: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  successRate: number;
  lastUpdated: string;
  notes?: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number; // paise
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
  suggestedMethod: 'UPI' | 'CARD' | 'NETBANKING';
  whatsappMessage: string;
  createdAt: string;
  expiresAt: string;
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
  failureReason: string;
  actionTaken: RecoveryAction;
  discountPercent: number;
  guardrailClamped: boolean;
  customerMessage: string;
  recoveryUrl?: string;
  aiModel: string;
  processingTimeMs: number;
  status: 'PROCESSED' | 'HALTED' | 'DUPLICATE_IGNORED' | 'ERROR';
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

export interface PaymentWebhookEntity {
  id?: string;
  order_id?: string;
  status?: string;
  bank?: string;
  error_code?: string;
  error_description?: string;
  amount?: number;
  amount_paid?: number;
  amount_due?: number;
  is_international?: boolean;
  currency?: string;
  requested_currency?: string;
  mandate_limit?: number;
}

export interface PaymentFailedWebhookPayload {
  event?: string;
  event_id?: string;
  payload?: { payment?: { entity?: PaymentWebhookEntity } };
  payment?: { entity?: PaymentWebhookEntity };
}

export interface RazorpayConfig {
  enabled: boolean;
  keyId?: string;
  mode: 'test' | 'live' | 'unconfigured';
}

export interface SecurityStatus {
  webhookSignatureConfigured: boolean;
  razorpayServerConfigured: boolean;
  idempotencyGuard: 'ACTIVE' | 'UNAVAILABLE';
  auditChain: 'ACTIVE' | 'EMPTY';
  liveStream: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  activeLiveSubscribers: number;
  lastCheckedAt: string;
}

export interface SystemMetrics {
  totalWebhooks: number;
  failuresDiagnosed: number;
  doubleChargesPrevented: number;
  guardrailsEnforced: number;
  outagesMitigated: number;
  recoveredRevenuePaise: number;
  originalLostRevenuePaise: number;
  recoveredRevenueFormatted: string;
  originalLostRevenueFormatted: string;
}

export interface EngineState {
  orders: RazorpayOrder[];
  bankHealth: BankHealthInfo[];
  auditLogs: WebhookAuditLog[];
  activeSessions: RecoverySession[];
  metrics: SystemMetrics;
  deterministicEngine: boolean;
  circuitBreakers: CircuitBreakerState[];
  auditLedger: AuditLedgerEntry[];
  reconciliation: ReconciliationState;
}

export interface CircuitBreakerState {
  bank: string;
  isOpen: boolean;
  failureCount: number;
  opensAt?: string;
  openUntil?: string;
}

export interface AuditLedgerEntry {
  timestamp: string;
  orderId: string;
  action: string;
  discountGranted: number;
  reasoning: string;
  previousHash: string;
  hash: string;
}

export type ReconciliationScenario = 'missed_webhook' | 'amount_mismatch' | 'duplicate_payment';
export type ReconciliationStatus = 'RECONCILED' | 'UNDERPAID' | 'DUPLICATE_REFUND_PENDING' | 'NO_PAYMENT' | 'ORPHAN_PAYMENT';

export interface ReconciliationRecord {
  id: string;
  orderId: string;
  paymentIds: string[];
  expectedAmountPaise: number;
  receivedAmountPaise: number;
  differencePaise: number;
  status: ReconciliationStatus;
  action: string;
  merchantNotification: string;
  processedAt: string;
}

export interface ReconciliationRun {
  runId: string;
  scenario: ReconciliationScenario;
  startedAt: string;
  durationMs: number;
  records: ReconciliationRecord[];
  summary: { reconciled: number; mismatches: number; duplicatesRefunded: number; orphanPayments: number };
}

export interface ReconciliationState {
  orders: Array<{ orderId: string; expectedAmountPaise: number; status: string; customerName: string }>;
  payments: Array<{ paymentId: string; orderId: string; amountPaise: number; status: string; capturedAt: string }>;
  runs: ReconciliationRun[];
}

export type LiveEventStatus = 'active' | 'passed' | 'blocked' | 'complete';
export interface LivePaymentEvent {
  id: string;
  timestamp: string;
  orderId: string;
  stage: string;
  title: string;
  detail: string;
  status: LiveEventStatus;
  metadata?: Record<string, unknown>;
}
