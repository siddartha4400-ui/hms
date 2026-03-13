'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/login')) return null;

  return (
    <footer className="fixed-bottom bg-light border-top">
      <div className="container d-flex justify-content-between align-items-center py-2">
        <small className="text-muted">© {new Date().getFullYear()} HMS. All rights reserved.</small>
        <div>
          <a className="me-3 text-muted" href="#">Privacy</a>
          <a className="text-muted" href="#">Terms</a>
        </div>
      </div>
    </footer>
  );
}