import { minorUnitDigits } from './money';

describe('minorUnitDigits', () => {
  it('returns the currency fraction digits', () => {
    expect(minorUnitDigits('JPY')).toBe(0);
    expect(minorUnitDigits('EUR')).toBe(2);
  });

  it('falls back to two digits for invalid currency codes', () => {
    expect(minorUnitDigits('invalid')).toBe(2);
  });
});
