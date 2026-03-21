"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApolloProvider } from "@apollo/client/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import apolloClient from "../lib/apollo";
import { getValidAuthToken } from "../lib/auth-token";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = useMemo(
    () => new Set(["/", "/login", "/signup", "/forgot-password", "/reset-password"]),
    [],
  );

  useEffect(() => {
    const token = getValidAuthToken();
    const isPublicRoute =
      publicRoutes.has(pathname) ||
      pathname.startsWith("/reset-password");

    if (!token && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    if (token && (pathname === "/login" || pathname === "/signup")) {
      router.replace("/dashboard");
    }
  }, [pathname, publicRoutes, router]);
  
  // Routes that manage their own nav/chrome (full-screen pass-through)
  const isFullScreenRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/dashboard");

  if (isFullScreenRoute) {
    return (
      <ApolloProvider client={apolloClient}>
        <div className="bg-slate-950 min-h-screen text-slate-50 selection:bg-amber-500/30">
          {children}
        </div>
      </ApolloProvider>
    );
  }

  return (
    <ApolloProvider client={apolloClient}>
      <div className="bg-slate-950 min-h-screen text-slate-50 selection:bg-amber-500/30">
        <Header />
        <main className="pt-20 pb-20">
          {children}
        </main>
        <Footer />
      </div>
    </ApolloProvider>
  );
}
