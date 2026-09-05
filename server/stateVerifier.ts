export type TerminalFailureResult = {
  safeToTriage: boolean;
  reason: string;
  state: string;
};

export function verifyTerminalFailure(payload: Record<string, any>): TerminalFailureResult {
  const paymentEntity = payload?.payload?.payment?.entity || payload?.payment?.entity || payload?.entity || payload;
  const status = String(paymentEntity?.status || '').toLowerCase();

  if (status === 'pending' || status === 'processing') {
    return { safeToTriage: true, state: status, reason: 'Payment is still processing at the bank switch. Recovery is held while status is polled.' };
  }
  if (status === 'authorized' || status === 'captured' || status === 'paid') {
    return { safeToTriage: false, state: status, reason: 'Payment is already authorized or captured. Recovery suppressed.' };
  }
  if (status === 'failed' || status === '') {
    return { safeToTriage: true, state: status || 'implicit_failed', reason: 'Terminal failure confirmed or legacy payload has no status.' };
  }
  return { safeToTriage: false, state: status, reason: `Unknown payment state '${status}'. Recovery suppressed for safety.` };
}
