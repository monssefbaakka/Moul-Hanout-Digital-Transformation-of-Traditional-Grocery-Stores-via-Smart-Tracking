'use client';

import { type ReactNode, useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { AlertsDropdown } from '@/components/alerts/alerts-dropdown';
import { AlertsProvider } from '@/components/alerts/alerts-provider';
import { registerAuthFailureHandler } from '@/lib/api/api-client';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { AppSidebar } from './app-sidebar';
import styles from './authenticated-shell.module.css';
import { MoulHanoutMark } from './moul-hanout-mark';

type AuthenticatedShellProps = {
  children: ReactNode;
};

export function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const pathname = usePathname();
  const router = useRouter();
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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';

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
      <div className={styles.shell}>
        <header className={styles.mobileTopbar} aria-label="Barre de navigation mobile">
          <Link href="/" className={styles.mobileBrand}>
            <MoulHanoutMark className={styles.mobileBrandMark} />
            <span className={styles.mobileBrandText}>
              <strong>Moul Hanout</strong>
              <span>Gestion epicerie</span>
            </span>
          </Link>

          <div className={styles.mobileActions}>
            <AlertsDropdown compact />
            <button
              type="button"
              className={styles.mobileToggle}
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
          className={cn(styles.overlay, sidebarOpen && styles.overlayVisible)}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        <div className={styles.layout}>
          <AppSidebar id="app-sidebar" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className={styles.content}>
            <div className={styles.contentInner}>{children}</div>
          </div>
        </div>
      </div>
    </AlertsProvider>
  );
}
