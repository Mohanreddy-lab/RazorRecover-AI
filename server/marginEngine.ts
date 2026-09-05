export interface MarginPolicy {
  orderAmountPaise: number;
  categoryMarginPercent: number;
  maxAllowedDiscount: number;
}

export function calculateMerchantMaxDiscount(orderAmountPaise: number, categoryMarginPercent: number): number {
  void orderAmountPaise;
  const maxDiscountCap = Math.max(0, categoryMarginPercent - 3.0);
  return Math.min(maxDiscountCap, 10.0);
}

export function getMarginPolicy(orderAmountPaise: number, categoryMarginPercent = 8.0): MarginPolicy {
  return {
    orderAmountPaise,
    categoryMarginPercent,
    maxAllowedDiscount: calculateMerchantMaxDiscount(orderAmountPaise, categoryMarginPercent)
  };
}
