'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  PROFILE_AVATAR_UPDATED_EVENT,
  getInitials,
  readStoredProfileIdentity,
  syncProfileIdentity,
} from '@/lib/profile-avatar';
import { getValidAuthToken } from '@/lib/auth-token';
import { GET_USER_PROFILE_QUERY } from '@/project_components/common-routes/graphql/operations';
import { LOGOUT_MUTATION } from '@/project_components/login/graphql/operations';
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
  const [isLoading, setIsLoading] = useState(() => !getValidAuthToken());
  const [activeTab, setActiveTab] = useState<'alerts' | 'hotels'>('alerts');
  const [profileIdentity, setProfileIdentity] = useState(readStoredProfileIdentity());
  const { data: profileData } = useQuery<DashboardProfileData>(GET_USER_PROFILE_QUERY, {
    skip: isLoading,
  });
  const [logoutMutation, { loading: logoutLoading }] = useMutation(LOGOUT_MUTATION);

  useEffect(() => {
    const token = getValidAuthToken();
    if (!token) {
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const profile = profileData?.getUserProfile;
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
  }, [profileData]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfileIdentity(readStoredProfileIdentity());
    };

    window.addEventListener(PROFILE_AVATAR_UPDATED_EVENT, handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener(PROFILE_AVATAR_UPDATED_EVENT, handleProfileUpdate as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        await logoutMutation({ variables: { refreshToken } });
      } catch {
        // Continue with logout even if mutation fails
      }
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    router.replace('/login');
  };

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

  return (
    <DashboardMolecule
      activeTab={activeTab}
      onTabChange={setActiveTab}
      alerts={RECENT_ALERTS}
      hotels={TOP_HOTELS}
      avatarUrl={profileIdentity.avatarUrl}
      avatarInitials={getInitials(profileIdentity.firstName, profileIdentity.lastName, profileIdentity.email)}
      logoutLoading={logoutLoading}
      onLogout={handleLogout}
    />
  );
}
