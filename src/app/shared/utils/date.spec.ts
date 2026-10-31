import { formatEffectiveDate, todayInTimeZone } from './date';

describe('todayInTimeZone', () => {
  it('uses the calendar date in each timezone at a fixed instant', () => {
    const now = new Date('2026-01-01T02:00:00.000Z');

    expect(todayInTimeZone('America/New_York', now)).toBe('2025-12-31');
    expect(todayInTimeZone('Asia/Tokyo', now)).toBe('2026-01-01');
  });
});

describe('formatEffectiveDate', () => {
  it('formats a date-only effective date for display', () => {
    expect(formatEffectiveDate('2026-10-28')).toBe('28 Oct 2026');
    expect(formatEffectiveDate('invalid')).toBe('invalid');
  });
});
