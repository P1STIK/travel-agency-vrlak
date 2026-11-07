import { PricePipe, formatPrice } from './price.pipe';

describe('PricePipe', () => {
  const pipe = new PricePipe();

  it('formats whole euros without decimals', () => {
    expect(pipe.transform(42900)).toBe('429 €');
  });

  it('formats cents with two decimals', () => {
    expect(pipe.transform(42950)).toBe('429,50 €');
  });

  it('formats thousands with a non-breaking space separator', () => {
    expect(pipe.transform(129900)).toBe('1 299 €');
  });

  it('formats zero as whole euros', () => {
    expect(pipe.transform(0)).toBe('0 €');
  });

  it('returns empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('formats small amounts under a euro', () => {
    expect(pipe.transform(380)).toBe('3,80 €');
  });

  it('renders a non-EUR currency code after the amount', () => {
    expect(pipe.transform(42900, 'USD')).toBe('429 USD');
  });

  it('exposes a plain formatPrice helper for TS code', () => {
    expect(formatPrice(42950)).toBe('429,50 €');
  });
});
