"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Routes that manage their own nav/chrome (full-screen pass-through)
  const isFullScreenRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/dashboard");

  if (isFullScreenRoute) {
    return (
      <div className="bg-slate-950 min-h-screen text-slate-50 selection:bg-amber-500/30">
        {children}
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-slate-50 selection:bg-amber-500/30">
      <Header />
      <main className="pt-20 pb-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
