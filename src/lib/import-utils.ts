export function normalizeText(str: string | null | undefined): string {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function sanitizeTextInput(value: string): string | null {
  let s = value
    .trim()
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<[^>]*>/g, '');
  s = s.trim();
  return s.length > 0 ? s : null;
}

export function buildDedupeKey(name: string, city: string | null, address: string | null): string {
  return `${normalizeText(name)}|${normalizeText(city)}|${normalizeText(address)}`;
}
