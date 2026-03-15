import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="auth-layout">
      <section className="auth-card">
        <span className="eyebrow">Auth Base</span>
        <h1>Login page placeholder</h1>
        <p>
          Developer 2 can replace this shell with the real auth UI once the shared auth
          contract is stable.
        </p>
        <div className="auth-actions">
          <Link href="/sales" className="button-link">
            Go to dashboard shell
          </Link>
          <Link href="/register" className="button-link secondary">
            Open register page
          </Link>
        </div>
      </section>
    </main>
  );
}
