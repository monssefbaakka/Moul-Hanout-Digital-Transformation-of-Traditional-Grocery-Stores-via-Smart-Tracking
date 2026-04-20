'use client';

import { type ReactNode, useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Boxes, Menu } from 'lucide-react';
import { AlertsDropdown } from '@/components/alerts/alerts-dropdown';
import { AlertsProvider } from '@/components/alerts/alerts-provider';
import { registerAuthFailureHandler } from '@/lib/api/api-client';
import { useAuthStore } from '@/store/auth.store';
import { AppSidebar } from './app-sidebar';

type AuthenticatedShellProps = {
  children: ReactNode;
};

export function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const showSidebar = true;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useLayoutEffect(() => {
    registerAuthFailureHandler(() => {
      useAuthStore.getState().logout();
      router.replace('/login');
    });

    return () => {
      registerAuthFailureHandler(null);
    };
  }, [router]);

  // Close drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [sidebarOpen]);

  return (
    <AlertsProvider>
      <div className={`app-shell${showSidebar ? '' : ' app-shell--full'}`}>
        {showSidebar ? (
          <>
            <header className="app-mobile-topbar" aria-label="Barre de navigation">
              <Link href="/" className="app-mobile-topbar__brand">
                <span className="app-mobile-topbar__logo">
                  <Boxes size={13} />
                </span>
                <span>Moul Hanout</span>
              </Link>
              <div className="app-mobile-topbar__actions">
                <AlertsDropdown compact />
                <button
                  type="button"
                  className="app-mobile-topbar__toggle"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Ouvrir le menu"
                  aria-expanded={sidebarOpen}
                  aria-controls="app-sidebar"
                >
                  <Menu size={20} />
                </button>
              </div>
            </header>

            <div
              className={`app-sidebar-overlay${sidebarOpen ? ' is-visible' : ''}`}
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />

            <AppSidebar
              id="app-sidebar"
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </>
        ) : null}

        <div className="app-shell__content">
          <div className="app-shell__content-inner">{children}</div>
        </div>
      </div>
    </AlertsProvider>
  );
}
