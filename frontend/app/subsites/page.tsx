'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getValidAuthToken } from '@/lib/auth-token';
import SubsitesOrganism from '@/project_components/subsites/organisam/subsites-organism';

export default function SubsitesPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getValidAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const role = localStorage.getItem('userRole');
    if (role !== 'root_admin') {
      router.replace('/dashboard');
    }
  }, [router]);

  return <SubsitesOrganism />;
}
