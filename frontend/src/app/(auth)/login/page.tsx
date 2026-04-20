import { Suspense } from 'react';
import LoginForm from './login-form';

/** Skeleton shown while the form suspends (avoids CLS during hydration). */
function LoginFormSkeleton() {
  return (
    <div className="auth-skeleton">
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}

export default function MoulHanoutLoginPage() {
  return (
    <div className="auth-screen">
      <header className="auth-header">
        <h1 className="auth-brand">Moul Hanout</h1>

        <span className="auth-badge">
          Acces securise magasin
        </span>
      </header>

      <main className="auth-main">
        <div className="auth-frame">
          <div className="auth-hero-panel">
            <div className="auth-hero-media" />

            <div className="auth-hero-copy">
              <h2>
                Pilotez votre magasin avec clarte
              </h2>
              <p>
                Suivez les ventes, le stock et les alertes depuis une interface simple pour l&apos;equipe.
              </p>
            </div>
          </div>

          <div className="auth-surface">
            {/* Suspense boundary required by Next.js 15 for useSearchParams() */}
            <Suspense fallback={<LoginFormSkeleton />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>

      <footer className="auth-footer">
        <div className="auth-footer__inner">
          <span>&copy; 2026 Moul Hanout Digital</span>
          <span>&bull;</span>
          <span>Connexion reservee aux comptes autorises</span>
          <span>&bull;</span>
          <span>Assistance via le proprietaire du magasin</span>
        </div>
      </footer>
    </div>
  );
}
