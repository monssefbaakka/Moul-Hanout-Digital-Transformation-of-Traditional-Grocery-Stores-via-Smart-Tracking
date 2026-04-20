'use client';

import type { AlertItem } from '@moul-hanout/shared-types';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { alertsApi } from '@/lib/api/api-client';
import { useAuthStore } from '@/store/auth.store';

const ALERTS_POLLING_INTERVAL_MS = 30_000;

type AlertsContextValue = {
  alerts: AlertItem[];
  unreadCount: number;
  isLoading: boolean;
  refreshAlerts: () => Promise<void>;
  markAlertAsRead: (alertId: string) => Promise<void>;
};

const AlertsContext = createContext<AlertsContextValue | null>(null);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function loadAlerts(showLoadingState: boolean) {
    if (!hasHydrated || !isAuthenticated) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    if (showLoadingState) {
      setIsLoading(true);
    }

    try {
      const nextAlerts = await alertsApi.list();
      setAlerts(nextAlerts);
    } catch {
      if (showLoadingState) {
        setAlerts([]);
      }
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function syncAlerts(showLoadingState: boolean) {
      if (!isMounted) {
        return;
      }

      if (showLoadingState) {
        setIsLoading(true);
      }

      try {
        const nextAlerts = await alertsApi.list();
        if (!isMounted) {
          return;
        }
        setAlerts(nextAlerts);
      } catch {
        if (!isMounted || !showLoadingState) {
          return;
        }
        setAlerts([]);
      } finally {
        if (isMounted && showLoadingState) {
          setIsLoading(false);
        }
      }
    }

    void syncAlerts(true);

    const intervalId = window.setInterval(() => {
      void syncAlerts(false);
    }, ALERTS_POLLING_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [hasHydrated, isAuthenticated]);

  async function markAlertAsRead(alertId: string) {
    const existingAlert = alerts.find((alert) => alert.id === alertId);

    if (!existingAlert || existingAlert.isRead) {
      return;
    }

    const updatedAlert = await alertsApi.markAsRead(alertId);
    setAlerts((currentAlerts) =>
      currentAlerts.map((alert) => (alert.id === alertId ? updatedAlert : alert)),
    );
  }

  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        unreadCount,
        isLoading,
        refreshAlerts: () => loadAlerts(true),
        markAlertAsRead,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);

  if (!context) {
    throw new Error('useAlerts must be used inside AlertsProvider');
  }

  return context;
}
