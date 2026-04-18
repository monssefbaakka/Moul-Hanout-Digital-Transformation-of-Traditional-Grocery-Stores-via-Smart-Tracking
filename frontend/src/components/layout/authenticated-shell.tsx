'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from './app-sidebar';

type AuthenticatedShellProps = {
  children: ReactNode;
};

export function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const pathname = usePathname();
  const showSidebar = !(pathname === '/categories' || pathname.startsWith('/categories/'));

  return (
    <div className={`app-shell${showSidebar ? '' : ' app-shell--full'}`}>
      {showSidebar ? <AppSidebar /> : null}
      <div className="app-shell__content">
        <div className="app-shell__content-inner">{children}</div>
      </div>
    </div>
  );
}
