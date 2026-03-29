'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth-store';

export function LogoutButton() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <button 
      onClick={handleLogout} 
      className="logout-button"
    >
      Sign Out
      <style jsx>{`
        .logout-button {
          padding: 0.5rem 1rem;
          border-radius: 999px;
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-left: 1rem;
        }

        .logout-button:hover {
          background: #fecaca;
          transform: translateY(-1px);
        }

        .logout-button:active {
          transform: translateY(0);
        }
      `}</style>
    </button>
  );
}
