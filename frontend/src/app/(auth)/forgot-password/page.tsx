'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    
    // Simulate API call to auth service for forgot password
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
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

              {isSuccess ? (
                <div className="mt-8 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--primary)]">
                    <Check size={32} />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Check your email</h3>
                  <p className="mt-3 auth-subtitle">
                    We&apos;ve sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
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
                      {isSubmitting ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : null}
                      <span>{isSubmitting ? 'Sending Request...' : 'Send Reset Link'}</span>
                    </button>
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
