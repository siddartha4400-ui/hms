"use client";

import { useEffect } from "react";
import Link from "next/link";
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
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] no-underline mb-4"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-secondary)" }}
        >
          ← Dashboard
        </Link>
      </div>
      <SubsiteDashboardOrganism />
    </div>
  );
}
