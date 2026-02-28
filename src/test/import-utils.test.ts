import { describe, it, expect } from 'vitest';
import { normalizeText, sanitizeTextInput, buildDedupeKey } from '../lib/import-utils';

describe('normalizeText', () => {
  it('trims whitespace', () => {
    expect(normalizeText('  hello  ')).toBe('hello');
  });

  it('lowercases', () => {
    expect(normalizeText('FARMACIA')).toBe('farmacia');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeText('hello   world')).toBe('hello world');
  });

  it('handles tabs and newlines as spaces', () => {
    expect(normalizeText('hello\t\nworld')).toBe('hello world');
  });

  it('returns empty string for null', () => {
    expect(normalizeText(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(normalizeText(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(normalizeText('')).toBe('');
  });

  it('returns empty string for whitespace-only', () => {
    expect(normalizeText('   ')).toBe('');
  });
});

describe('sanitizeTextInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeTextInput('  hello  ')).toBe('hello');
  });

  it('removes control characters', () => {
    expect(sanitizeTextInput('hello\x00world')).toBe('helloworld');
    expect(sanitizeTextInput('abc\x07def')).toBe('abcdef');
    expect(sanitizeTextInput('test\x7Fvalue')).toBe('testvalue');
  });

  it('preserves normal whitespace (tab, newline)', () => {
    expect(sanitizeTextInput('hello\tworld')).toBe('hello\tworld');
    expect(sanitizeTextInput('hello\nworld')).toBe('hello\nworld');
  });

  it('strips HTML tags', () => {
    expect(sanitizeTextInput('<b>bold</b>')).toBe('bold');
    expect(sanitizeTextInput('<script>alert(1)</script>')).toBe('alert(1)');
    expect(sanitizeTextInput('before<br/>after')).toBe('beforeafter');
    expect(sanitizeTextInput('<div class="x">text</div>')).toBe('text');
  });

  it('strips nested tags', () => {
    expect(sanitizeTextInput('<p><em>nested</em></p>')).toBe('nested');
  });

  it('returns null for empty string', () => {
    expect(sanitizeTextInput('')).toBeNull();
  });

  it('returns null for whitespace-only', () => {
    expect(sanitizeTextInput('   ')).toBeNull();
  });

  it('returns null when only tags remain', () => {
    expect(sanitizeTextInput('<br/>')).toBeNull();
    expect(sanitizeTextInput('<div></div>')).toBeNull();
  });

  it('returns null when only control chars remain', () => {
    expect(sanitizeTextInput('\x00\x01\x02')).toBeNull();
  });

  it('handles mixed content', () => {
    expect(sanitizeTextInput('  <b>Farmacia</b>\x00  ')).toBe('Farmacia');
  });
});

describe('buildDedupeKey', () => {
  it('builds pipe-separated normalized key', () => {
    expect(buildDedupeKey('Farmacia', 'Madrid', 'Calle 1')).toBe('farmacia|madrid|calle 1');
  });

  it('handles null city and address', () => {
    expect(buildDedupeKey('Test', null, null)).toBe('test||');
  });

  it('treats equivalent variants as equal', () => {
    const key1 = buildDedupeKey('Farmacia ABC', 'Madrid', 'Calle Mayor 5');
    const key2 = buildDedupeKey('  FARMACIA   ABC  ', '  madrid ', ' Calle   Mayor  5 ');
    expect(key1).toBe(key2);
  });

  it('produces same key after sanitize+normalize pipeline', () => {
    const raw = ' <b>Farmacia</b> ';
    const sanitized = sanitizeTextInput(raw)!;
    const key1 = buildDedupeKey(sanitized, 'Madrid', null);
    const key2 = buildDedupeKey('Farmacia', 'MADRID', null);
    expect(key1).toBe(key2);
  });

  it('differentiates distinct pharmacies', () => {
    const key1 = buildDedupeKey('Farmacia A', 'Madrid', 'Calle 1');
    const key2 = buildDedupeKey('Farmacia B', 'Madrid', 'Calle 1');
    expect(key1).not.toBe(key2);
  });

  it('differentiates by city', () => {
    const key1 = buildDedupeKey('Farmacia', 'Madrid', null);
    const key2 = buildDedupeKey('Farmacia', 'Barcelona', null);
    expect(key1).not.toBe(key2);
  });

  it('differentiates by address', () => {
    const key1 = buildDedupeKey('Farmacia', 'Madrid', 'Calle 1');
    const key2 = buildDedupeKey('Farmacia', 'Madrid', 'Calle 2');
    expect(key1).not.toBe(key2);
  });
});
