export function minorUnitDigits(currency: string): number {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export function parseMinorUnits(value: string, currency: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }

  const digits = minorUnitDigits(currency);
  const [whole, fraction = ''] = normalized.split('.');
  if (fraction.length > digits || (digits === 0 && fraction.length > 0)) {
    return null;
  }

  const minor = Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, '0') || 0);
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

export function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
