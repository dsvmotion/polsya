import { describe, it, expect } from 'vitest';
import {
  formatThreadSubject,
  getParticipants,
} from '@/components/creative/email/EmailThreadView.helpers';

describe('EmailThreadView.helpers', () => {
  describe('formatThreadSubject', () => {
    it('returns first non-null subject', () => {
      const emails = [
        { subject: null },
        { subject: 'Project Update' },
        { subject: 'Another' },
      ];
      expect(formatThreadSubject(emails)).toBe('Project Update');
    });

    it('returns (No subject) when all null', () => {
      const emails = [{ subject: null }, { subject: null }];
      expect(formatThreadSubject(emails)).toBe('(No subject)');
    });

    it('returns (No subject) for empty array', () => {
      expect(formatThreadSubject([])).toBe('(No subject)');
    });

    it('returns first email subject if non-null', () => {
      const emails = [{ subject: 'First' }, { subject: 'Second' }];
      expect(formatThreadSubject(emails)).toBe('First');
    });
  });

  describe('getParticipants', () => {
    it('returns unique participant names', () => {
      const emails = [
        { fromAddress: 'alice@example.com', fromName: 'Alice' },
        { fromAddress: 'bob@example.com', fromName: 'Bob' },
        { fromAddress: 'alice@example.com', fromName: 'Alice' },
      ];
      expect(getParticipants(emails)).toEqual(['Alice', 'Bob']);
    });

    it('deduplicates case-insensitively', () => {
      const emails = [
        { fromAddress: 'Alice@Example.com', fromName: 'Alice' },
        { fromAddress: 'alice@example.com', fromName: 'Alice Again' },
      ];
      expect(getParticipants(emails)).toEqual(['Alice']);
    });

    it('uses fromAddress when fromName is null', () => {
      const emails = [
        { fromAddress: 'anon@example.com', fromName: null },
      ];
      expect(getParticipants(emails)).toEqual(['anon@example.com']);
    });

    it('returns empty for empty input', () => {
      expect(getParticipants([])).toEqual([]);
    });
  });
});
