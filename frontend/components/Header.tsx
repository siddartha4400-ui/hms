'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import { FiArrowLeft, FiBookOpen, FiGrid, FiHome, FiLayers, FiMap, FiMenu, FiX } from 'react-icons/fi';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { GET_USER_PROFILE_QUERY } from '@/project_components/common-routes/graphql/operations';
import { LIST_HMS_QUERY } from '@/project_components/subsites/graphql/operations';
import { LOGOUT_MUTATION } from '@/project_components/login/graphql/operations';
import {
  PROFILE_AVATAR_UPDATED_EVENT,
  type StoredProfileIdentity,
  getInitials,
  readStoredProfileIdentity,
  syncProfileIdentity,
} from '@/lib/profile-avatar';
import {
  AUTH_CHANGED_EVENT,
  clearStoredSession,
  getValidAuthToken,
  getUserHmsId,
  getUserRole,
} from '@/lib/auth-token';
import { isMainSiteHost, resolveHostSubsiteKey } from '@/lib/host-utils';

interface HeaderProfileData {
  getUserProfile?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  };
}

type HmsAccessItem = {
  id: number;
  hmsName?: string | null;
};

type HmsAccessData = {
  subsiteBaseDomain?: string | null;
  listHms?: HmsAccessItem[] | null;
};
type NavLink = { label: string; href: string; icon: React.ReactNode };

function buildNavLinks(role: string | null, authed: boolean): NavLink[] {
  const home: NavLink = { label: 'Home', href: '/', icon: <FiHome className="h-3.5 w-3.5" /> };
  if (!authed) {
    return [home];
  }
  switch (role) {
    case 'root_admin':
      return [
        home,
        { label: 'My Bookings', href: '/my-bookings', icon: <FiBookOpen className="h-3.5 w-3.5" /> },
        { label: 'Dashboard', href: '/dashboard', icon: <FiGrid className="h-3.5 w-3.5" /> },
        { label: 'Cities', href: '/cities', icon: <FiMap className="h-3.5 w-3.5" /> },
      ];
    case 'site_admin':
    case 'site_building_manager':
      return [
        home,
        { label: 'My Bookings', href: '/my-bookings', icon: <FiBookOpen className="h-3.5 w-3.5" /> },
        { label: 'Dashboard', href: '/dashboard', icon: <FiGrid className="h-3.5 w-3.5" /> },
      ];
    default: // normal_user or unrecognised
      return [home, { label: 'My Bookings', href: '/my-bookings', icon: <FiBookOpen className="h-3.5 w-3.5" /> }];
  }
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileIdentity, setProfileIdentity] = useState<StoredProfileIdentity>({
    avatarUrl: '',
    initials: 'U',
    firstName: undefined,
    lastName: undefined,
    email: undefined,
  });

  // Sync auth state on mount and whenever auth changes (login / logout from anywhere).
  useEffect(() => {
    function sync() {
      const token = getValidAuthToken();
      setIsAuthenticated(Boolean(token));
      setUserRole(getUserRole());
      setProfileIdentity(readStoredProfileIdentity());
    }
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener(PROFILE_AVATAR_UPDATED_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener(PROFILE_AVATAR_UPDATED_EVENT, sync as EventListener);
    };
  }, []);

  const { data } = useQuery<HeaderProfileData>(GET_USER_PROFILE_QUERY, {
    skip: !isAuthenticated,
  });
  const { data: hmsAccessData, loading: hmsAccessLoading } = useQuery<HmsAccessData>(LIST_HMS_QUERY, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-first',
  });

  useEffect(() => {
    const profile = data?.getUserProfile;
    if (!profile) return;
    syncProfileIdentity({
      avatarUrl: profile.profilePictureUrl,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
    });
    setProfileIdentity(readStoredProfileIdentity());
  }, [data]);

  const [logoutMutation, { loading: logoutLoading }] = useMutation(LOGOUT_MUTATION);

  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await logoutMutation({ variables: { refreshToken } });
      } catch {
        // Clear client session even if server logout fails.
      }
    }
    clearStoredSession();
    setIsAuthenticated(false);
    setUserRole(null);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    router.replace('/');
  }, [logoutMutation, router]);

  const navLinks = useMemo(() => {
    const links = buildNavLinks(userRole, isAuthenticated);
    const isSubsiteScopedAdmin = userRole === 'site_admin' || userRole === 'site_building_manager';

    if (!isAuthenticated || !isSubsiteScopedAdmin) {
      return links;
    }

    if (typeof window === 'undefined') {
      return links;
    }

    const hostName = window.location.hostname.toLowerCase();
    const baseDomain = (hmsAccessData?.subsiteBaseDomain || '').trim().toLowerCase();
    const isMainPortalHost = isMainSiteHost(hostName, baseDomain);

    if (isMainPortalHost) {
      return links;
    }

    const subsiteKey = resolveHostSubsiteKey(hostName, baseDomain);
    const matchedSubsite = (hmsAccessData?.listHms || []).find((item) => (item.hmsName || '').toLowerCase() === subsiteKey);
    const userHmsId = getUserHmsId();
    const canAccessDashboard = Boolean(matchedSubsite && userHmsId && matchedSubsite.id === userHmsId);

    if (hmsAccessLoading || !canAccessDashboard) {
      return links.filter((link) => link.href !== '/dashboard');
    }

    return links;
  }, [hmsAccessData, hmsAccessLoading, isAuthenticated, userRole]);
  const showBackButton = pathname !== '/';

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  }, [router]);

  const isActiveNav = useCallback(
    (href: string) => {
      if (href === '/') return pathname === '/';
      if (href === '/subsite-dashboard') {
        return pathname.startsWith('/subsite-dashboard');
      }
      return pathname.startsWith(href);
    },
    [pathname],
  );

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, isAuthenticated]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-3 md:px-6 py-2.5 md:py-3 flex justify-between items-center gap-2"
      style={{
        background: 'var(--bg-navbar)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 no-underline group shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{ background: 'var(--brand-dim)', border: '1px solid var(--brand-border)' }}
          >
            <FiLayers style={{ color: 'var(--brand)' }} className="text-sm" />
          </div>
          <div className="leading-none">
            <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              HotelSphere
            </span>
            <span
              className="hidden md:block text-[9px] uppercase tracking-[.2em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Hospitality Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Desktop tab nav — only when authenticated */}
      {navLinks.length > 0 && (
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest no-underline transition-all duration-200 px-2.5 py-1.5 rounded-md"
              style={{
                color: isActiveNav(link.href) ? 'var(--brand)' : 'var(--text-muted)',
                background: isActiveNav(link.href) ? 'var(--brand-dim)' : 'transparent',
                border: isActiveNav(link.href) ? '1px solid var(--brand-border)' : '1px solid transparent',
                textDecoration: 'none',
              }}
            >
              <span className="shrink-0">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Right side: theme toggle + auth controls */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="hidden md:block">
          <ThemeToggle compact />
        </div>

        {isAuthenticated ? (
          <>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="hidden md:inline-flex text-[10px] md:text-[11px] uppercase tracking-widest rounded-lg px-2.5 md:px-4 py-1.5 transition-all duration-200"
              style={{
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                opacity: logoutLoading ? 0.6 : 1,
              }}
            >
              {logoutLoading ? 'Signing Out…' : 'Sign Out'}
            </button>

            {/* Desktop profile avatar — links to profile page */}
            <Link
              href="/profile"
              className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-[10px] font-bold cursor-pointer transition-all overflow-hidden no-underline"
              style={{
                background: 'var(--brand-dim)',
                border: '1px solid var(--brand-border)',
                color: 'var(--brand)',
              }}
              aria-label="Open profile"
            >
              {profileIdentity.avatarUrl ? (
                <img
                  src={profileIdentity.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(profileIdentity.firstName, profileIdentity.lastName, profileIdentity.email)
              )}
            </Link>

            {/* Mobile profile avatar */}
            {navLinks.length > 0 ? (
              <Link
                href="/profile"
                className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden no-underline"
                style={{
                  background: 'var(--brand-dim)',
                  border: '1px solid var(--brand-border)',
                  color: 'var(--brand)',
                }}
                aria-label="Open profile"
              >
                {profileIdentity.avatarUrl ? (
                  <img src={profileIdentity.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials(profileIdentity.firstName, profileIdentity.lastName, profileIdentity.email)
                )}
              </Link>
            ) : null}

            {/* Mobile menu button */}
            {navLinks.length > 0 ? (
              <button
                type="button"
                className="md:hidden w-10 h-10 rounded-lg inline-flex items-center justify-center"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                }}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen((value) => !value)}
              >
                {isMobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
              </button>
            ) : null}
          </>
        ) : (
          !isAuthPage && (
            <Link
              href="/login"
              className="text-[10px] md:text-[11px] uppercase tracking-widest rounded-lg px-2.5 md:px-4 py-1.5 transition-all duration-200 no-underline inline-flex items-center"
              style={{
                color: 'var(--brand)',
                border: '1px solid var(--brand-border)',
                background: 'var(--brand-dim)',
              }}
            >
              Login
            </Link>
          )
        )}

        {showBackButton ? (
          <button
            type="button"
            onClick={handleBack}
            className="h-8 md:h-9 px-2.5 rounded-lg inline-flex items-center justify-center gap-1.5 text-[10px] md:text-[11px] uppercase tracking-widest"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-input)',
            }}
            aria-label="Go back"
          >
            <FiArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        ) : null}
      </div>

      {isAuthenticated && isMobileMenuOpen && navLinks.length > 0 ? (
        <>
          <button
            type="button"
            className="md:hidden fixed inset-0 top-[60px]"
            style={{ background: 'rgba(2, 6, 23, 0.45)' }}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation menu backdrop"
          />
          <div
            className="md:hidden absolute right-2 top-[calc(100%+0.5rem)] w-[min(22rem,calc(100vw-1rem))] rounded-2xl border p-3 shadow-2xl animate-fade-in-up"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-surface)',
            }}
          >
            <div
              className="mb-3 rounded-xl border p-3"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
                  style={{
                    background: 'var(--brand-dim)',
                    border: '1px solid var(--brand-border)',
                    color: 'var(--brand)',
                  }}
                >
                  {profileIdentity.avatarUrl ? (
                    <img src={profileIdentity.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(profileIdentity.firstName, profileIdentity.lastName, profileIdentity.email)
                  )}
                </div>
                <div className="min-w-0 flex-1 pr-1">
                  <p className="text-sm font-semibold leading-none truncate" style={{ color: 'var(--text-primary)' }}>
                    {isAuthenticated
                      ? `${profileIdentity.firstName || ''} ${profileIdentity.lastName || ''}`.trim() || 'Profile'
                      : 'Guest User'}
                  </p>
                </div>

                {isAuthenticated ? (
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex h-8 items-center rounded-lg px-3 text-center text-[11px] font-semibold no-underline shrink-0"
                    style={{
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-input)',
                    }}
                  >
                    Edit Profile
                  </Link>
                ) : null}
              </div>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    void handleLogout();
                  }}
                  disabled={logoutLoading}
                  className="mt-2 w-full rounded-lg px-2.5 py-2 text-[11px] font-semibold"
                  style={{
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-input)',
                    opacity: logoutLoading ? 0.6 : 1,
                  }}
                >
                  {logoutLoading ? 'Signing Out…' : 'Logout'}
                </button>
              ) : null}

              {!isAuthenticated ? (
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full rounded-lg px-3 py-2 text-center text-xs font-semibold no-underline"
                    style={{
                      border: '1px solid var(--brand-border)',
                      color: 'var(--brand)',
                      background: 'var(--brand-dim)',
                    }}
                  >
                    Login
                  </Link>
                </div>
              ) : null}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="mb-1 last:mb-0 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold no-underline"
                style={{
                  color: isActiveNav(link.href) ? 'var(--brand)' : 'var(--text-secondary)',
                  background: isActiveNav(link.href) ? 'var(--brand-dim)' : 'transparent',
                  border: isActiveNav(link.href) ? '1px solid var(--brand-border)' : '1px solid transparent',
                }}
              >
                <span className="shrink-0">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}

            <div
              className="mt-2 rounded-xl border p-2"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
            >
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                Theme
              </p>
              <ThemeToggle selectable />
            </div>
          </div>
        </>
      ) : null}
    </nav>
  );
}