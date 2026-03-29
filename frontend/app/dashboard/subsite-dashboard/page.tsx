"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

import SubsiteDashboardOrganism from "@/project_components/propertys/organisam/subsite-dashboard-organism";
import { getUserRole, getValidAuthToken } from "@/lib/auth-token";

export default function DashboardSubsitePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getValidAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const role = getUserRole();
    const allowed =
      role === "root_admin" || role === "site_admin" || role === "site_building_manager";
    if (!allowed) {
      router.replace("/dashboard");
      return;
    }
  }, [router]);

  return (
    <div>
      <Suspense fallback={<div className="p-4 text-sm">Loading dashboard...</div>}>
        <SubsiteDashboardOrganism />
      </Suspense>
    </div>
  );
}
