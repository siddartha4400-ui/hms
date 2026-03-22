import {
  FiHome,
  FiCalendar,
  FiUsers,
  FiTrendingUp,
  FiArrowUpRight,
  FiArrowDownRight,
  FiMapPin,
  FiBarChart2,
  FiShield,
  FiZap,
  FiStar,
} from 'react-icons/fi';

type AlertRow = {
  id: number;
  hotel: string;
  city: string;
  type: 'booking' | 'cancellation' | 'review' | 'maintenance';
  desc: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
};

type HotelRow = {
  id: number;
  name: string;
  city: string;
  stars: number;
  occupancy: number;
  bookingsToday: number;
  revenue: string;
  status: 'active' | 'maintenance' | 'review';
};

const ALERT_CHIP: Record<AlertRow['type'], { bg: string; text: string; border: string; label: string }> = {
  booking: { bg: 'rgba(16,185,129,0.10)', text: '#34d399', border: 'rgba(16,185,129,0.25)', label: 'Booking' },
  cancellation: {
    bg: 'rgba(239,68,68,0.10)',
    text: '#f87171',
    border: 'rgba(239,68,68,0.25)',
    label: 'Cancellation',
  },
  review: { bg: 'rgba(245,158,11,0.10)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)', label: 'Review' },
  maintenance: {
    bg: 'rgba(6,182,212,0.10)',
    text: '#22d3ee',
    border: 'rgba(6,182,212,0.25)',
    label: 'Maintenance',
  },
};

const PRIORITY_DOT: Record<AlertRow['priority'], string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

const STATUS_CHIP: Record<HotelRow['status'], { bg: string; text: string; border: string; label: string }> = {
  active: { bg: 'rgba(16,185,129,0.10)', text: '#34d399', border: 'rgba(16,185,129,0.25)', label: 'Active' },
  maintenance: {
    bg: 'rgba(245,158,11,0.10)',
    text: '#fbbf24',
    border: 'rgba(245,158,11,0.25)',
    label: 'Maintenance',
  },
  review: {
    bg: 'rgba(148,163,184,0.10)',
    text: '#94a3b8',
    border: 'rgba(148,163,184,0.20)',
    label: 'Under Review',
  },
};

function KpiCard({
  icon,
  label,
  value,
  sub,
  delta,
  positive,
  accentBg,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  delta: string;
  positive: boolean;
  accentBg: string;
  accentColor: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden group transition-all duration-300"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
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
          style={{ color: positive ? 'var(--positive)' : 'var(--danger)' }}
        >
          {positive ? <FiArrowUpRight className="text-xs" /> : <FiArrowDownRight className="text-xs" />}
          {delta}
        </span>
      </div>

      <p className="text-[10px] uppercase tracking-[.18em] mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <h2 className="text-[28px] font-bold leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </h2>
      <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
        {sub}
      </p>
    </div>
  );
}

interface DashboardMoleculeProps {
  activeTab: 'alerts' | 'hotels';
  onTabChange: (tab: 'alerts' | 'hotels') => void;
  alerts: AlertRow[];
  hotels: HotelRow[];
}

export default function DashboardMolecule({
  activeTab,
  onTabChange,
  alerts,
  hotels,
}: DashboardMoleculeProps) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(249,115,22,0.06) 100%)',
            border: '1px solid var(--brand-border)',
          }}
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--positive)' }} />
                <span className="text-[10px] uppercase tracking-[.3em]" style={{ color: 'var(--positive)' }}>
                  All Systems Operational
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Operations Dashboard
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Real-time overview across <span style={{ color: 'var(--brand)' }} className="font-semibold">240 properties</span> in{' '}
                <span style={{ color: 'var(--action)' }} className="font-semibold">38 cities</span>
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<FiHome className="text-base" />}
            label="Properties Listed"
            value="240"
            sub="Across 38 cities in India"
            delta="+8 this month"
            positive
            accentBg="var(--brand-dim)"
            accentColor="var(--brand)"
          />
          <KpiCard
            icon={<FiCalendar className="text-base" />}
            label="Bookings Today"
            value="1,842"
            sub="Up from 1,629 yesterday"
            delta="+13.1%"
            positive
            accentBg="rgba(249,115,22,0.12)"
            accentColor="var(--action)"
          />
          <KpiCard
            icon={<FiTrendingUp className="text-base" />}
            label="Platform Revenue"
            value="₹42.6L"
            sub="Gross across all hotels today"
            delta="+9.4% vs LW"
            positive
            accentBg="rgba(16,185,129,0.10)"
            accentColor="var(--positive)"
          />
          <KpiCard
            icon={<FiUsers className="text-base" />}
            label="Active Guests"
            value="6,311"
            sub="Currently checked in platform-wide"
            delta="-2.1% vs LW"
            positive={false}
            accentBg="rgba(239,68,68,0.10)"
            accentColor="var(--danger)"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Avg Occupancy', value: '74%', color: 'var(--brand)', icon: <FiBarChart2 /> },
            { label: 'Avg Guest Rating', value: '4.2 ★', color: 'var(--warning)', icon: <FiStar /> },
            { label: 'Cancellations', value: '134', color: 'var(--danger)', icon: <FiZap /> },
            { label: 'Pending Reviews', value: '28', color: 'var(--action)', icon: <FiShield /> },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl p-4 text-center transition-all duration-200"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex justify-center mb-2" style={{ color: m.color, opacity: 0.7 }}>
                {m.icon}
              </div>
              <p className="text-2xl font-bold" style={{ color: m.color }}>
                {m.value}
              </p>
              <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
                {m.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tab Panel */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          {/* Tab Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
          >
            <div
              className="flex gap-1 p-1 rounded-lg"
              style={{ background: 'var(--bg-chip)', border: '1px solid var(--border)' }}
            >
              {(['alerts', 'hotels'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className="px-4 py-1.5 rounded-md text-[11px] uppercase tracking-widest transition-all duration-200"
                  style={
                    activeTab === tab
                      ? {
                          background: 'var(--brand-dim)',
                          color: 'var(--brand-light)',
                          border: '1px solid var(--brand-border)',
                        }
                      : { color: 'var(--text-muted)', border: '1px solid transparent' }
                  }
                >
                  {tab === 'alerts' ? 'Live Alerts' : 'Top Properties'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {activeTab === 'alerts' &&
              alerts.map((alert) => {
                const chip = ALERT_CHIP[alert.type];
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-opacity-50"
                    style={{ cursor: 'default' }}
                  >
                    <div
                      className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: PRIORITY_DOT[alert.priority],
                        boxShadow: `0 0 8px ${PRIORITY_DOT[alert.priority]}80`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className="text-[9px] uppercase tracking-widest rounded px-2 py-0.5"
                          style={{ background: chip.bg, color: chip.text, border: `1px solid ${chip.border}` }}
                        >
                          {chip.label}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {alert.hotel}
                        </span>
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          <FiMapPin className="text-[9px]" /> {alert.city}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {alert.desc}
                      </p>
                      <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
                        {alert.time}
                      </p>
                    </div>
                  </div>
                );
              })}

            {activeTab === 'hotels' &&
              hotels.map((hotel) => {
                const statusChip = STATUS_CHIP[hotel.status];
                return (
                  <div
                    key={hotel.id}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-opacity-50"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {hotel.name}
                        </span>
                        <span
                          className="text-[9px] uppercase tracking-widest rounded px-2 py-0.5"
                          style={{
                            background: statusChip.bg,
                            color: statusChip.text,
                            border: `1px solid ${statusChip.border}`,
                          }}
                        >
                          {statusChip.label}
                        </span>
                      </div>
                      <p className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <FiMapPin className="text-[9px]" /> {hotel.city} • {hotel.stars} ★
                      </p>
                    </div>
                    <div className="ml-auto text-right space-y-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {hotel.occupancy}% occupancy
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {hotel.bookingsToday} bookings • {hotel.revenue} today
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </main>
    </div>
  );
}
