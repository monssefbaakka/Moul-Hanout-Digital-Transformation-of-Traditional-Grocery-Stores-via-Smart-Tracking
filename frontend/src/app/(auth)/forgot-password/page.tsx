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
        setErrorMessage(
          'Unable to send a reset request right now. Please try again.',
        );
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
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-frame auth-frame--compact">
          <div className="auth-surface">
            <div className="auth-form-shell">
              <h2 className="auth-title">
                Reset Password
              </h2>

              {successMessage ? (
                <div className="mt-8 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--primary)]">
                    <Check size={32} />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Check your email</h3>
                  <p className="mt-3 auth-subtitle">
                    {successMessage}
                  </p>
                  <p className="mt-3 auth-helper">
                    In local development, the backend logs the reset link to the console for demo use.
                  </p>
                  <div className="mt-10">
                    <Link href="/login" className="app-btn app-btn--secondary w-full">
                      Return to Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <p className="auth-subtitle">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>

                  <form className="auth-form" onSubmit={handleSubmit}>
                    <div>
                      <label htmlFor="email" className="auth-field-label">
                        Email Address
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
                          placeholder="Enter your email"
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
                      <span>{isSubmitting ? 'Sending Request...' : 'Send Reset Link'}</span>
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
          <button type="button">
            Privacy Policy
          </button>
          <span>&bull;</span>
          <button type="button">
            Terms of Service
          </button>
        </div>
      </footer>
    </div>
  );
}
