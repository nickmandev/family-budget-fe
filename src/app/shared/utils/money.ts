/**
 * Number of fraction digits for a currency (2 for EUR/USD/GBP, 0 for JPY).
 * Falls back to 2 for unknown/invalid codes.
 */
export function minorUnitDigits(currency: string): number {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}
