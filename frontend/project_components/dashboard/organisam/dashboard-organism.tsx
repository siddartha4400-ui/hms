'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiActivity, FiBookOpen, FiDollarSign, FiMap, FiUserPlus } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { getUserRole, getValidAuthToken } from '@/lib/auth-token';
import DashboardMolecule from '../molecule/dashboard-molecule';

// Types
type AlertRow = {
  id: number;
  hotel: string;
  city: string;
  type: 'booking' | 'cancellation' | 'review' | 'maintenance';
  desc: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
};

type HotelRow = {
  id: number;
  name: string;
  city: string;
  stars: number;
  occupancy: number;
  bookingsToday: number;
  revenue: string;
  status: 'active' | 'maintenance' | 'review';
};

type DashboardProfileData = {
  getUserProfile?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  };
};

// Mock Data
const RECENT_ALERTS: AlertRow[] = [
  {
    id: 1,
    hotel: 'Serenity Suites',
    city: 'Mumbai',
    type: 'booking',
    desc: 'Group booking of 14 rooms × 3 nights confirmed. Priority: VIP corporate.',
    time: '4 min ago',
    priority: 'high',
  },
  {
    id: 2,
    hotel: 'Azura Resort',
    city: 'Goa',
    type: 'cancellation',
    desc: '2 deluxe rooms cancelled — automatic refund policy triggered.',
    time: '18 min ago',
    priority: 'medium',
  },
  {
    id: 3,
    hotel: 'Highland Inn',
    city: 'Shimla',
    type: 'review',
    desc: '2-star review posted — flagged for manager response within 24 hrs.',
    time: '41 min ago',
    priority: 'high',
  },
  {
    id: 4,
    hotel: 'Metro Palace',
    city: 'Delhi',
    type: 'maintenance',
    desc: 'Floor-3 HVAC issue reported. Technician dispatched, ETA 35 min.',
    time: '1 hr ago',
    priority: 'medium',
  },
  {
    id: 5,
    hotel: 'The Cove',
    city: 'Kochi',
    type: 'booking',
    desc: 'Honeymoon suite package booked. Concierge notified for special setup.',
    time: '2 hr ago',
    priority: 'low',
  },
];

const TOP_HOTELS: HotelRow[] = [
  {
    id: 1,
    name: 'Serenity Suites',
    city: 'Mumbai',
    stars: 5,
    occupancy: 92,
    bookingsToday: 34,
    revenue: '₹1.8L',
    status: 'active',
  },
  {
    id: 2,
    name: 'Azura Resort',
    city: 'Goa',
    stars: 4,
    occupancy: 88,
    bookingsToday: 29,
    revenue: '₹1.4L',
    status: 'active',
  },
  {
    id: 3,
    name: 'Metro Palace',
    city: 'Delhi',
    stars: 4,
    occupancy: 76,
    bookingsToday: 21,
    revenue: '₹98K',
    status: 'active',
  },
  {
    id: 4,
    name: 'Highland Inn',
    city: 'Shimla',
    stars: 3,
    occupancy: 61,
    bookingsToday: 14,
    revenue: '₹52K',
    status: 'maintenance',
  },
  {
    id: 5,
    name: 'The Cove',
    city: 'Kochi',
    stars: 4,
    occupancy: 84,
    bookingsToday: 18,
    revenue: '₹74K',
    status: 'active',
  },
];

export default function DashboardOrganism() {
  const router = useRouter();
  // Always start as loading so server and client render the same HTML (avoids hydration mismatch).
  // The token check runs in useEffect (client-only) and flips isLoading to false.
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'alerts' | 'hotels'>('alerts');

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

  if (role === 'site_admin' || role === 'site_building_manager') {
    const tiles: Array<{ title: string; href: string; icon: React.ReactNode }> = [
      {
        title: 'Walk-in Bookings',
        href: '/dashboard/walkin-bookings',
        icon: <FiUserPlus className="h-4 w-4" />,
      },
      {
        title: 'Bookings Console',
        href: '/dashboard/bookings',
        icon: <FiBookOpen className="h-4 w-4" />,
      },
      {
        title: 'Overstay Monitor',
        href: '/dashboard/overstay-bookings',
        icon: <FiActivity className="h-4 w-4" />,
      },
      {
        title: 'Subsite Dashboard',
        href: '/dashboard/subsite-dashboard',
        icon: <FiMap className="h-4 w-4" />,
      },
      {
        title: 'Income',
        href: '/dashboard/income',
        icon: <FiDollarSign className="h-4 w-4" />,
      },
    ];

    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-dim)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-light)' }}>
              Site Admin Control Center
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Property Operations Dashboard</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Quick access to booking and property tools without unrelated global analytics.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {tiles.map((tile) => (
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

  return (
    <DashboardMolecule
      activeTab={activeTab}
      onTabChange={setActiveTab}
      alerts={RECENT_ALERTS}
      hotels={TOP_HOTELS}
    />
  );
}
