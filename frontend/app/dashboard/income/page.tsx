"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import IncomeOrganism from "@/project_components/bookings/organisam/income-organism";
import { getUserRole, getValidAuthToken } from "@/lib/auth-token";

export default function IncomePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = getValidAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const role = getUserRole();
    const isAdmin =
      role === "root_admin" || role === "site_admin" || role === "site_building_manager";
    if (!isAdmin) {
      router.replace("/my-bookings");
      return;
    }

    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return null;
  }

  return (
    <div>
      <IncomeOrganism />
    </div>
  );
}
