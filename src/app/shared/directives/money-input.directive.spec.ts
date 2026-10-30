import { parseMoneyInput } from './money-input.directive';

describe('parseMoneyInput', () => {
  it('converts decimal text to integer minor units without floating-point conversion', () => {
    expect(parseMoneyInput('12.34')).toBe(1234);
    expect(parseMoneyInput('0.01')).toBe(1);
  });

  it('respects the currency minor-unit precision', () => {
    expect(parseMoneyInput('125', 'JPY')).toBe(125);
    expect(parseMoneyInput('1.23', 'JPY')).toBeNull();
    expect(parseMoneyInput('1.234', 'EUR')).toBeNull();
  });

  it('rejects invalid and unsafe values', () => {
    expect(parseMoneyInput('1.2.3')).toBeNull();
    expect(parseMoneyInput('90071992547409.92')).toBeNull();
    expect(parseMoneyInput('')).toBeNull();
  });
});
