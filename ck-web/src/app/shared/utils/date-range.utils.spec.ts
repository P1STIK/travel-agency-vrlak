import { formatDateRange } from './date-range.utils';

describe('formatDateRange', () => {
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

  it('returns a single date when returnDate is null', () => {
    const result = formatDateRange('2026-12-01', null, opts);
    expect(result).toBe(new Date('2026-12-01').toLocaleDateString('sk-SK', opts));
    expect(result).not.toContain('–');
  });

  it('returns a single date when returnDate is undefined', () => {
    const result = formatDateRange('2026-12-01', undefined, opts);
    expect(result).toBe(new Date('2026-12-01').toLocaleDateString('sk-SK', opts));
  });

  it('returns a single date when returnDate equals the same day', () => {
    const result = formatDateRange('2026-12-01', '2026-12-01', opts);
    expect(result).toBe(new Date('2026-12-01').toLocaleDateString('sk-SK', opts));
    expect(result).not.toContain('–');
  });

  it('returns a range "from – to" with an en dash for a multi-day tour', () => {
    const result = formatDateRange('2026-12-01', '2026-12-05', opts);
    const from = new Date('2026-12-01').toLocaleDateString('sk-SK', opts);
    const to = new Date('2026-12-05').toLocaleDateString('sk-SK', opts);
    expect(result).toBe(`${from} – ${to}`);
  });
});
