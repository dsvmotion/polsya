import { describe, it, expect } from 'vitest';
import { isValidEmail, parseEmailInput } from '@/components/creative/shared/MultiEmailInput';

// ---------------------------------------------------------------------------
// 1. isValidEmail
// ---------------------------------------------------------------------------
describe('isValidEmail', () => {
  it('accepts a standard email', () => {
    expect(isValidEmail('alice@example.com')).toBe(true);
  });

  it('accepts emails with subdomains', () => {
    expect(isValidEmail('bob@mail.example.co.uk')).toBe(true);
  });

  it('accepts emails with plus addressing', () => {
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('accepts emails with dots in local part', () => {
    expect(isValidEmail('first.last@domain.org')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects string without @', () => {
    expect(isValidEmail('alice-at-example.com')).toBe(false);
  });

  it('rejects string without domain', () => {
    expect(isValidEmail('alice@')).toBe(false);
  });

  it('rejects string without local part', () => {
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('rejects string without tld', () => {
    expect(isValidEmail('alice@domain')).toBe(false);
  });

  it('rejects string with spaces', () => {
    expect(isValidEmail('alice @example.com')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. parseEmailInput
// ---------------------------------------------------------------------------
describe('parseEmailInput', () => {
  it('splits comma-separated emails', () => {
    const result = parseEmailInput('a@b.com,c@d.com');
    expect(result.valid).toEqual(['a@b.com', 'c@d.com']);
    expect(result.invalid).toEqual([]);
  });

  it('splits semicolon-separated emails', () => {
    const result = parseEmailInput('a@b.com;c@d.com');
    expect(result.valid).toEqual(['a@b.com', 'c@d.com']);
    expect(result.invalid).toEqual([]);
  });

  it('splits space-separated emails', () => {
    const result = parseEmailInput('a@b.com c@d.com');
    expect(result.valid).toEqual(['a@b.com', 'c@d.com']);
    expect(result.invalid).toEqual([]);
  });

  it('handles mixed separators', () => {
    const result = parseEmailInput('a@b.com, c@d.com; e@f.com g@h.com');
    expect(result.valid).toEqual(['a@b.com', 'c@d.com', 'e@f.com', 'g@h.com']);
    expect(result.invalid).toEqual([]);
  });

  it('lowercases valid emails', () => {
    const result = parseEmailInput('Alice@Example.COM');
    expect(result.valid).toEqual(['alice@example.com']);
  });

  it('separates valid from invalid entries', () => {
    const result = parseEmailInput('good@email.com, notanemail, also@valid.org');
    expect(result.valid).toEqual(['good@email.com', 'also@valid.org']);
    expect(result.invalid).toEqual(['notanemail']);
  });

  it('returns empty arrays for empty input', () => {
    const result = parseEmailInput('');
    expect(result.valid).toEqual([]);
    expect(result.invalid).toEqual([]);
  });

  it('returns empty arrays for whitespace-only input', () => {
    const result = parseEmailInput('   ');
    expect(result.valid).toEqual([]);
    expect(result.invalid).toEqual([]);
  });

  it('handles a single valid email', () => {
    const result = parseEmailInput('solo@test.com');
    expect(result.valid).toEqual(['solo@test.com']);
    expect(result.invalid).toEqual([]);
  });

  it('handles a single invalid entry', () => {
    const result = parseEmailInput('nope');
    expect(result.valid).toEqual([]);
    expect(result.invalid).toEqual(['nope']);
  });

  it('trims surrounding whitespace from tokens', () => {
    const result = parseEmailInput('  a@b.com ,  c@d.com  ');
    expect(result.valid).toEqual(['a@b.com', 'c@d.com']);
  });
});
