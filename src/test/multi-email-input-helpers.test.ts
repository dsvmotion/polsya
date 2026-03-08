import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  parseEmailInput,
} from '@/components/creative/shared/MultiEmailInput.helpers';

describe('MultiEmailInput.helpers', () => {
  describe('isValidEmail', () => {
    it('accepts valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('name.surname@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('@no-user.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
    });
  });

  describe('parseEmailInput', () => {
    it('parses comma-separated emails', () => {
      const result = parseEmailInput('alice@example.com, bob@example.com');
      expect(result.valid).toEqual(['alice@example.com', 'bob@example.com']);
      expect(result.invalid).toEqual([]);
    });

    it('parses semicolon-separated emails', () => {
      const result = parseEmailInput('alice@example.com; bob@example.com');
      expect(result.valid).toEqual(['alice@example.com', 'bob@example.com']);
      expect(result.invalid).toEqual([]);
    });

    it('parses space-separated emails', () => {
      const result = parseEmailInput('alice@example.com bob@example.com');
      expect(result.valid).toEqual(['alice@example.com', 'bob@example.com']);
      expect(result.invalid).toEqual([]);
    });

    it('separates valid and invalid tokens', () => {
      const result = parseEmailInput('alice@example.com, not-valid, bob@example.com');
      expect(result.valid).toEqual(['alice@example.com', 'bob@example.com']);
      expect(result.invalid).toEqual(['not-valid']);
    });

    it('lowercases valid emails', () => {
      const result = parseEmailInput('ALICE@EXAMPLE.COM');
      expect(result.valid).toEqual(['alice@example.com']);
    });

    it('handles empty string', () => {
      const result = parseEmailInput('');
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
    });

    it('handles whitespace-only string', () => {
      const result = parseEmailInput('   ');
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
    });
  });
});
