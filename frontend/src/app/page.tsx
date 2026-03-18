import Link from 'next/link';

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
        <p>The auth pages remain as placeholders. Product, stock, sales, and report routes are disabled.</p>
        <Link href="/login" className="button-link secondary">
          Open auth shell
        </Link>
      </section>
    </main>
  );
}
