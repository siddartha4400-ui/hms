"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiHome, FiCalendar, FiUsers, FiTrendingUp,
  FiAlertCircle, FiStar, FiMapPin, FiCheckCircle,
  FiClock, FiArrowUpRight, FiArrowDownRight, FiLayers,
  FiBarChart2, FiShield, FiZap,
} from "react-icons/fi";
import ThemeToggle from "@/components/ThemeToggle";

// ─── Types ────────────────────────────────────────────────────────────────────
type AlertRow = {
  id: number; hotel: string; city: string;
  type: "booking" | "cancellation" | "review" | "maintenance";
  desc: string; time: string; priority: "high" | "medium" | "low";
};
type HotelRow = {
  id: number; name: string; city: string; stars: number;
  occupancy: number; bookingsToday: number; revenue: string;
  status: "active" | "maintenance" | "review";
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const RECENT_ALERTS: AlertRow[] = [
  { id: 1, hotel: "Serenity Suites", city: "Mumbai",  type: "booking",      desc: "Group booking of 14 rooms × 3 nights confirmed. Priority: VIP corporate.",  time: "4 min ago",  priority: "high"   },
  { id: 2, hotel: "Azura Resort",    city: "Goa",     type: "cancellation", desc: "2 deluxe rooms cancelled — automatic refund policy triggered.",            time: "18 min ago", priority: "medium" },
  { id: 3, hotel: "Highland Inn",    city: "Shimla",  type: "review",       desc: "2-star review posted — flagged for manager response within 24 hrs.",       time: "41 min ago", priority: "high"   },
  { id: 4, hotel: "Metro Palace",    city: "Delhi",   type: "maintenance",  desc: "Floor-3 HVAC issue reported. Technician dispatched, ETA 35 min.",          time: "1 hr ago",   priority: "medium" },
  { id: 5, hotel: "The Cove",        city: "Kochi",   type: "booking",      desc: "Honeymoon suite package booked. Concierge notified for special setup.",    time: "2 hr ago",   priority: "low"    },
];

const TOP_HOTELS: HotelRow[] = [
  { id: 1, name: "Serenity Suites", city: "Mumbai", stars: 5, occupancy: 92, bookingsToday: 34, revenue: "₹1.8L", status: "active"      },
  { id: 2, name: "Azura Resort",    city: "Goa",    stars: 4, occupancy: 88, bookingsToday: 29, revenue: "₹1.4L", status: "active"      },
  { id: 3, name: "Metro Palace",    city: "Delhi",  stars: 4, occupancy: 76, bookingsToday: 21, revenue: "₹98K",  status: "active"      },
  { id: 4, name: "Highland Inn",    city: "Shimla", stars: 3, occupancy: 61, bookingsToday: 14, revenue: "₹52K",  status: "maintenance" },
  { id: 5, name: "The Cove",        city: "Kochi",  stars: 4, occupancy: 84, bookingsToday: 18, revenue: "₹74K",  status: "active"      },
];

// ─── Alert / Status styles ────────────────────────────────────────────────────
const ALERT_CHIP: Record<AlertRow["type"], { bg: string; text: string; border: string; label: string }> = {
  booking:      { bg: "rgba(16,185,129,0.10)", text: "#34d399", border: "rgba(16,185,129,0.25)", label: "Booking"      },
  cancellation: { bg: "rgba(239,68,68,0.10)",  text: "#f87171", border: "rgba(239,68,68,0.25)",  label: "Cancellation" },
  review:       { bg: "rgba(245,158,11,0.10)", text: "#fbbf24", border: "rgba(245,158,11,0.25)", label: "Review"       },
  maintenance:  { bg: "rgba(6,182,212,0.10)",  text: "#22d3ee", border: "rgba(6,182,212,0.25)",  label: "Maintenance"  },
};

const PRIORITY_DOT: Record<AlertRow["priority"], string> = {
  high:   "#ef4444",
  medium: "#f59e0b",
  low:    "#10b981",
};

const STATUS_CHIP: Record<HotelRow["status"], { bg: string; text: string; border: string; label: string }> = {
  active:      { bg: "rgba(16,185,129,0.10)", text: "#34d399", border: "rgba(16,185,129,0.25)", label: "Active"      },
  maintenance: { bg: "rgba(245,158,11,0.10)", text: "#fbbf24", border: "rgba(245,158,11,0.25)", label: "Maintenance" },
  review:      { bg: "rgba(148,163,184,0.10)",text: "#94a3b8", border: "rgba(148,163,184,0.20)",label: "Under Review" },
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon, label, value, sub, delta, positive,
  accentBg, accentColor,
}: {
  icon: React.ReactNode;
  label: string; value: string; sub: string;
  delta: string; positive: boolean;
  accentBg: string; accentColor: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden group transition-all duration-300"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${accentColor}30`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.border = "1px solid var(--border)"; }}
    >
      {/* Ambient corner glow on hover */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)` }}
      />

      <div className="flex justify-between items-start mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: accentBg, border: `1px solid ${accentColor}25` }}
        >
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
        <span
          className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: positive ? "var(--positive)" : "var(--danger)" }}
        >
          {positive
            ? <FiArrowUpRight className="text-xs" />
            : <FiArrowDownRight className="text-xs" />}
          {delta}
        </span>
      </div>

      <p className="text-[10px] uppercase tracking-[.18em] mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <h2 className="text-[28px] font-bold leading-none tracking-tight" style={{ color: "var(--text-primary)" }}>{value}</h2>
      <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>{sub}</p>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"alerts" | "hotels">("alerts");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); }
    else { setIsLoading(false); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--brand-dim)", borderTopColor: "var(--brand)" }}
          />
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Loading</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>

      {/* ── Top Navbar ────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 px-6 py-3 flex justify-between items-center"
        style={{
          background: "var(--bg-navbar)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Brand */}
        <a href="/dashboard" className="flex items-center gap-2.5 no-underline group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{
              background: "var(--brand-dim)",
              border: "1px solid var(--brand-border)",
            }}
          >
            <FiLayers style={{ color: "var(--brand)" }} className="text-sm" />
          </div>
          <div className="leading-none">
            <span className="block text-sm font-bold" style={{ color: "var(--text-primary)" }}>HotelSphere</span>
            <span className="block text-[9px] uppercase tracking-[.2em]" style={{ color: "var(--text-muted)" }}>Management Platform</span>
          </div>
        </a>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-7">
          {["Overview", "Properties", "Bookings", "Customers", "Analytics"].map((item, i) => (
            <a
              key={item}
              href="#"
              className="text-[11px] uppercase tracking-widest no-underline transition-colors"
              style={{ color: i === 0 ? "var(--brand)" : "var(--text-muted)" }}
              onMouseEnter={(e) => { if (i !== 0) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { if (i !== 0) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)"; }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle compact />
          <button
            id="dashboard-logout"
            onClick={handleLogout}
            className="text-[11px] uppercase tracking-widest rounded-lg px-4 py-1.5 transition-all duration-200"
            style={{
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--brand)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-border)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            }}
          >
            Sign Out
          </button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all"
            style={{
              background: "var(--brand-dim)",
              border: "1px solid var(--brand-border)",
              color: "var(--brand)",
            }}
          >
            AD
          </div>
        </div>
      </header>

      {/* ── Page Content ──────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Hero section ─────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(249,115,22,0.06) 100%)",
            border: "1px solid var(--brand-border)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 80% 20%, rgba(249,115,22,0.10) 0%, transparent 65%)",
            }}
          />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full animate-pulse-dot"
                  style={{ background: "var(--positive)" }}
                />
                <span className="text-[10px] uppercase tracking-[.3em]" style={{ color: "var(--positive)" }}>
                  All Systems Operational
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Operations Dashboard
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Real-time overview across{" "}
                <span style={{ color: "var(--brand)" }} className="font-semibold">240 properties</span>
                {" "}in{" "}
                <span style={{ color: "var(--action)" }} className="font-semibold">38 cities</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                className="text-[11px] uppercase tracking-widest rounded-xl px-5 py-2.5 transition-all font-medium"
                style={{ border: "1px solid var(--brand-border)", color: "var(--brand)", background: "var(--brand-dim)" }}
              >
                Export Report
              </button>
              <button
                className="text-[11px] uppercase tracking-widest rounded-xl px-5 py-2.5 font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg, var(--action), var(--action-light))",
                  color: "#fff",
                  boxShadow: "0 4px 16px var(--action-dim)",
                }}
              >
                + Add Property
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<FiHome className="text-base" />}       label="Properties Listed"  value="240"    sub="Across 38 cities in India"       delta="+8 this month" positive accentBg="var(--brand-dim)"                   accentColor="var(--brand)"    />
          <KpiCard icon={<FiCalendar className="text-base" />}   label="Bookings Today"     value="1,842"  sub="Up from 1,629 yesterday"         delta="+13.1%"        positive accentBg="rgba(249,115,22,0.12)"             accentColor="var(--action)"   />
          <KpiCard icon={<FiTrendingUp className="text-base" />} label="Platform Revenue"   value="₹42.6L" sub="Gross across all hotels today"   delta="+9.4% vs LW"   positive accentBg="rgba(16,185,129,0.10)"            accentColor="var(--positive)" />
          <KpiCard icon={<FiUsers className="text-base" />}      label="Active Guests"      value="6,311"  sub="Currently checked in platform-wide" delta="-2.1% vs LW" positive={false} accentBg="rgba(239,68,68,0.10)"    accentColor="var(--danger)"   />
        </div>

        {/* ── Secondary metrics strip ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Avg Occupancy",     value: "74%",   color: "var(--brand)",    icon: <FiBarChart2 /> },
            { label: "Avg Guest Rating",  value: "4.2 ★", color: "var(--warning)",  icon: <FiStar />      },
            { label: "Cancellations",     value: "134",   color: "var(--danger)",   icon: <FiZap />       },
            { label: "Pending Reviews",   value: "28",    color: "var(--action)",   icon: <FiShield />    },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl p-4 text-center transition-all duration-200"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.border = "1px solid var(--border-strong)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.border = "1px solid var(--border)"; }}
            >
              <div className="flex justify-center mb-2" style={{ color: m.color, opacity: 0.7 }}>{m.icon}</div>
              <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{m.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Panel ─────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}
        >
          {/* Tab Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}
          >
            <div
              className="flex gap-1 p-1 rounded-lg"
              style={{ background: "var(--bg-chip)", border: "1px solid var(--border)" }}
            >
              {(["alerts", "hotels"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 py-1.5 rounded-md text-[11px] uppercase tracking-widest transition-all duration-200"
                  style={
                    activeTab === tab
                      ? { background: "var(--brand-dim)", color: "var(--brand-light)", border: "1px solid var(--brand-border)" }
                      : { color: "var(--text-muted)", border: "1px solid transparent" }
                  }
                >
                  {tab === "alerts" ? "Live Alerts" : "Top Properties"}
                </button>
              ))}
            </div>
            <button
              className="text-[11px] uppercase tracking-widest transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              View All →
            </button>
          </div>

          {/* Live Alerts */}
          {activeTab === "alerts" && (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {RECENT_ALERTS.map((alert) => {
                const chip = ALERT_CHIP[alert.type];
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-4 px-6 py-4 transition-colors"
                    style={{ cursor: "default" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ""; }}
                  >
                    {/* Priority dot */}
                    <div
                      className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                      style={{ background: PRIORITY_DOT[alert.priority], boxShadow: `0 0 8px ${PRIORITY_DOT[alert.priority]}80` }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className="text-[9px] uppercase tracking-widest rounded px-2 py-0.5"
                          style={{ background: chip.bg, color: chip.text, border: `1px solid ${chip.border}` }}
                        >
                          {chip.label}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{alert.hotel}</span>
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                          <FiMapPin className="text-[9px]" /> {alert.city}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{alert.desc}</p>
                    </div>

                    <span className="shrink-0 text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                      <FiClock className="text-[9px]" /> {alert.time}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top Properties table */}
          {activeTab === "hotels" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Property", "City", "Stars", "Occupancy", "Bookings", "Revenue", "Status"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-[9px] uppercase tracking-widest font-normal"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TOP_HOTELS.map((hotel) => {
                    const chip = STATUS_CHIP[hotel.status];
                    return (
                      <tr
                        key={hotel.id}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-elevated)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
                      >
                        <td className="px-6 py-3.5 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{hotel.name}</td>
                        <td className="px-6 py-3.5">
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                            <FiMapPin className="text-[9px]" /> {hotel.city}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="flex gap-0.5">
                            {Array.from({ length: hotel.stars }).map((_, i) => (
                              <FiStar key={i} className="text-[9px]" style={{ color: "var(--warning)", fill: "var(--warning)" }} />
                            ))}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="occ-bar-track">
                              <div className="occ-bar-fill" style={{ width: `${hotel.occupancy}%` }} />
                            </div>
                            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{hotel.occupancy}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>{hotel.bookingsToday}</td>
                        <td className="px-6 py-3.5 text-[11px] font-semibold" style={{ color: "var(--positive)" }}>{hotel.revenue}</td>
                        <td className="px-6 py-3.5">
                          <span
                            className="text-[9px] uppercase tracking-wider rounded px-2 py-0.5 flex items-center gap-1 w-fit"
                            style={{ background: chip.bg, color: chip.text, border: `1px solid ${chip.border}` }}
                          >
                            {hotel.status === "active" && <FiCheckCircle className="text-[8px]" />}
                            {hotel.status === "maintenance" && <FiAlertCircle className="text-[8px]" />}
                            {chip.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Quick Action Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <FiAlertCircle className="text-base" />,
              title: "Pending Disputes",
              count: "7 open cases",
              desc: "Booking disputes requiring manager review or guest refund decision.",
              accentColor: "var(--danger)",
              accentBg: "rgba(239,68,68,0.10)",
              accentBorder: "rgba(239,68,68,0.20)",
            },
            {
              icon: <FiCheckCircle className="text-base" />,
              title: "Onboarding Queue",
              count: "12 properties",
              desc: "New hotel listings pending document verification and live approval.",
              accentColor: "var(--positive)",
              accentBg: "rgba(16,185,129,0.10)",
              accentBorder: "rgba(16,185,129,0.20)",
            },
            {
              icon: <FiStar className="text-base" />,
              title: "Unanswered Reviews",
              count: "28 reviews",
              desc: "Guest reviews across 9 properties — 5 are low-rated and urgent.",
              accentColor: "var(--action)",
              accentBg: "rgba(249,115,22,0.10)",
              accentBorder: "rgba(249,115,22,0.20)",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-xl p-5 cursor-pointer transition-all duration-200 group"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = card.accentBorder;
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLDivElement).style.transform = "";
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: card.accentBg, border: `1px solid ${card.accentBorder}`, color: card.accentColor }}
                >
                  {card.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{card.title}</p>
                  <p className="text-[10px]" style={{ color: card.accentColor }}>{card.count}</p>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{card.desc}</p>
            </div>
          ))}
        </div>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        className="mt-12 py-4 px-6"
        style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <small className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} HotelSphere · Hospitality Management Platform
          </small>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Support"].map((l) => (
              <a key={l} href="#" className="text-[10px] uppercase tracking-widest no-underline transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
