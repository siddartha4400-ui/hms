'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { FiBookOpen, FiCalendar, FiFileText, FiHome, FiLayers, FiLogIn, FiMapPin, FiMoon } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { getUserHmsId, getUserRole, getValidAuthToken } from '@/lib/auth-token';
import { isMainSiteHost, resolveHostSubsiteKey } from '@/lib/host-utils';
import { GET_AVAILABLE_ROUTES_QUERY } from '@/project_components/common-routes/graphql/operations';
import { EXPIRE_PENDING_BOOKINGS_MUTATION } from '@/project_components/bookings/graphql/operations';
import { LIST_HMS_QUERY } from '@/project_components/subsites/graphql/operations';

type AvailableRoute = {
  path?: string | null;
  name?: string | null;
  requiresPermission?: string | null;
  visible?: boolean | null;
};

type AvailableRoutesResponse = {
  getAvailableRoutes?: AvailableRoute[] | null;
};

type ExpirePendingBookingsResponse = {
  expirePendingBookings?: {
    success?: boolean | null;
    message?: string | null;
    updatedCount?: number | null;
  } | null;
};

type DashboardTile = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

type HmsListItem = {
  id: number;
  hmsName: string;
};

type HmsListResponse = {
  subsiteBaseDomain?: string | null;
  listHms?: HmsListItem[] | null;
};

export default function DashboardOrganism() {
  const router = useRouter();
  // Always start as loading so server and client render the same HTML (avoids hydration mismatch).
  // The token check runs in useEffect (client-only) and flips isLoading to false.
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');
  const { data: routesData } = useQuery<AvailableRoutesResponse>(GET_AVAILABLE_ROUTES_QUERY, {
    skip: isLoading,
    fetchPolicy: 'cache-first',
  });
  const { data: hmsData, loading: hmsLoading } = useQuery<HmsListResponse>(LIST_HMS_QUERY, {
    skip: isLoading,
    fetchPolicy: 'cache-first',
  });
  const [expirePendingBookings, { loading: expiringPending }] = useMutation<ExpirePendingBookingsResponse>(EXPIRE_PENDING_BOOKINGS_MUTATION);

  useEffect(() => {
    const token = getValidAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setRole(getUserRole());

    setIsLoading(false);
  }, [router]);

  const availableRoutes = routesData?.getAvailableRoutes || [];
  const storedHmsId = getUserHmsId();
  const isSubsiteScopedAdmin = role === 'site_admin' || role === 'site_building_manager';
  const hostName = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const baseDomain = (hmsData?.subsiteBaseDomain || '').trim().toLowerCase();
  const isMainPortalHost = isMainSiteHost(hostName, baseDomain);
  const hostSubsiteKey = resolveHostSubsiteKey(hostName, baseDomain);

  let isCrossSubsiteAdmin = false;
  if (isSubsiteScopedAdmin && !isMainPortalHost) {
    const matchedSubsite = (hmsData?.listHms || []).find((item) => (item.hmsName || '').toLowerCase() === hostSubsiteKey);
    if (!matchedSubsite || !storedHmsId || matchedSubsite.id !== storedHmsId) {
      isCrossSubsiteAdmin = true;
    }
  }

  const effectiveRole = isCrossSubsiteAdmin ? 'normal_user' : role;
  const canAccessAdminDashboard = effectiveRole === 'root_admin' || effectiveRole === 'site_admin' || effectiveRole === 'site_building_manager';

  useEffect(() => {
    if (isLoading || hmsLoading) {
      return;
    }

    if (!canAccessAdminDashboard) {
      router.replace('/');
    }
  }, [canAccessAdminDashboard, hmsLoading, isLoading, router]);

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

  async function runPendingExpirySync() {
    setSyncMessage('');
    setSyncError('');
    try {
      const response = await expirePendingBookings();
      const payload = response.data?.expirePendingBookings;
      if (!payload?.success) {
        setSyncError(payload?.message || 'Unable to run pending expiry sync.');
        return;
      }
      setSyncMessage(payload.message || 'Pending expiry sync completed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to run pending expiry sync.';
      setSyncError(message);
    }
  }

  const tiles: DashboardTile[] = [];

  if (canAccessAdminDashboard) {
    if (role === 'root_admin' || role === 'site_admin' || role === 'site_building_manager') {
      tiles.push({
        title: 'Walk-in Check-ins',
        href: '/dashboard/walkin-bookings',
        icon: <FiLogIn className="h-3 w-3 sm:h-4 sm:w-4" />,
      });
    }

    if (role === 'root_admin' || role === 'site_admin' || role === 'site_building_manager') {
      tiles.push({
        title: 'Booking Operations',
        href: '/dashboard/bookings',
        icon: <FiBookOpen className="h-3 w-3 sm:h-4 sm:w-4" />,
      });
      tiles.push({
        title: 'Monthly Stay',
        href: '/dashboard/monthly-stay-bookings',
        icon: <FiMoon className="h-3 w-3 sm:h-4 sm:w-4" />,
      });
      tiles.push({
        title: 'Monthly Bookings',
        href: '/dashboard/monthly-stay-console',
        icon: <FiCalendar className="h-3 w-3 sm:h-4 sm:w-4" />,
      });
      tiles.push({
        title: 'Invoices',
        href: '/dashboard/income',
        icon: <FiFileText className="h-3 w-3 sm:h-4 sm:w-4" />,
      });
    }

    if (role === 'root_admin' || role === 'site_admin' || role === 'site_building_manager') {
      tiles.push({
        title: 'Buildings & Beds',
        href: '/dashboard/subsite-dashboard',
        icon: <FiHome className="h-3 w-3 sm:h-4 sm:w-4" />,
      });
    }

    if (role === 'root_admin' || availableRoutes.some((route) => route.visible && route.path === '/subsites')) {
      tiles.push({
        title: 'Subsites Management',
        href: '/subsites',
        icon: <FiMapPin className="h-3 w-3 sm:h-4 sm:w-4" />,
      });
    }
  }

  if (tiles.length > 0) {
    const uniqueTiles = tiles.filter((tile, index, array) => array.findIndex((item) => item.href === tile.href) === index);

    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4 md:px-6 md:py-8">
          <div className="rounded-xl border p-3 md:rounded-2xl md:p-6" style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-dim)' }}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] md:text-xs md:tracking-[0.2em]" style={{ color: 'var(--brand-light)' }}>
              Permission Based Dashboard
            </p>
            <h1 className="mt-1 text-base font-semibold leading-tight md:mt-2 md:text-3xl">Property Operations Dashboard</h1>
            <p className="mt-1 text-[11px] leading-snug md:mt-2 md:text-sm" style={{ color: 'var(--text-secondary)' }}>
              Tile access is loaded from your permissions.
            </p>
            {role === 'root_admin' ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void runPendingExpirySync()}
                  disabled={expiringPending}
                  className="rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] md:text-xs"
                  style={{
                    background: 'var(--action-dim)',
                    border: '1px solid var(--action-border)',
                    color: 'var(--action-light)',
                    opacity: expiringPending ? 0.7 : 1,
                  }}
                >
                  {expiringPending ? 'Running...' : 'Run Pending Expiry Sync'}
                </button>
                {syncMessage ? (
                  <span className="text-[10px] md:text-xs" style={{ color: 'var(--positive)' }}>
                    {syncMessage}
                  </span>
                ) : null}
                {syncError ? (
                  <span className="text-[10px] md:text-xs" style={{ color: 'var(--danger)' }}>
                    {syncError}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 sm:mt-6 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {uniqueTiles.map((tile) => (
              <Link
                key={tile.title}
                href={tile.href}
                className="aspect-square w-full rounded-lg border no-underline transition hover:opacity-90 sm:rounded-xl"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', textDecoration: 'none' }}
              >
                <div className="flex h-full flex-col items-center justify-center gap-0.5 p-1 text-center sm:gap-2 sm:p-2.5">
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded sm:h-8 sm:w-8 sm:rounded-lg"
                    style={{ background: 'var(--brand-dim)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}
                  >
                    {tile.icon}
                  </div>
                  <p className="text-[8px] font-semibold leading-tight sm:text-[10.5px]" style={{ textDecoration: 'none' }}>{tile.title}</p>
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
