'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import { FiBookOpen, FiGrid, FiHome, FiLayers, FiMap } from 'react-icons/fi';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { GET_USER_PROFILE_QUERY } from '@/project_components/common-routes/graphql/operations';
import { LOGOUT_MUTATION } from '@/project_components/login/graphql/operations';
import {
  PROFILE_AVATAR_UPDATED_EVENT,
  getInitials,
  readStoredProfileIdentity,
  syncProfileIdentity,
} from '@/lib/profile-avatar';
import {
  AUTH_CHANGED_EVENT,
  clearStoredSession,
  getValidAuthToken,
  getUserRole,
} from '@/lib/auth-token';

interface HeaderProfileData {
  getUserProfile?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  };
}

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
  const [profileIdentity, setProfileIdentity] = useState({
    avatarUrl: '',
    initials: 'U',
    firstName: undefined as string | undefined,
    lastName: undefined as string | undefined,
    email: undefined as string | undefined,
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

  const navLinks = buildNavLinks(userRole, isAuthenticated);

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

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-3 md:px-6 py-2.5 md:py-3 flex justify-between items-center gap-2"
      style={{
        background: 'var(--bg-navbar)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
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

      {/* Mobile dropdown nav */}
      {navLinks.length > 0 && (
        <div className="md:hidden min-w-[110px]">
          <select
            value={navLinks.find((item) => isActiveNav(item.href))?.href ?? navLinks[0].href}
            onChange={(e) => router.push(e.target.value)}
            className="h-9 rounded-lg px-2 text-xs w-full"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            aria-label="Navigate sections"
          >
            {navLinks.map((link) => (
              <option key={link.href} value={link.href}>
                {link.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Right side: theme toggle + auth controls */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <ThemeToggle compact />

        {isAuthenticated ? (
          <>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="text-[10px] md:text-[11px] uppercase tracking-widest rounded-lg px-2.5 md:px-4 py-1.5 transition-all duration-200"
              style={{
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                opacity: logoutLoading ? 0.6 : 1,
              }}
            >
              {logoutLoading ? 'Signing Out…' : 'Sign Out'}
            </button>

            {/* Profile avatar — links to profile page */}
            <Link
              href="/profile"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all overflow-hidden no-underline"
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
      </div>
    </nav>
  );
}