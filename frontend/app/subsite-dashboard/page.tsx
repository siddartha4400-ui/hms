"use client";

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getValidAuthToken } from '@/lib/auth-token';
import SubsiteDashboardOrganism from '@/project_components/propertys/organisam/subsite-dashboard-organism';

export default function SubsiteDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getValidAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const role = localStorage.getItem('userRole');
    const allowed = role === 'root_admin' || role === 'site_admin' || role === 'site_building_manager';
    if (!allowed) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <Suspense fallback={<div className="p-4 text-sm">Loading dashboard...</div>}>
      <SubsiteDashboardOrganism />
    </Suspense>
  );
}
