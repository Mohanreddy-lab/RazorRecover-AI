import crypto from 'crypto';

export interface AuditLedgerEntry {
  timestamp: string;
  orderId: string;
  action: string;
  discountGranted: number;
  reasoning: string;
  previousHash: string;
  hash: string;
}

export class AuditLedger {
  private chain: AuditLedgerEntry[] = [];
  private lastHash = '00000000000000000000000000000000';

  recordAction(orderId: string, action: string, discountGranted: number, reasoning: string): AuditLedgerEntry {
    const entry = {
      timestamp: new Date().toISOString(),
      orderId,
      action,
      discountGranted,
      reasoning,
      previousHash: this.lastHash
    };
    const hash = crypto.createHash('sha256').update(JSON.stringify(entry, Object.keys(entry).sort())).digest('hex');
    const signedEntry = { ...entry, hash };
    this.lastHash = hash;
    this.chain.unshift(signedEntry);
    return signedEntry;
  }

  getEntries(): AuditLedgerEntry[] {
    return [...this.chain];
  }

  reset(): void {
    this.chain = [];
    this.lastHash = '00000000000000000000000000000000';
  }
}

export const auditLedger = new AuditLedger();
