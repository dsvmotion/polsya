import { describe, it, expect } from 'vitest';
import {
  formatThreadSubject,
  getParticipants,
} from '@/components/creative/email/EmailThreadView.helpers';

// ---------------------------------------------------------------------------
// 1. formatThreadSubject
// ---------------------------------------------------------------------------

describe('formatThreadSubject', () => {
  it('returns the subject of the first email when it is non-null', () => {
    const emails = [
      { subject: 'Hello World' },
      { subject: 'Re: Hello World' },
    ];
    expect(formatThreadSubject(emails)).toBe('Hello World');
  });

  it('skips null subjects and finds the first non-null', () => {
    const emails = [
      { subject: null },
      { subject: null },
      { subject: 'Found it' },
      { subject: 'Another one' },
    ];
    expect(formatThreadSubject(emails)).toBe('Found it');
  });

  it('returns "(No subject)" when all subjects are null', () => {
    const emails = [{ subject: null }, { subject: null }];
    expect(formatThreadSubject(emails)).toBe('(No subject)');
  });

  it('returns "(No subject)" for an empty array', () => {
    expect(formatThreadSubject([])).toBe('(No subject)');
  });

  it('handles a single email with a subject', () => {
    expect(formatThreadSubject([{ subject: 'Only one' }])).toBe('Only one');
  });

  it('handles a single email with null subject', () => {
    expect(formatThreadSubject([{ subject: null }])).toBe('(No subject)');
  });
});

// ---------------------------------------------------------------------------
// 2. getParticipants
// ---------------------------------------------------------------------------

describe('getParticipants', () => {
  it('returns participant display names in order of first appearance', () => {
    const emails = [
      { fromAddress: 'alice@example.com', fromName: 'Alice' },
      { fromAddress: 'bob@example.com', fromName: 'Bob' },
    ];
    expect(getParticipants(emails)).toEqual(['Alice', 'Bob']);
  });

  it('uses fromAddress when fromName is null', () => {
    const emails = [
      { fromAddress: 'alice@example.com', fromName: null },
      { fromAddress: 'bob@example.com', fromName: 'Bob' },
    ];
    expect(getParticipants(emails)).toEqual(['alice@example.com', 'Bob']);
  });

  it('deduplicates participants by address (case-insensitive)', () => {
    const emails = [
      { fromAddress: 'alice@example.com', fromName: 'Alice' },
      { fromAddress: 'ALICE@example.com', fromName: 'Alice S.' },
      { fromAddress: 'bob@example.com', fromName: 'Bob' },
    ];
    expect(getParticipants(emails)).toEqual(['Alice', 'Bob']);
  });

  it('preserves first-appearance order and first-seen name', () => {
    const emails = [
      { fromAddress: 'bob@example.com', fromName: 'Bob' },
      { fromAddress: 'alice@example.com', fromName: 'Alice' },
      { fromAddress: 'bob@example.com', fromName: 'Robert' },
    ];
    expect(getParticipants(emails)).toEqual(['Bob', 'Alice']);
  });

  it('returns an empty array for empty input', () => {
    expect(getParticipants([])).toEqual([]);
  });

  it('handles a single participant', () => {
    const emails = [{ fromAddress: 'solo@test.com', fromName: 'Solo' }];
    expect(getParticipants(emails)).toEqual(['Solo']);
  });

  it('handles all participants having null names', () => {
    const emails = [
      { fromAddress: 'a@test.com', fromName: null },
      { fromAddress: 'b@test.com', fromName: null },
    ];
    expect(getParticipants(emails)).toEqual(['a@test.com', 'b@test.com']);
  });
});
