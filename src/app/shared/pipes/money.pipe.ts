import { Pipe, PipeTransform } from '@angular/core';

export type MoneySignDisplay = 'auto' | 'always' | 'never' | 'exceptZero';

/**
 * Formats integer minor units (e.g. 1234) as a currency amount (e.g. €12.34).
 *
 * All money in the API is transported as integer minor units. The pipe reads
 * the currency's fraction digits from `Intl.NumberFormat` so currencies with
 * a different exponent (for example JPY) are handled correctly.
 */
@Pipe({
  name: 'money',
  standalone: true,
  pure: true,
})
export class MoneyPipe implements PipeTransform {
  private readonly formatters = new Map<string, Intl.NumberFormat>();

  transform(
    value: number | null | undefined,
    currency = 'EUR',
    signDisplay: MoneySignDisplay = 'auto',
  ): string {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return '—';
    }

    const formatter = this.formatter(currency, signDisplay);
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;

    return formatter.format(value / 10 ** fractionDigits);
  }

  private formatter(
    currency: string,
    signDisplay: MoneySignDisplay,
  ): Intl.NumberFormat {
    const code = currency || 'EUR';
    const cacheKey = `${code}:${signDisplay}`;
    const cached = this.formatters.get(cacheKey);

    if (cached) {
      return cached;
    }

    let formatter: Intl.NumberFormat;
    try {
      const reference = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
      });
      const fractionDigits =
        reference.resolvedOptions().maximumFractionDigits ?? 2;

      formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
        signDisplay,
      });
    } catch {
      // Unknown/invalid currency codes fall back to EUR rather than throwing
      // inside a template expression.
      formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay,
      });
    }

    this.formatters.set(cacheKey, formatter);
    return formatter;
  }
}
