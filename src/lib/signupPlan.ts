const STORAGE_KEY = 'sales_compass_signup_plan';

export type SignupPlanCode = 'starter' | 'pro' | 'business';

export function getPendingSignupPlan(): SignupPlanCode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const code = stored.toLowerCase();
    if (code === 'starter' || code === 'pro' || code === 'business') return code;
    return null;
  } catch {
    return null;
  }
}

export function setPendingSignupPlan(plan: SignupPlanCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, plan);
  } catch {
    // ignore
  }
}

export function clearPendingSignupPlan(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isValidSignupPlan(value: string | null): value is SignupPlanCode {
  return value === 'starter' || value === 'pro' || value === 'business';
}
