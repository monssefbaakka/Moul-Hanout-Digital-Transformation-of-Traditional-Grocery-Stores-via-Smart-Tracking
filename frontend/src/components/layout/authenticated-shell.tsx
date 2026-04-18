'use client';

import type { ReactNode } from 'react';
import { AppSidebar } from './app-sidebar';
import { AppTopbar } from './app-topbar';

type AuthenticatedShellProps = {
  children: ReactNode;
};

export function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  return (
    <div className="app-shell flex h-screen">
      {/* Sidebar ALWAYS visible */}
      <AppSidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}