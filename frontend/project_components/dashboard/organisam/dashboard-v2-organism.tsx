'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { FiBookOpen, FiCalendar, FiFileText, FiHome, FiLayers, FiLogIn, FiMapPin, FiMoon } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { getUserHmsId, getUserRole, getValidAuthToken } from '@/lib/auth-token';
import { GET_AVAILABLE_ROUTES_QUERY } from '@/project_components/common-routes/graphql/operations';
import { EXPIRE_PENDING_BOOKINGS_MUTATION } from '@/project_components/bookings/graphql/operations';
import { LIST_HMS_QUERY } from '@/project_components/subsites/graphql/operations';
import styles from './dashboard-v2.module.css';

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

function resolveHostSubsiteKey(hostName: string, baseDomain: string): string | null {
  const host = (hostName || '').trim().toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  if (baseDomain && host.endsWith(`.${baseDomain}`)) {
    const leftPart = host.slice(0, -(`.${baseDomain}`).length);
    const candidate = leftPart.split('.')[0]?.trim().toLowerCase();
    if (!candidate || candidate === 'www' || candidate === 'backend') {
      return null;
    }
    return candidate;
  }

  const parts = host.split('.').filter(Boolean);
  if (parts.length >= 3) {
    const candidate = parts[0]?.trim().toLowerCase();
    if (!candidate || candidate === 'www' || candidate === 'backend') {
      return null;
    }
    return candidate;
  }

  return null;
}

export default function DashboardV2Organism() {
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
  const configuredBaseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || '').trim().toLowerCase();
  const effectiveBaseDomain = (baseDomain || configuredBaseDomain).trim().toLowerCase();
  const isMainSiteHost = effectiveBaseDomain
    ? hostName === effectiveBaseDomain || hostName === `www.${effectiveBaseDomain}`
    : hostName === 'localhost' || hostName === '127.0.0.1';
  const hostSubsiteKey = resolveHostSubsiteKey(hostName, effectiveBaseDomain);

  let isCrossSubsiteAdmin = false;
  if (isSubsiteScopedAdmin && !isMainSiteHost) {
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
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Loading</span>
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

    tiles.push({
      title: 'Back to Dashboard',
      href: '/dashboard',
      icon: <FiLayers className="h-3 w-3 sm:h-4 sm:w-4" />,
    });
  }

  if (tiles.length > 0) {
    const uniqueTiles = tiles.filter((tile, index, array) => array.findIndex((item) => item.href === tile.href) === index);

    return (
      <div className={styles.dashboardShell}>
        <main className={styles.dashboardMain}>
          <div className={styles.headerCard}>
            <p className={styles.eyebrowText}>
              Permission Based Dashboard V2
            </p>
            <h1 className={styles.headerTitle}>Property Operations Dashboard (V2)</h1>
            <p className={styles.headerSubtitle}>
              Tile access is loaded from your permissions.
            </p>
            {role === 'root_admin' ? (
              <div className={styles.actionControls}>
                <button
                  type="button"
                  onClick={() => void runPendingExpirySync()}
                  disabled={expiringPending}
                  className={styles.actionButton}
                >
                  {expiringPending ? 'Running...' : 'Run Pending Expiry Sync'}
                </button>
                {syncMessage ? (
                  <span className="text-[10px] md:text-xs font-medium" style={{ color: 'var(--positive)' }}>
                    {syncMessage}
                  </span>
                ) : null}
                {syncError ? (
                  <span className="text-[10px] md:text-xs font-medium" style={{ color: 'var(--danger)' }}>
                    {syncError}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={styles.tilesGrid}>
            {uniqueTiles.map((tile) => (
              <Link
                key={tile.title}
                href={tile.href}
                className={styles.tileLink}
              >
                <div className={styles.tileContent}>
                  <div className={styles.tileIconWrapper}>
                    {tile.icon}
                  </div>
                  <p className={styles.tileTitle}>{tile.title}</p>
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