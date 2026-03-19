'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Dashboard, login, and root manage their own footers
  if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/dashboard')) return null;

  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-12 py-4 px-6"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: '#0d1526',
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <small
          className="text-[10px] uppercase tracking-widest"
          style={{ color: '#3d5278' }}
        >
          © {year} HotelSphere · Hospitality Management Platform · All rights reserved.
        </small>
        <div className="flex gap-6">
          {['Privacy Policy', 'Terms of Use', 'Support'].map((link) => (
            <a
              key={link}
              href="#"
              className="text-[10px] uppercase tracking-widest no-underline transition-colors"
              style={{ color: '#3d5278' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#06b6d4'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#3d5278'; }}
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}