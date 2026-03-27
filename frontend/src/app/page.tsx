import Link from 'next/link';
import { AuthSessionPanel } from '@/components/auth/auth-session-panel';

export default function HomePage() {
  return (
    <main className="page stack">
      <section className="hero">
        <span className="eyebrow">Phase 1</span>
        <h1>Backend foundation only.</h1>
        <p>
          The backend has been reset to auth, users, and health only. Later business
          modules stay disabled until they are intentionally rebuilt.
        </p>
      </section>

      <section className="panel">
        <h2>Available UI</h2>
        <p>
          The login flow is now wired to the backend auth contract. Product, stock, sales,
          and report routes are still disabled.
        </p>
        <Link href="/login" className="button-link secondary">
          Open login
        </Link>
      </section>

      <section className="panel">
        <h2>Session Status</h2>
        <AuthSessionPanel />
      </section>
    </main>
  );
}
