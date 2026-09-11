const rawEnv = (import.meta as any).env || {};

/** Client-safe publishable key (never a secret). Undefined when Clerk is not configured. */
export const clerkPublishableKey: string | undefined = rawEnv.VITE_CLERK_PUBLISHABLE_KEY;

const explicitProvider: string | undefined = rawEnv.VITE_AUTH_PROVIDER;

/**
 * Clerk is enabled when a publishable key is configured (client-safe) and it has
 * not been explicitly disabled. `VITE_AUTH_PROVIDER=legacy` forces the legacy
 * flow even if a key is present.
 */
export const clerkEnabled: boolean =
  explicitProvider !== 'legacy' && Boolean(clerkPublishableKey);

export const authProvider: 'clerk' | 'legacy' = clerkEnabled ? 'clerk' : 'legacy';
