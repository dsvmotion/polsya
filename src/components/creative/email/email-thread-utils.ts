export function formatThreadSubject(
  emails: Array<{ subject: string | null }>,
): string {
  for (const email of emails) {
    if (email.subject !== null) {
      return email.subject;
    }
  }
  return '(No subject)';
}

export function getParticipants(
  emails: Array<{ fromAddress: string; fromName: string | null }>,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const email of emails) {
    const key = email.fromAddress.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(email.fromName ?? email.fromAddress);
    }
  }

  return result;
}
