const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_ROLE_KEY = 'userRole';
const USER_HMS_ID_KEY = 'userHmsId';

import { isMainSiteHost } from './host-utils';

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
  localStorage.removeItem(USER_HMS_ID_KEY);
}

export function getUserHmsId(): number | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(USER_HMS_ID_KEY);
  if (!val) return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

export function storeUserHmsId(hmsId: number | null | undefined): void {
  if (typeof window === 'undefined') return;
  if (hmsId != null) {
    localStorage.setItem(USER_HMS_ID_KEY, String(hmsId));
  } else {
    localStorage.removeItem(USER_HMS_ID_KEY);
  }
}

export function getUserRole(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedRole = localStorage.getItem(USER_ROLE_KEY);
  if (!storedRole) {
    return null;
  }

  const hostname = window.location.hostname.toLowerCase();
  const isMainPortalHost = isMainSiteHost(hostname);
  const isSubsiteScopedAdmin = storedRole === 'site_admin' || storedRole === 'site_building_manager';

  // On the main portal, subsite-scoped admins should behave like normal users.
  if (isMainPortalHost && isSubsiteScopedAdmin) {
    return 'normal_user';
  }

  return storedRole;
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
