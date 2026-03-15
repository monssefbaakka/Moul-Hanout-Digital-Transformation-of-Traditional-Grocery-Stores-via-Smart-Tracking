import Link from 'next/link';
import type { ReactNode } from 'react';

const links = [
  { href: '/products', label: 'Products' },
  { href: '/stock', label: 'Stock' },
  { href: '/sales', label: 'Sales' },
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <strong>Moul Hanout</strong>
            <p>Base dashboard shell for module-by-module development.</p>
          </div>
          <nav>
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
