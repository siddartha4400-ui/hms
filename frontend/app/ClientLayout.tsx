"use client";
'use client';

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ApolloProvider } from '@apollo/client/react';
import Header from '../components/Header';
import apolloClient from '../lib/apollo';
import { getValidAuthToken } from '../lib/auth-token';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = useMemo(
    () => new Set(['/', '/login', '/signup', '/forgot-password', '/reset-password']),
    [],
  );

  useEffect(() => {
    const token = getValidAuthToken();
    const isPublicRoute = publicRoutes.has(pathname) || pathname.startsWith('/reset-password');

    if (!token && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    // Redirect away from login page if already authenticated.
    if (token && pathname === '/login') {
      router.replace('/');
    }
  }, [pathname, publicRoutes, router]);

  return (
    <ApolloProvider client={apolloClient}>
      {/* CSS-variable background adapts to dark / light theme automatically */}
      <div className="min-h-screen selection:bg-amber-500/30" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <Header />
        <main className="pt-[4.25rem] md:pt-16" style={{ paddingTop: 'max(4.25rem, env(safe-area-inset-top))' }}>
          {children}
        </main>
      </div>
    </ApolloProvider>
  );
}
