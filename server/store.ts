import crypto from "crypto";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { RazorpayOrder, RecoverySession, WebhookAuditLog, BankHealthInfo, BankCode } from "./types.js";
import { generateImmutableRecoveryLink } from "./immutableLink.js";

class RecoveryStore {
  public orders: Map<string, RazorpayOrder> = new Map();
  public recoverySessions: Map<string, RecoverySession> = new Map();
  public processedEventIds: Set<string> = new Set();
  public auditLogs: WebhookAuditLog[] = [];
  public bankHealth: Map<BankCode, BankHealthInfo> = new Map();
  private readonly database: Database.Database;

  // Metrics
  public metrics = {
    totalWebhooks: 0,
    failuresDiagnosed: 0,
    doubleChargesPrevented: 0,
    guardrailsEnforced: 0,
    outagesMitigated: 0,
    recoveredRevenuePaise: 0,
    originalLostRevenuePaise: 0,
  };

  constructor() {
    const databasePath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/razorrecover.db');
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.database = new Database(databasePath);
    this.database.pragma('journal_mode = WAL');
    this.database.exec('CREATE TABLE IF NOT EXISTS recovery_state (id INTEGER PRIMARY KEY CHECK (id = 1), snapshot TEXT NOT NULL, updated_at TEXT NOT NULL)');
    if (!this.loadSnapshot()) {
      this.seedInitialData();
      this.persist();
    }
  }

  private persist(): void {
    const snapshot = JSON.stringify({
      orders: Array.from(this.orders.entries()),
      recoverySessions: Array.from(this.recoverySessions.entries()),
      processedEventIds: Array.from(this.processedEventIds),
      auditLogs: this.auditLogs,
      bankHealth: Array.from(this.bankHealth.entries()),
      metrics: this.metrics
    });
    this.database.prepare('INSERT INTO recovery_state (id, snapshot, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET snapshot = excluded.snapshot, updated_at = excluded.updated_at')
      .run(snapshot, new Date().toISOString());
  }

  private loadSnapshot(): boolean {
    const row = this.database.prepare('SELECT snapshot FROM recovery_state WHERE id = 1').get() as { snapshot?: string } | undefined;
    if (!row?.snapshot) return false;
    try {
      const snapshot = JSON.parse(row.snapshot) as {
        orders: [string, RazorpayOrder][];
        recoverySessions: [string, RecoverySession][];
        processedEventIds: string[];
        auditLogs: WebhookAuditLog[];
        bankHealth: [BankCode, BankHealthInfo][];
        metrics: typeof this.metrics;
      };
      this.orders = new Map(snapshot.orders || []);
      this.recoverySessions = new Map(snapshot.recoverySessions || []);
      this.processedEventIds = new Set(snapshot.processedEventIds || []);
      this.auditLogs = snapshot.auditLogs || [];
      this.bankHealth = new Map(snapshot.bankHealth || []);
      this.metrics = { ...this.metrics, ...(snapshot.metrics || {}) };
      return this.orders.size > 0 && this.bankHealth.size > 0;
    } catch {
      return false;
    }
  }

  public seedInitialData() {
    this.orders.clear();
    this.recoverySessions.clear();
    this.processedEventIds.clear();
    this.auditLogs = [];

    // 1. Pre-seed Bank Health Matrix (HDFC degraded to showcase the hero outage scenario)
    this.bankHealth.set('HDFC', {
      code: 'HDFC',
      name: 'HDFC Bank (UPI Switch)',
      status: 'DEGRADED',
      latencyMs: 8450,
      successRate: 34.2,
      lastUpdated: new Date().toISOString(),
      notes: 'NPCI alert: High latency on HDFC UPI gateway switch. Timeouts observed.'
    });

    this.bankHealth.set('SBI', {
      code: 'SBI',
      name: 'State Bank of India',
      status: 'OPERATIONAL',
      latencyMs: 320,
      successRate: 98.6,
      lastUpdated: new Date().toISOString(),
    });

    this.bankHealth.set('ICICI', {
      code: 'ICICI',
      name: 'ICICI Bank',
      status: 'OPERATIONAL',
      latencyMs: 280,
      successRate: 99.2,
      lastUpdated: new Date().toISOString(),
    });

    this.bankHealth.set('AXIS', {
      code: 'AXIS',
      name: 'Axis Bank',
      status: 'OPERATIONAL',
      latencyMs: 310,
      successRate: 97.9,
      lastUpdated: new Date().toISOString(),
    });

    this.bankHealth.set('KOTAK', {
      code: 'KOTAK',
      name: 'Kotak Mahindra Bank',
      status: 'OPERATIONAL',
      latencyMs: 290,
      successRate: 98.9,
      lastUpdated: new Date().toISOString(),
    });

    // 2. Pre-seed Orders

    // Order A: The Double-Charge Protection Test Order (Already paid in DB/Razorpay)
    this.orders.set('ord_already_paid_999', {
      id: 'ord_already_paid_999',
      amount: 499900, // ₹4,999.00
      currency: 'INR',
      status: 'paid',
      customerName: 'Aarav Sharma',
      customerPhone: '+91 98765 43210',
      customerEmail: 'aarav.sharma@example.com',
      itemsDescription: 'Noise-Cancelling Wireless Headphones (Black)',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      paidAt: new Date(Date.now() - 1800000).toISOString(),
      originalMethod: 'UPI'
    });

    this.orders.set('ord_completed_123', {
      id: 'ord_completed_123',
      amount: 320000, // ₹3,200.00
      currency: 'INR',
      status: 'paid',
      customerName: 'Priya Patel',
      customerPhone: '+91 98234 56789',
      customerEmail: 'priya.patel@example.com',
      itemsDescription: 'Ergonomic Standing Desk Mat',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      paidAt: new Date(Date.now() - 3600000).toISOString(),
      originalMethod: 'CARD'
    });

    // Order B: Active pending order for Bank Outage Demo (HDFC UPI Timeout)
    this.orders.set('ord_outage_1001', {
      id: 'ord_outage_1001',
      amount: 749900, // ₹7,499.00
      currency: 'INR',
      status: 'attempted',
      customerName: 'Rohan Verma',
      customerPhone: '+91 91234 56780',
      customerEmail: 'rohan.verma@example.com',
      itemsDescription: 'Ultra-Wide Mechanical Keyboard & Wrist Rest',
      createdAt: new Date().toISOString(),
    });

    // Order C: Active pending order for Two-Tab Idempotency Test
    this.orders.set('ord_twotab_5002', {
      id: 'ord_twotab_5002',
      amount: 599000, // ₹5,990.00
      currency: 'INR',
      status: 'attempted',
      customerName: 'Neha Deshmukh',
      customerPhone: '+91 97654 32109',
      customerEmail: 'neha.d@example.com',
      itemsDescription: 'Smart Fitness Tracker Gen 4',
      createdAt: new Date().toISOString(),
    });

    // Order D: Active pending order for Insufficient Funds Test
    this.orders.set('ord_balance_888', {
      id: 'ord_balance_888',
      amount: 1299900, // ₹12,999.00
      currency: 'INR',
      status: 'attempted',
      customerName: 'Vikram Mehta',
      customerPhone: '+91 99887 76655',
      customerEmail: 'vikram.m@example.com',
      itemsDescription: '4K IPS USB-C Monitor',
      createdAt: new Date().toISOString(),
    });

    // Order E: Guardrail Prompt Injection / Discount Exploit Test
    this.orders.set('ord_exploit_9999', {
      id: 'ord_exploit_9999',
      amount: 2500000, // ₹25,000.00
      currency: 'INR',
      status: 'attempted',
      customerName: 'Security Tester',
      customerPhone: '+91 90000 11111',
      customerEmail: 'audit@merchant.com',
      itemsDescription: 'Developer Pro Workstation Bundle',
      createdAt: new Date().toISOString(),
    });

    // Pre-seed metrics with realistic background stats
    this.metrics.totalWebhooks = 24;
    this.metrics.failuresDiagnosed = 19;
    this.metrics.doubleChargesPrevented = 5;
    this.metrics.guardrailsEnforced = 4;
    this.metrics.outagesMitigated = 14;
    this.metrics.recoveredRevenuePaise = 6845000; // ₹68,450
    this.metrics.originalLostRevenuePaise = 8799000; // ₹87,990
    this.persist();
  }

  // Check if an order is already paid in the database or Razorpay
  public getOrderStatus(orderId: string): { exists: boolean; status: string; isPaid: boolean; order?: RazorpayOrder } {
    const order = this.orders.get(orderId);
    if (!order) {
      // If unknown order, check prefix convention or default to not paid
      const isPaidByDefault = orderId.includes('already_paid') || orderId.includes('completed');
      return { exists: false, status: isPaidByDefault ? 'paid' : 'unknown', isPaid: isPaidByDefault };
    }
    return {
      exists: true,
      status: order.status,
      isPaid: order.status === 'paid',
      order
    };
  }

  // Create recovery session
  public createRecoverySession(
    orderId: string,
    discountPercent: number,
    suggestedMethod: any,
    whatsappMessage: string,
    recoveryAmountPaise?: number
  ): RecoverySession {
    const order = this.orders.get(orderId);
    const originalAmount = order ? order.amount : 500000;
    const discountMultiplier = (100 - discountPercent) / 100;
    const amountForRecovery = recoveryAmountPaise ?? originalAmount;
    const discountedAmount = Math.round(amountForRecovery * discountMultiplier);

    const sessionId = `rec_${crypto.randomBytes(6).toString('hex')}`;
    const token = crypto.randomBytes(12).toString('hex');
    const recoveryUrl = generateImmutableRecoveryLink(orderId, amountForRecovery, discountPercent);

    const session: RecoverySession = {
      sessionId,
      orderId,
      token,
      status: 'ACTIVE',
      recoveryUrl,
      discountPercent,
      originalAmount,
      discountedAmount,
      suggestedMethod,
      whatsappMessage,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins
    };

    this.recoverySessions.set(sessionId, session);

    if (order) {
      order.activeRecoverySessionId = sessionId;
    }

    this.persist();

    return session;
  }

  // Reconcile and pay an order (e.g. customer pays via recovery link or original link)
  public completeOrderPayment(orderId: string, paymentMethod: string, source: 'ORIGINAL_LINK' | 'RECOVERY_LINK') {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = 'paid';
      order.paidAt = new Date().toISOString();
      order.originalMethod = paymentMethod;

      // TWO-TAB IDEMPOTENCY MOMENT:
      // Invalidate any active recovery session for this order!
      if (order.activeRecoverySessionId) {
        const session = this.recoverySessions.get(order.activeRecoverySessionId);
        if (session) {
          session.status = 'INVALIDATED_ALREADY_PAID';
        }
      }
    }

    // Also look up any other recovery sessions matching this order and invalidate them
    for (const [_, session] of this.recoverySessions) {
      if (session.orderId === orderId && session.status === 'ACTIVE') {
        session.status = 'INVALIDATED_ALREADY_PAID';
      }
    }

    if (order) {
      this.metrics.recoveredRevenuePaise += order.amount;
    }
    this.persist();
  }

  public markVerificationPending(orderId: string): void {
    const order = this.orders.get(orderId);
    if (order && order.status !== 'paid') {
      order.status = 'VERIFICATION_PENDING';
    }
    this.persist();
  }

  public lockPartialPayment(orderId: string, amountPaidPaise: number, amountDuePaise: number): void {
    const order = this.orders.get(orderId);
    if (order && order.status !== 'paid') {
      order.amountPaidPaise = amountPaidPaise;
      order.amountDuePaise = amountDuePaise;
      order.status = 'attempted';
    }
    this.persist();
  }

  // Idempotency check: returns true if this event was already processed
  public checkAndMarkEventIdempotency(eventId: string): boolean {
    if (this.processedEventIds.has(eventId)) {
      return true; // Duplicate!
    }
    this.processedEventIds.add(eventId);
    this.persist();
    return false;
  }

  public addAuditLog(log: WebhookAuditLog) {
    this.auditLogs.unshift(log);
    // Keep last 100 logs
    if (this.auditLogs.length > 100) {
      this.auditLogs.pop();
    }
    this.persist();
  }

  public updateBankHealth(code: BankCode, status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN', latencyMs?: number) {
    const bank = this.bankHealth.get(code);
    if (bank) {
      bank.status = status;
      if (latencyMs !== undefined) bank.latencyMs = latencyMs;
      bank.lastUpdated = new Date().toISOString();
      if (status === 'DOWN') {
        bank.successRate = 12.4;
      } else if (status === 'DEGRADED') {
        bank.successRate = 42.8;
      } else {
        bank.successRate = 98.9;
      }
      this.persist();
    }
  }
}

export const recoveryStore = new RecoveryStore();
