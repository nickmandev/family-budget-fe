import { MoneyPipe } from './money.pipe';

describe('MoneyPipe', () => {
  const pipe = new MoneyPipe();

  it('formats integer minor units as currency', () => {
    expect(pipe.transform(1234, 'EUR')).toBe('€12.34');
  });

  it('renders a dash for null, undefined, and non-finite input', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform(Number.NaN)).toBe('—');
  });

  it('uses the currency-specific number of fraction digits', () => {
    expect(pipe.transform(125, 'JPY')).toBe('¥125');
    expect(pipe.transform(1234, 'KWD')).toBe('KWD 1.234');
  });
});
