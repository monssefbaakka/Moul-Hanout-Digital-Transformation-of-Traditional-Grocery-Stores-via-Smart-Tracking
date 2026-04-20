'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ApiError, authApi } from '@/lib/api/api-client';
import { Check, Mail, ArrowLeft, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await authApi.forgotPassword({ email: normalizedEmail });
      setSuccessMessage(result.message);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Impossible d'envoyer la demande de reinitialisation pour le moment.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <header className="auth-header">
        <h1 className="auth-brand">Moul Hanout</h1>
        <div className="flex items-center gap-4">
          <Link href="/login" className="auth-link inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Retour a la connexion
          </Link>
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-frame auth-frame--compact">
          <div className="auth-surface">
            <div className="auth-form-shell">
              <h2 className="auth-title">
                Mot de passe oublie
              </h2>

              {successMessage ? (
                <div className="mt-8 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--primary)]">
                    <Check size={32} />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Verifiez votre email</h3>
                  <p className="mt-3 auth-subtitle">
                    {successMessage}
                  </p>
                  <p className="mt-3 auth-helper">
                    En developpement local, le backend affiche aussi le lien de reinitialisation dans la console.
                  </p>
                  <div className="mt-10">
                    <Link href="/login" className="app-btn app-btn--secondary w-full">
                      Retour a la connexion
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <p className="auth-subtitle">
                    Saisissez votre adresse email pour recevoir un lien de reinitialisation.
                  </p>

                  <form className="auth-form" onSubmit={handleSubmit}>
                    <div>
                      <label htmlFor="email" className="auth-field-label">
                        Adresse email
                      </label>
                      <div className="auth-input-wrap">
                        <Mail size={20} />
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="nom@magasin.ma"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !email.trim()}
                      className="app-btn app-btn--primary w-full"
                    >
                      {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : null}
                      <span>{isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien'}</span>
                    </button>

                    {errorMessage ? (
                      <div className="auth-error">
                        {errorMessage}
                      </div>
                    ) : null}
                  </form>
                </>
              )}
            </div>
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
