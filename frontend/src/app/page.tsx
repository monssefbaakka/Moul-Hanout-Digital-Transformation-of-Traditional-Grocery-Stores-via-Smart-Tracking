import Link from 'next/link';
import { AuthSessionPanel } from '@/components/auth/auth-session-panel';
import { OwnerQuickLinks } from '@/components/auth/owner-quick-links';

export default function HomePage() {
  return (
    <main className="page stack">
      <section className="hero">
        <span className="eyebrow">Phase 1</span>
        <h1>Operations foundation in progress.</h1>
        <p>
          Authentication, users, categories, products, and inventory are now available for
          MVP assembly. Sales, payments, dashboard, and receipt flows still need to be built.
        </p>
      </section>

      <section className="panel">
        <h2>Available UI</h2>
        <p>
          Owners can manage categories, products, users, and inventory. Cashiers are redirected
          to the inventory workspace after login.
        </p>
        <Link href="/login" className="button-link secondary">
          Open login
        </Link>
      </section>

      <section className="panel">
        <h2>Session Status</h2>
        <AuthSessionPanel />
      </section>

      <OwnerQuickLinks />
    </main>
  );
}
