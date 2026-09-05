import crypto from 'crypto';

export function generateImmutableRecoveryLink(orderId: string, originalAmountPaise: number, discountPercent: number): string {
  const fingerprint = crypto.createHash('sha256')
    .update(`${orderId}:${originalAmountPaise}:${discountPercent}`)
    .digest('hex');
  return `/checkout/${fingerprint.slice(0, 16)}`;
}
