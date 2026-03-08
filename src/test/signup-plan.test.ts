import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPendingSignupPlan,
  setPendingSignupPlan,
  clearPendingSignupPlan,
  isValidSignupPlan,
} from '@/lib/signupPlan';

describe('signupPlan', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('setPendingSignupPlan / getPendingSignupPlan', () => {
    it('stores and retrieves starter plan', () => {
      setPendingSignupPlan('starter');
      expect(getPendingSignupPlan()).toBe('starter');
    });

    it('stores and retrieves pro plan', () => {
      setPendingSignupPlan('pro');
      expect(getPendingSignupPlan()).toBe('pro');
    });

    it('stores and retrieves business plan', () => {
      setPendingSignupPlan('business');
      expect(getPendingSignupPlan()).toBe('business');
    });

    it('returns null when nothing stored', () => {
      expect(getPendingSignupPlan()).toBeNull();
    });

    it('returns null for invalid stored value', () => {
      localStorage.setItem('polsya_signup_plan', 'invalid_plan');
      expect(getPendingSignupPlan()).toBeNull();
    });

    it('handles case-insensitive stored values', () => {
      localStorage.setItem('polsya_signup_plan', 'Pro');
      expect(getPendingSignupPlan()).toBe('pro');
    });
  });

  describe('clearPendingSignupPlan', () => {
    it('removes stored plan', () => {
      setPendingSignupPlan('pro');
      clearPendingSignupPlan();
      expect(getPendingSignupPlan()).toBeNull();
    });

    it('does not throw when nothing to clear', () => {
      expect(() => clearPendingSignupPlan()).not.toThrow();
    });
  });

  describe('isValidSignupPlan', () => {
    it('returns true for starter', () => expect(isValidSignupPlan('starter')).toBe(true));
    it('returns true for pro', () => expect(isValidSignupPlan('pro')).toBe(true));
    it('returns true for business', () => expect(isValidSignupPlan('business')).toBe(true));
    it('returns false for enterprise', () => expect(isValidSignupPlan('enterprise')).toBe(false));
    it('returns false for null', () => expect(isValidSignupPlan(null)).toBe(false));
    it('returns false for empty string', () => expect(isValidSignupPlan('')).toBe(false));
  });
});
