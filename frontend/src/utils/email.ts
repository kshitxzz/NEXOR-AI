const GMAIL_SUFFIX = '@gmail.com';

/** Append @gmail.com when the user entered a username without a domain. */
export function normalizeEmailWithGmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed}${GMAIL_SUFFIX}`;
}

export function emailShowsGmailSuffix(email: string): boolean {
  const trimmed = email.trim();
  return trimmed.length > 0 && !trimmed.includes('@');
}
