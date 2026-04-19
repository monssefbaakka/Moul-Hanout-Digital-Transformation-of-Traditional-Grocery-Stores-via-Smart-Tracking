'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  Boxes,
  FolderPlus,
  House,
  Package2,
  PackagePlus,
  ReceiptText,
  Tag,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

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
    label: 'Tableau de bord',
    icon: <House size={18} />,
  },
  {
    href: '/vente',
    label: 'Vente',
    icon: <ReceiptText size={18} />,
  },
  {
    href: '/inventaire',
    label: 'Inventaire',
    icon: <Warehouse size={18} />,
  },
  {
    href: '/produits',
    label: 'Produits',
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
    href: '/utilisateurs',
    label: 'Utilisateurs',
    icon: <Users size={18} />,
    ownerOnly: true,
  },
  {
    href: '/rapports',
    label: 'Rapports',
    icon: <BarChart2 size={18} />,
    ownerOnly: true,
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ id, isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === 'OWNER';

  const visibleItems = NAV_ITEMS.filter((item) => !item.ownerOnly || (hasHydrated && isOwner));

  return (
    <aside id={id} className={cn('app-sidebar', isOpen && 'is-open')} aria-label="Navigation principale">
      <div className="app-sidebar__brand">
        <div className="app-sidebar__brand-mark">
          <Boxes size={18} />
        </div>
        <div>
          <strong>Moul Hanout</strong>
          <span>Espace gestion magasin</span>
        </div>
        {onClose && (
          <button
            type="button"
            className="app-sidebar__close"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="app-sidebar__nav" aria-label="Navigation principale">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn('app-sidebar__link', isActive(pathname, item.href) && 'is-active')}
          >
            <span className="app-sidebar__icon">{item.icon}</span>
            <span className="app-sidebar__copy">
              <strong>{item.label}</strong>
            </span>
          </Link>
        ))}
      </nav>

      <div className="app-sidebar__footer">
        {hasHydrated && isOwner ? (
          <div className="app-sidebar__actions" aria-label="Actions rapides">
            <Link href="/categories" className="app-btn app-btn--secondary app-sidebar__action">
              <FolderPlus size={18} />
              <span>Nouvelle categorie</span>
            </Link>
            <Link href="/produits" className="app-btn app-btn--primary app-sidebar__action">
              <PackagePlus size={18} />
              <span>Nouveau produit</span>
            </Link>
          </div>
        ) : null}
        <p className="app-sidebar__helper">Interface simple pour la gestion quotidienne du magasin.</p>
        {hasHydrated && user ? (
          <div className="app-sidebar__profile">
            <span className="app-sidebar__avatar">
              {user.name
                .split(' ')
                .map((part) => part.charAt(0))
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
            <div>
              <strong>{user.name}</strong>
              <small>{isOwner ? 'Proprietaire' : 'Caissier'}</small>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
