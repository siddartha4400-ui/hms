"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import CityManagementOrganism from '@/project_components/propertys/organisam/city-management-organism';
import { getUserRole, getValidAuthToken } from '@/lib/auth-token';

export default function CitiesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = React.useState(false);

  React.useEffect(() => {
    const token = getValidAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const role = getUserRole();
    if (role !== 'root_admin') {
      router.replace('/dashboard');
      return;
    }

    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return null;
  }

  return <CityManagementOrganism />;
}
