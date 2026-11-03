const ENABLE_BANKING_DOMAIN = 'enablebanking.com';

/**
 * True when `value` is an absolute HTTPS Enable Banking authorisation URL:
 * the host is `enablebanking.com` or a subdomain of it, there is no embedded
 * userinfo, and no non-default port. Covers both the live host
 * (`auth.enablebanking.com`) and the sandbox (`auth-sandbox.enablebanking.com`).
 */
export function isTrustedBankAuthUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  if (parsed.username !== '' || parsed.password !== '') return false;
  if (parsed.port !== '') return false;
  const host = parsed.hostname.toLowerCase();
  return host === ENABLE_BANKING_DOMAIN || host.endsWith(`.${ENABLE_BANKING_DOMAIN}`);
}
