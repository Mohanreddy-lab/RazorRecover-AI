export interface CircuitState {
  bank: string;
  isOpen: boolean;
  failureCount: number;
  opensAt?: string;
  openUntil?: string;
}

export class BankCircuitBreaker {
  private readonly threshold: number;
  private readonly recoveryTimeMs: number;
  private readonly failureWindowMs: number;
  private failureCounts = new Map<string, number[]>();
  private openCircuits = new Map<string, number>();

  constructor(failureThreshold = 3, recoveryTimeSeconds = 60, failureWindowSeconds = 60) {
    this.threshold = failureThreshold;
    this.recoveryTimeMs = recoveryTimeSeconds * 1000;
    this.failureWindowMs = failureWindowSeconds * 1000;
  }

  recordFailure(bankName: string): boolean {
    const now = Date.now();
    const bank = bankName.toUpperCase();
    const timestamps = (this.failureCounts.get(bank) || []).filter((timestamp) => now - timestamp < this.failureWindowMs);
    timestamps.push(now);
    this.failureCounts.set(bank, timestamps);

    if (timestamps.length >= this.threshold) {
      this.openCircuits.set(bank, now + this.recoveryTimeMs);
      return true;
    }
    return false;
  }

  isCircuitOpen(bankName: string): boolean {
    const bank = bankName.toUpperCase();
    const openUntil = this.openCircuits.get(bank);
    if (!openUntil) return false;
    if (Date.now() < openUntil) return true;
    this.openCircuits.delete(bank);
    this.failureCounts.delete(bank);
    return false;
  }

  getState(): CircuitState[] {
    const banks = new Set([...this.failureCounts.keys(), ...this.openCircuits.keys()]);
    return Array.from(banks).sort().map((bank) => {
      const openUntil = this.openCircuits.get(bank);
      const failureCount = (this.failureCounts.get(bank) || []).filter((timestamp) => Date.now() - timestamp < this.failureWindowMs).length;
      return {
        bank,
        isOpen: Boolean(openUntil && Date.now() < openUntil),
        failureCount,
        opensAt: openUntil ? new Date(openUntil - this.recoveryTimeMs).toISOString() : undefined,
        openUntil: openUntil ? new Date(openUntil).toISOString() : undefined
      };
    });
  }

  reset(): void {
    this.failureCounts.clear();
    this.openCircuits.clear();
  }
}

export const bankCircuitBreaker = new BankCircuitBreaker();
