const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function parseEmailInput(raw: string): { valid: string[]; invalid: string[] } {
  const tokens = raw
    .split(/[,;\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const valid: string[] = [];
  const invalid: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (isValidEmail(lower)) {
      valid.push(lower);
    } else {
      invalid.push(token);
    }
  }

  return { valid, invalid };
}
