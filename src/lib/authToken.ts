/**
 * Short-lived Clerk session token cache.
 *
 * This intentionally lives in memory only — never in localStorage/sessionStorage.
 * The Clerk provider refreshes it on an interval and on window focus, and the
 * backend independently verifies every token, so a stale cache can only cause a
 * 401 (not a security bypass).
 */
let currentToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

export function getAuthToken(): string | null {
  return currentToken;
}
