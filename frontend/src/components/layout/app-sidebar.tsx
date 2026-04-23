'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  Bell,
  FolderPlus,
  House,
  Package2,
  PackagePlus,
  ReceiptText,
  Tag,
  User,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { AlertsDropdown } from '@/components/alerts/alerts-dropdown';
import { useAlerts } from '@/components/alerts/alerts-provider';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import styles from './app-sidebar.module.css';
import { MoulHanoutMark } from './moul-hanout-mark';

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  ownerOnly?: boolean;
};

type AppSidebarProps = {
  id?: string;
  isOpen?: boolean;
  onClose?: () => void;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: <House size={18} />,
  },
  {
    href: '/produits',
    label: 'Products',
    icon: <Package2 size={18} />,
    ownerOnly: true,
  },
  {
    href: '/categories',
    label: 'Categories',
    icon: <Tag size={18} />,
    ownerOnly: true,
  },
  {
    href: '/vente',
    label: 'POS',
    icon: <ReceiptText size={18} />,
  },
  {
    href: '/rapports',
    label: 'Reports',
    icon: <BarChart2 size={18} />,
    ownerOnly: true,
  },
  {
    href: '/inventaire',
    label: 'Inventory',
    icon: <Warehouse size={18} />,
  },
  {
    href: '/alertes',
    label: 'Alerts',
    icon: <Bell size={18} />,
  },
  {
    href: '/utilisateurs',
    label: 'Users',
    icon: <Users size={18} />,
    ownerOnly: true,
  },
  {
    href: '/profil',
    label: 'Profile',
    icon: <User size={18} />,
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AppSidebar({ id, isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { unreadCount } = useAlerts();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === 'OWNER';

  const visibleItems = NAV_ITEMS.filter((item) => !item.ownerOnly || (hasHydrated && isOwner));

  return (
    <aside
      id={id}
      className={cn(styles.sidebar, isOpen && styles.sidebarOpen)}
      aria-label="Navigation principale"
    >
      <div className={styles.panel}>
        <div className={styles.brand}>
          <MoulHanoutMark className={styles.brandMark} />
          <div className={styles.brandText}>
            <strong>Moul Hanout</strong>
            <span>Grocery Management</span>
          </div>
          {onClose ? (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Fermer le menu"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        <nav className={styles.nav} aria-label="Navigation principale">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(styles.navLink, isActive(pathname, item.href) && styles.navLinkActive)}
            >
              <span className={styles.iconWrap}>{item.icon}</span>
              <span className={styles.copy}>
                <strong>{item.label}</strong>
              </span>
              {item.href === '/alertes' && unreadCount > 0 ? (
                <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.alerts}>
            <AlertsDropdown />
          </div>

          {hasHydrated && isOwner ? (
            <div className={styles.quickActions} aria-label="Actions rapides">
              <Link href="/produits" className={styles.quickAction}>
                <PackagePlus size={17} />
                <span>New product</span>
              </Link>
              <Link href="/categories" className={styles.quickAction}>
                <FolderPlus size={17} />
                <span>New category</span>
              </Link>
            </div>
          ) : null}

          <div className={styles.quoteCard}>
            <span className={styles.quoteEyebrow}>Store ritual</span>
            <p className={styles.quoteText}>
              &ldquo;Organization is the key to a thriving neighborhood shop.&rdquo;
            </p>
            <span className={styles.quoteAccent} aria-hidden="true" />
            <MoulHanoutMark className={styles.quoteMark} />
          </div>

          {hasHydrated && user ? (
            <Link href="/profil" className={styles.profile}>
              <span className={styles.avatar}>{getInitials(user.name)}</span>
              <span className={styles.profileMeta}>
                <strong>{user.name}</strong>
                <small>{isOwner ? 'Owner account' : 'Cashier account'}</small>
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
