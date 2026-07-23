import { formatCurrency, truncate, getInitials, formatDate } from './index';

describe('shared-utils', () => {
  describe('truncate', () => {
    it('leaves short strings untouched', () => {
      expect(truncate('hello', 10)).toBe('hello');
      expect(truncate('hello', 5)).toBe('hello');
    });

    it('truncates longer strings with an ellipsis', () => {
      // length 11 > 5 -> slice(0, 4) + '...'
      expect(truncate('hello world', 5)).toBe('hell...');
    });
  });

  describe('getInitials', () => {
    it('takes the first letter of the first two words, uppercased', () => {
      expect(getInitials('ahmed benali')).toBe('AB');
      expect(getInitials('Fatima Zahra El Idrissi')).toBe('FZ');
    });

    it('handles a single word and extra spaces', () => {
      expect(getInitials('  owner  ')).toBe('O');
    });
  });

  describe('formatCurrency', () => {
    it('returns a non-empty MAD string containing the amount digits', () => {
      const out = formatCurrency(1234.5, 'fr-MA');
      expect(typeof out).toBe('string');
      // separators/symbol placement vary by ICU; assert digits + currency only
      expect(out).toMatch(/234/);
      expect(out).toMatch(/MAD/);
    });
  });

  describe('formatDate', () => {
    it('formats a date into a non-empty localized string', () => {
      const out = formatDate('2026-04-23T15:13:00Z', 'fr-MA');
      expect(typeof out).toBe('string');
      expect(out.length).toBeGreaterThan(0);
      expect(out).toMatch(/2026/);
    });
  });
});
