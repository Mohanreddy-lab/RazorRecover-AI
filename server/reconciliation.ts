export type ReconciliationStatus = 'RECONCILED' | 'UNDERPAID' | 'DUPLICATE_REFUND_PENDING' | 'NO_PAYMENT' | 'ORPHAN_PAYMENT';
export type ReconciliationScenario = 'missed_webhook' | 'amount_mismatch' | 'duplicate_payment';

export interface MerchantOrderRecord {
  orderId: string;
  expectedAmountPaise: number;
  status: 'pending' | 'paid' | 'needs_review';
  customerName: string;
}

export interface RazorpayPaymentRecord {
  paymentId: string;
  orderId: string;
  amountPaise: number;
  status: 'captured' | 'failed' | 'refunded';
  capturedAt: string;
}

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
  summary: {
    reconciled: number;
    mismatches: number;
    duplicatesRefunded: number;
    orphanPayments: number;
  };
}

export class AutoReconcileAgent {
  private orders: MerchantOrderRecord[] = [];
  private payments: RazorpayPaymentRecord[] = [];
  private runs: ReconciliationRun[] = [];

  constructor() {
    this.seed();
  }

  seed(): void {
    this.orders = [
      { orderId: 'ord_reconcile_missed_001', expectedAmountPaise: 500000, status: 'pending', customerName: 'Aarav Sharma' },
      { orderId: 'ord_reconcile_mismatch_002', expectedAmountPaise: 500000, status: 'pending', customerName: 'Priya Patel' },
      { orderId: 'ord_reconcile_duplicate_003', expectedAmountPaise: 500000, status: 'pending', customerName: 'Neha Deshmukh' }
    ];
    this.payments = [];
    this.runs = [];
  }

  run(scenario: ReconciliationScenario): ReconciliationRun {
    const startedAt = new Date().toISOString();
    const start = Date.now();
    const now = new Date().toISOString();
    const order = this.orders.find((item) => item.orderId.endsWith({
      missed_webhook: 'missed_001',
      amount_mismatch: 'mismatch_002',
      duplicate_payment: 'duplicate_003'
    }[scenario]));

    if (!order) throw new Error(`No reconciliation fixture for scenario ${scenario}`);
    this.payments = this.payments.filter((payment) => payment.orderId !== order.orderId);
    this.orders = this.orders.map((item) => item.orderId === order.orderId ? { ...item, status: 'pending' } : item);

    if (scenario === 'missed_webhook') {
      this.payments.push({ paymentId: 'pay_reconcile_success_001', orderId: order.orderId, amountPaise: order.expectedAmountPaise, status: 'captured', capturedAt: now });
    }
    if (scenario === 'amount_mismatch') {
      this.payments.push({ paymentId: 'pay_reconcile_underpaid_002', orderId: order.orderId, amountPaise: 50000, status: 'captured', capturedAt: now });
    }
    if (scenario === 'duplicate_payment') {
      this.payments.push(
        { paymentId: 'pay_reconcile_first_003', orderId: order.orderId, amountPaise: order.expectedAmountPaise, status: 'captured', capturedAt: now },
        { paymentId: 'pay_reconcile_second_003', orderId: order.orderId, amountPaise: order.expectedAmountPaise, status: 'captured', capturedAt: now }
      );
    }

    const payments = this.payments.filter((payment) => payment.orderId === order.orderId && payment.status === 'captured');
    const receivedAmountPaise = payments.reduce((sum, payment) => sum + payment.amountPaise, 0);
    let status: ReconciliationStatus;
    let action: string;
    let merchantNotification: string;

    if (payments.length === 0) {
      status = 'NO_PAYMENT';
      action = 'HOLD_ORDER';
      merchantNotification = `No captured payment found for ${order.orderId}. Fulfillment remains on hold.`;
      order.status = 'needs_review';
    } else if (payments.length > 1) {
      status = 'DUPLICATE_REFUND_PENDING';
      action = `AUTO_REFUND ${payments.slice(1).map((payment) => payment.paymentId).join(', ')}`;
      payments.slice(1).forEach((payment) => { payment.status = 'refunded'; });
      merchantNotification = `${payments.length - 1} duplicate payment detected for ${order.orderId}. Refund initiated for the extra capture.`;
      order.status = 'paid';
    } else if (receivedAmountPaise !== order.expectedAmountPaise) {
      status = 'UNDERPAID';
      action = 'HOLD_FULFILLMENT';
      merchantNotification = `${order.orderId} underpaid by ₹${((order.expectedAmountPaise - receivedAmountPaise) / 100).toFixed(2)}. Manual review required.`;
      order.status = 'needs_review';
    } else {
      status = 'RECONCILED';
      action = 'MARK_ORDER_PAID';
      merchantNotification = `${order.orderId} auto-reconciled. Payment matched and order marked PAID.`;
      order.status = 'paid';
    }

    const record: ReconciliationRecord = {
      id: `recon_${Date.now()}`,
      orderId: order.orderId,
      paymentIds: payments.map((payment) => payment.paymentId),
      expectedAmountPaise: order.expectedAmountPaise,
      receivedAmountPaise,
      differencePaise: order.expectedAmountPaise - receivedAmountPaise,
      status,
      action,
      merchantNotification,
      processedAt: new Date().toISOString()
    };
    const run: ReconciliationRun = {
      runId: `run_${Date.now()}`,
      scenario,
      startedAt,
      durationMs: Date.now() - start,
      records: [record],
      summary: {
        reconciled: status === 'RECONCILED' ? 1 : 0,
        mismatches: status === 'UNDERPAID' ? 1 : 0,
        duplicatesRefunded: status === 'DUPLICATE_REFUND_PENDING' ? payments.length - 1 : 0,
        orphanPayments: 0
      }
    };
    this.runs.unshift(run);
    return run;
  }

  getState(): { orders: MerchantOrderRecord[]; payments: RazorpayPaymentRecord[]; runs: ReconciliationRun[] } {
    return { orders: this.orders, payments: this.payments, runs: this.runs.slice(0, 20) };
  }
}

export const autoReconcileAgent = new AutoReconcileAgent();
