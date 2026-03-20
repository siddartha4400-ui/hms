"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApolloProvider } from "@apollo/client/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import apolloClient from "../lib/apollo";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(false);

  const publicRoutes = useMemo(
    () => new Set(["/", "/login", "/signup", "/forgot-password", "/reset-password"]),
    [],
  );

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const isPublicRoute =
      publicRoutes.has(pathname) ||
      pathname.startsWith("/reset-password");

    if (!token && !isPublicRoute) {
      router.replace("/login");
      setAuthReady(true);
      return;
    }

    if (token && (pathname === "/login" || pathname === "/signup")) {
      router.replace("/dashboard");
      setAuthReady(true);
      return;
    }

    setAuthReady(true);
  }, [pathname, publicRoutes, router]);

  if (!authReady) {
    return (
      <ApolloProvider client={apolloClient}>
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
          <div className="flex items-center gap-3 text-sm tracking-wide uppercase">
            <span className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-amber-400 animate-spin" />
            Checking session
          </div>
        </div>
      </ApolloProvider>
    );
  }
  
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
