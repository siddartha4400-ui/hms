import { normalizeBackendAssetUrl } from '@/lib/backend-url';

export const PROFILE_AVATAR_STORAGE_KEY = 'hs-profile-avatar';
export const PROFILE_IDENTITY_STORAGE_KEY = 'hs-profile-identity';
export const PROFILE_AVATAR_UPDATED_EVENT = 'hs:profile-avatar-updated';

export interface StoredProfileIdentity {
  avatarUrl: string;
  initials: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export function normalizeAvatarUrl(url?: string): string {
  return normalizeBackendAssetUrl(url);
}

export function getInitials(firstName?: string, lastName?: string, email?: string): string {
  const first = firstName?.trim()?.[0] || '';
  const last = lastName?.trim()?.[0] || '';
  const fromName = `${first}${last}`.toUpperCase();

  if (fromName) {
    return fromName;
  }

  return (email?.trim()?.[0] || 'U').toUpperCase();
}

export function readStoredProfileIdentity(): StoredProfileIdentity {
  if (typeof window === 'undefined') {
    return { avatarUrl: '', initials: 'U' };
  }

  try {
    const raw = localStorage.getItem(PROFILE_IDENTITY_STORAGE_KEY);
    if (!raw) {
      const avatarUrl = normalizeAvatarUrl(localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY) || '');
      return { avatarUrl, initials: 'U' };
    }

    const parsed = JSON.parse(raw) as Partial<StoredProfileIdentity>;
    return {
      avatarUrl: normalizeAvatarUrl(parsed.avatarUrl),
      initials: parsed.initials || getInitials(parsed.firstName, parsed.lastName, parsed.email),
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
    };
  } catch {
    return { avatarUrl: '', initials: 'U' };
  }
}

export function syncProfileIdentity(identity: {
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextIdentity: StoredProfileIdentity = {
    avatarUrl: normalizeAvatarUrl(identity.avatarUrl),
    firstName: identity.firstName,
    lastName: identity.lastName,
    email: identity.email,
    initials: getInitials(identity.firstName, identity.lastName, identity.email),
  };

  localStorage.setItem(PROFILE_AVATAR_STORAGE_KEY, nextIdentity.avatarUrl);
  localStorage.setItem(PROFILE_IDENTITY_STORAGE_KEY, JSON.stringify(nextIdentity));
  window.dispatchEvent(new CustomEvent(PROFILE_AVATAR_UPDATED_EVENT, { detail: nextIdentity }));
}