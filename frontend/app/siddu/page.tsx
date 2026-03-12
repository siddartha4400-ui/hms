"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidduorganisam from "../../project_components/siddu/sidduorganisam";

export default function Siddumolecule() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // Not logged in → redirect to login
        router.replace("/login");
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
    } catch (err) {
      // If access to localStorage fails, redirect to login as a safe default
      router.replace("/login");
      setAuthorized(false);
    }
  }, [router]);

  if (authorized === null) {
    // still determining auth status
    return <div>Checking authentication…</div>;
  }

  if (!authorized) return null; // redirecting

  return <Sidduorganisam />;
}