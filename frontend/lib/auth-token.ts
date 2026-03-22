const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_ROLE_KEY = 'userRole';

/** Dispatch this event after any login / logout so all Header instances re-sync. */
export const AUTH_CHANGED_EVENT = 'hs:auth-changed';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
}

export function getUserRole(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(USER_ROLE_KEY);
}

export function getValidAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  const exp = typeof payload?.exp === 'number' ? payload.exp : null;

  if (!exp) {
    clearStoredSession();
    return null;
  }

  const nowEpoch = Math.floor(Date.now() / 1000);
  if (exp <= nowEpoch) {
    clearStoredSession();
    return null;
  }

  return token;
}
