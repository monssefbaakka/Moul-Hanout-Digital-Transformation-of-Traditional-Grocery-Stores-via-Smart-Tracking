import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="auth-layout">
      <section className="auth-card">
        <span className="eyebrow">Auth Base</span>
        <h1>Register page placeholder</h1>
        <p>
          Keep registration minimal in the base phase. The main goal is route structure and
          shared API contract readiness.
        </p>
        <div className="auth-actions">
          <Link href="/login" className="button-link">
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
