const CONSENT_COOKIE = 'rr_cookie_consent';
export type CookieConsent = 'accepted' | 'essential';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const encodedName = `${encodeURIComponent(name)}=`;
  const value = document.cookie.split('; ').find(cookie => cookie.startsWith(encodedName));
  return value ? decodeURIComponent(value.slice(encodedName.length)) : null;
}

export function getCookieConsent(): CookieConsent | null {
  const value = readCookie(CONSENT_COOKIE);
  return value === 'accepted' || value === 'essential' ? value : null;
}

export function setCookieConsent(consent: CookieConsent): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(CONSENT_COOKIE)}=${encodeURIComponent(consent)}; Max-Age=31536000; Path=/; SameSite=Lax`;
}
