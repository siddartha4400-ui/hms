'use client';

import { usePathname } from 'next/navigation';
import { FiLayers } from 'react-icons/fi';

export default function Header() {
  const pathname = usePathname();

  // Login, root, and dashboard (manages its own nav) don't use this header
  if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/dashboard')) return null;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-3 flex justify-between items-center"
      style={{
        background: 'rgba(8,14,28,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Brand */}
      <a href="/dashboard" className="flex items-center gap-2.5 no-underline group">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            background: 'rgba(6,182,212,0.12)',
            border: '1px solid rgba(6,182,212,0.25)',
          }}
        >
          <FiLayers style={{ color: '#06b6d4' }} className="text-sm" />
        </div>
        <div className="leading-none">
          <span className="block text-sm font-bold" style={{ color: '#f0f6ff' }}>HotelSphere</span>
          <span className="block text-[9px] uppercase tracking-[.2em]" style={{ color: '#3d5278' }}>
            Hospitality Platform
          </span>
        </div>
      </a>

      {/* Navigation */}
      <div className="hidden md:flex items-center gap-7">
        {[
          { label: 'Overview',   href: '/dashboard' },
          { label: 'Properties', href: '#' },
          { label: 'Bookings',   href: '#' },
          { label: 'Customers',  href: '#' },
          { label: 'Analytics',  href: '#' },
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-[11px] uppercase tracking-widest no-underline transition-colors"
            style={{
              color: pathname === link.href ? '#06b6d4' : '#3d5278',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#8fa3c4'; }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color =
                pathname === link.href ? '#06b6d4' : '#3d5278';
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all"
        style={{
          background: 'rgba(6,182,212,0.12)',
          border: '1px solid rgba(6,182,212,0.25)',
          color: '#06b6d4',
        }}
      >
        AD
      </div>
    </nav>
  );
}