'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { FiActivity, FiBookOpen, FiCalendar, FiDollarSign, FiLayers, FiMap, FiMoon, FiUserPlus } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { getUserRole, getValidAuthToken } from '@/lib/auth-token';
import { GET_AVAILABLE_ROUTES_QUERY } from '@/project_components/common-routes/graphql/operations';

type AvailableRoute = {
  path?: string | null;
  name?: string | null;
  requiresPermission?: string | null;
  visible?: boolean | null;
};

type AvailableRoutesResponse = {
  getAvailableRoutes?: AvailableRoute[] | null;
};

type DashboardTile = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

export default function DashboardOrganism() {
  const router = useRouter();
  // Always start as loading so server and client render the same HTML (avoids hydration mismatch).
  // The token check runs in useEffect (client-only) and flips isLoading to false.
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const { data: routesData } = useQuery<AvailableRoutesResponse>(GET_AVAILABLE_ROUTES_QUERY, {
    skip: isLoading,
    fetchPolicy: 'cache-first',
  });

  useEffect(() => {
    const token = getValidAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setRole(getUserRole());

    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--brand-dim)', borderTopColor: 'var(--brand)' }}
          />
          <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Loading
          </span>
        </div>
      </div>
    );
  }

  const availableRoutes = routesData?.getAvailableRoutes || [];
  const canAccessAdminDashboard = role === 'root_admin' || role === 'site_admin' || role === 'site_building_manager';

  const tiles: DashboardTile[] = [];

  if (canAccessAdminDashboard) {
    if (role === 'root_admin' || role === 'site_admin' || role === 'site_building_manager') {
      tiles.push({
        title: 'Walk-in Bookings',
        href: '/dashboard/walkin-bookings',
        icon: <FiUserPlus className="h-4 w-4" />,
      });
    }

    if (role === 'root_admin' || role === 'site_admin' || role === 'site_building_manager') {
      tiles.push({
        title: 'Short-Stay Console',
        href: '/dashboard/bookings',
        icon: <FiBookOpen className="h-4 w-4" />,
      });
      tiles.push({
        title: 'Overstay Monitor',
        href: '/dashboard/overstay-bookings',
        icon: <FiActivity className="h-4 w-4" />,
      });
      tiles.push({
        title: 'Monthly Stay',
        href: '/dashboard/monthly-stay-bookings',
        icon: <FiMoon className="h-4 w-4" />,
      });
      tiles.push({
        title: 'Monthly Console',
        href: '/dashboard/monthly-stay-console',
        icon: <FiCalendar className="h-4 w-4" />,
      });
      tiles.push({
        title: 'Income',
        href: '/dashboard/income',
        icon: <FiDollarSign className="h-4 w-4" />,
      });
    }

    if (role === 'root_admin' || role === 'site_admin' || role === 'site_building_manager') {
      tiles.push({
        title: 'Subsite Dashboard',
        href: '/dashboard/subsite-dashboard',
        icon: <FiMap className="h-4 w-4" />,
      });
    }

    if (role === 'root_admin' || availableRoutes.some((route) => route.visible && route.path === '/subsites')) {
      tiles.push({
        title: 'Manage Subsites',
        href: '/subsites',
        icon: <FiLayers className="h-4 w-4" />,
      });
    }
  }

  if (tiles.length > 0) {
    const uniqueTiles = tiles.filter((tile, index, array) => array.findIndex((item) => item.href === tile.href) === index);

    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-dim)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-light)' }}>
              Permission Based Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Property Operations Dashboard</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Tile access is loaded from your current permissions. Extra options appear automatically when your account has access.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {uniqueTiles.map((tile) => (
              <Link
                key={tile.title}
                href={tile.href}
                className="aspect-square rounded-xl border no-underline transition hover:opacity-90"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', textDecoration: 'none', width: '7.2rem', height: '7.2rem' }}
              >
                <div className="flex h-full flex-col items-center justify-center gap-2 p-2.5 text-center">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'var(--brand-dim)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}
                  >
                    {tile.icon}
                  </div>
                  <p className="text-[10px] font-semibold uppercase leading-tight tracking-[0.08em]" style={{ textDecoration: 'none' }}>{tile.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return null;
}
