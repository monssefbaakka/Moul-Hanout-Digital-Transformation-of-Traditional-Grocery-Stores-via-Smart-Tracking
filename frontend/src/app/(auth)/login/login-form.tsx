'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Info, Loader2, Lock, Mail } from 'lucide-react';
import { ApiError } from '@/lib/api/api-client';
import { loginWithPassword } from '@/lib/auth/auth-actions';
import { getPostLoginRedirect } from '@/lib/auth/auth-routes';
import { useAuthStore } from '@/store/auth.store';

const DEMO_CREDENTIALS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS === 'true';
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? '';
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? '';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);

  const [email, setEmail] = useState(() => (DEMO_CREDENTIALS_ENABLED ? DEMO_EMAIL : ''));
  const [password, setPassword] = useState(() => (DEMO_CREDENTIALS_ENABLED ? DEMO_PASSWORD : ''));
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    if (isAuthenticated && user) {
      const next = searchParams.get('next');
      router.replace(next ?? getPostLoginRedirect(user.role));
    }
  }, [hasHydrated, isAuthenticated, router, searchParams, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const auth = await loginWithPassword(email.trim(), password);
      const next = searchParams.get('next');
      router.replace(next ?? getPostLoginRedirect(auth.user.role));
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to sign in right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-form-shell">
      <h2 className="auth-title">
        Welcome Back
      </h2>
      <p className="auth-subtitle">
        Manage your inventory and sales with editorial precision.
      </p>

      {DEMO_CREDENTIALS_ENABLED ? (
        <div className="auth-note">
          <div className="auth-note__icon">
            <Info size={16} />
          </div>

          <div>
            <p className="auth-note__label">Demo Credentials</p>
            <div className="mt-2 space-y-1">
              <p>
                <span className="font-semibold">User:</span> {DEMO_EMAIL}
              </p>
              <p>
                <span className="font-semibold">Pass:</span> {DEMO_PASSWORD}
              </p>
            </div>
          </div>
        </div>
      ) : null}

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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <div className="auth-row">
            <label htmlFor="password" className="auth-field-label">
              Password
            </label>
            <Link href="/forgot-password" className="auth-link">
              Forgot?
            </Link>
          </div>

          <div className="auth-input-wrap">
            <Lock size={20} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="auth-input-action"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <p className="auth-helper">
            Minimum 8 characters required
          </p>
        </div>

        <label className="auth-checkbox">
          <input
            type="checkbox"
            checked={keepSignedIn}
            onChange={(event) => setKeepSignedIn(event.target.checked)}
          />
          <div className="auth-checkbox__control">
            <Check size={16} />
          </div>
          <span className="text-base text-slate-700">
            Keep me signed in for 30 days
          </span>
        </label>

        {errorMessage ? (
          <div className="auth-error">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !hasHydrated}
          className="app-btn app-btn--primary w-full"
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : null}
          <span>{isSubmitting ? 'Signing in...' : 'Sign in to Dashboard'}</span>
        </button>
      </form>

      <div className="mt-8 text-center auth-caption">
        Access is managed by your store owner.
      </div>
    </div>
  );
}
