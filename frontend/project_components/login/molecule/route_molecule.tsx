import React from "react";
import { FiUser, FiLock, FiLogIn, FiLayers } from "react-icons/fi";
import ThemeToggle from "@/components/ThemeToggle";

type Props = {
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string;
  handleLogin: (e: React.FormEvent) => void;
};

export default function RouteMolecule({
  username,
  setUsername,
  password,
  setPassword,
  error,
  handleLogin,
}: Props) {
  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center overflow-hidden text-sm"
      style={{ background: "var(--bg-base)" }}
    >
      {/* ── Theme toggle — floating top-right ─────────────────────────── */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle compact />
      </div>
      {/* ── Background: hotel aerial photo + layered gradients ──────────── */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2200&auto=format&fit=crop')",
          opacity: 0.18,
        }}
      />
      {/* Dark navy overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--bg-base) 97%, transparent) 0%, color-mix(in srgb, var(--bg-surface) 90%, transparent) 60%, rgba(6,182,212,0.06) 100%)",
        }}
      />
      {/* Subtle diagonal grid */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(6,182,212,0.06) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Ambient cyan orb top-right */}
      <div
        className="absolute top-0 right-0 w-96 h-96 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 80% 20%, rgba(6,182,212,0.10) 0%, transparent 70%)",
        }}
      />
      {/* Ambient orange orb bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-80 h-80 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 80%, rgba(249,115,22,0.08) 0%, transparent 65%)",
        }}
      />

      {/* ── Left panel — platform stats (desktop only) ────────────────── */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 z-10 hidden xl:flex flex-col gap-4 max-w-[200px]">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <FiLayers style={{ color: "var(--brand)" }} className="text-base" />
            <span
              className="text-base font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              HotelSphere
            </span>
          </div>
          <p
            className="text-[10px] uppercase tracking-[.2em]"
            style={{ color: "var(--text-muted)" }}
          >
            Hospitality Platform
          </p>
        </div>

        {[
          { label: "Hotels Listed",   value: "240+", color: "var(--brand)"   },
          { label: "Cities Covered",  value: "38",   color: "var(--action)"  },
          { label: "Bookings Today",  value: "1,842",color: "var(--positive)"},
          { label: "Guest Satisfaction", value: "4.6★", color: "var(--warning)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-xl px-4 py-3"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="text-lg font-bold leading-none"
              style={{ color: stat.color }}
            >
              {stat.value}
            </span>
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Login Card ────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[380px] mx-4 animate-fade-in-up">
        {/* Top accent line */}
        <div
          className="h-[2px] w-full rounded-t-2xl"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--brand), var(--action), transparent)",
          }}
        />

        <div
          className="rounded-b-2xl rounded-t-none px-8 py-8"
          style={{
            background: "var(--bg-glass)",
            backdropFilter: "blur(24px)",
            border: "1px solid var(--border)",
            borderTop: "none",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(6,182,212,0.05)",
          }}
        >
          {/* Brand header */}
          <div className="mb-8 text-center">
            <div
              className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: "var(--brand-dim)",
                border: "1px solid var(--brand-border)",
              }}
            >
              <FiLayers style={{ color: "var(--brand)" }} className="text-xl" />
            </div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              HotelSphere
            </h1>
            <p
              className="text-[10px] mt-1 uppercase tracking-[.2em]"
              style={{ color: "var(--text-muted)" }}
            >
              Management Portal
            </p>
          </div>

          {/* Role tabs */}
          <div
            className="flex p-1 rounded-lg mb-6 gap-1"
            style={{ background: "var(--bg-chip)", border: "1px solid var(--border)" }}
          >
            {["Admin", "Manager", "Staff"].map((role, i) => (
              <button
                key={role}
                type="button"
                className="flex-1 py-1.5 rounded-md text-[10px] uppercase tracking-widest transition-all duration-200"
                style={
                  i === 0
                    ? {
                        background: "var(--brand-dim)",
                        color: "var(--brand-light)",
                        border: "1px solid var(--brand-border)",
                      }
                    : { color: "var(--text-muted)" }
                }
              >
                {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            {/* Username */}
            <div className="relative group">
              <FiUser
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none transition-colors"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                id="login-username"
                type="text"
                placeholder="Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid var(--brand-border)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-dim)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <FiLock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                id="login-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid var(--brand-border)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-dim)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-[11px] transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div
                className="rounded-lg p-3 text-xs text-center animate-fade-in"
                style={{
                  background: "var(--action-dim)",
                  border: "1px solid var(--action-border)",
                  color: "var(--danger)",
                }}
              >
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              className="mt-2 w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 group"
              style={{
                background: "linear-gradient(135deg, var(--action), var(--action-light))",
                color: "#fff",
                boxShadow: "0 4px 20px var(--action-dim)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
                e.currentTarget.style.boxShadow = "0 6px 28px var(--action-dim)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "";
                e.currentTarget.style.boxShadow = "0 4px 20px var(--action-dim)";
              }}
            >
              <span>Sign In to Platform</span>
              <FiLogIn className="text-sm group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Demo hint */}
          <div
            className="mt-6 pt-5 text-center"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
              Demo Access
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              Username:{" "}
              <code
                className="font-mono px-1.5 py-0.5 rounded text-xs"
                style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
              >
                admin
              </code>{" "}
              · Password:{" "}
              <code
                className="font-mono px-1.5 py-0.5 rounded text-xs"
                style={{ background: "var(--brand-dim)", color: "var(--brand)" }}
              >
                admin
              </code>
            </p>
          </div>
        </div>

        <p
          className="text-center text-[10px] mt-5 uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Trusted by 120+ hotel groups across India
        </p>
      </div>
    </div>
  );
}
