'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import { FiLayers } from 'react-icons/fi';
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

interface HeaderProfileData {
  getUserProfile?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  };
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const navLinks = React.useMemo(
    () => [
      { label: 'Overview', href: '/dashboard' },
      { label: 'Subsites', href: '/subsites' },
      { label: 'Cities', href: '/cities' },
    ],
    [],
  );
  const [profileIdentity, setProfileIdentity] = React.useState({
    avatarUrl: '',
    initials: 'U',
    firstName: undefined as string | undefined,
    lastName: undefined as string | undefined,
    email: undefined as string | undefined,
  });
  const { data } = useQuery<HeaderProfileData>(GET_USER_PROFILE_QUERY, {
    skip: pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/dashboard'),
  });
  const [logoutMutation, { loading: logoutLoading }] = useMutation(LOGOUT_MUTATION);
  const isActiveNav = React.useCallback(
    (href: string) => {
      if (href === '/subsites') {
        return pathname.startsWith('/subsites') || pathname.startsWith('/subsite-dashboard');
      }
      if (href === '/cities') {
        return pathname.startsWith('/cities');
      }
      return pathname.startsWith(href);
    },
    [pathname],
  );

  const handleLogout = React.useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        await logoutMutation({ variables: { refreshToken } });
      } catch {
        // Clear client session even if server revoke fails.
      }
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    router.replace('/login');
  }, [logoutMutation, router]);

  React.useEffect(() => {
    setProfileIdentity(readStoredProfileIdentity());
  }, []);

  React.useEffect(() => {
    const profile = data?.getUserProfile;
    if (!profile) {
      return;
    }

    syncProfileIdentity({
      avatarUrl: profile.profilePictureUrl,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
    });
    setProfileIdentity(readStoredProfileIdentity());
  }, [data]);

  React.useEffect(() => {
    const handleProfileUpdate = () => {
      setProfileIdentity(readStoredProfileIdentity());
    };

    window.addEventListener(PROFILE_AVATAR_UPDATED_EVENT, handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener(PROFILE_AVATAR_UPDATED_EVENT, handleProfileUpdate as EventListener);
    };
  }, []);

  // Login, root, and dashboard (manages its own nav) don't use this header
  if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/dashboard')) return null;

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
      <Link href="/dashboard" className="flex items-center gap-2.5 no-underline group">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            background: 'var(--brand-dim)',
            border: '1px solid var(--brand-border)',
          }}
        >
          <FiLayers style={{ color: 'var(--brand)' }} className="text-sm" />
        </div>
        <div className="leading-none">
          <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>HotelSphere</span>
          <span className="hidden md:block text-[9px] uppercase tracking-[.2em]" style={{ color: 'var(--text-muted)' }}>
            Hospitality Platform
          </span>
        </div>
      </Link>

      {/* Navigation */}
      <div className="hidden md:flex items-center gap-7">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-[11px] uppercase tracking-widest no-underline transition-all duration-200 px-2 py-1 rounded-md"
            style={{
              color: isActiveNav(link.href) ? 'var(--brand)' : 'var(--text-muted)',
              background: isActiveNav(link.href) ? 'var(--brand-dim)' : 'transparent',
              border: isActiveNav(link.href) ? '1px solid var(--brand-border)' : '1px solid transparent',
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="md:hidden min-w-[110px]">
        <select
          value={navLinks.find((item) => isActiveNav(item.href))?.href || '/dashboard'}
          onChange={(e) => router.push(e.target.value)}
          className="h-9 rounded-lg px-2 text-xs w-full"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          aria-label="Navigate sections"
        >
          {navLinks.map((link) => (
            <option key={link.href} value={link.href}>{link.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <ThemeToggle compact />
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
          {logoutLoading ? 'Signing Out...' : 'Sign Out'}
        </button>

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
      </div>
    </nav>
  );
}