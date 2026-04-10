'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Check, Eye, EyeOff, Info, Loader2, Lock, Mail } from 'lucide-react';
import { ApiError } from '@/lib/api/api-client';
import { loginWithPassword } from '@/lib/auth/auth-actions';
import { getPostLoginRedirect } from '@/lib/auth/auth-routes';
import { useAuthStore } from '@/store/auth.store';

const DEMO_EMAIL = 'owner@moulhanout.ma';
const DEMO_PASSWORD = 'Admin@123!';

/**
 * Inner form component — isolated here because it uses `useSearchParams()`.
 * Next.js 15 requires any component calling `useSearchParams()` to be wrapped
 * in a <Suspense> boundary at the page level. The page default export does this.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);

  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
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
    <div className="w-full max-w-[460px]">
      <h2 className="text-[52px] leading-none font-semibold tracking-tight text-slate-900">
        Welcome Back
      </h2>
      <p className="mt-5 max-w-[420px] text-[18px] leading-8 text-slate-600">
        Manage your inventory and sales with editorial precision.
      </p>

      <div className="mt-10 rounded-2xl bg-[#c8f0d8] px-6 py-6 text-[#18684b]">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#18684b] text-white">
            <Info size={16} />
          </div>

          <div>
            <p className="text-[15px] font-extrabold uppercase tracking-[0.12em]">
              Demo Credentials
            </p>
            <div className="mt-2 space-y-1 text-[18px] leading-7">
              <p>
                <span className="font-semibold">User:</span> {DEMO_EMAIL}
              </p>
              <p>
                <span className="font-semibold">Pass:</span> {DEMO_PASSWORD}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="mb-3 block text-[14px] font-extrabold uppercase tracking-[0.14em] text-slate-700"
          >
            Email Address
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-transparent bg-[#eef1fb] px-5 py-5 focus-within:border-[#1f6b4f]">
            <Mail size={20} className="text-slate-500" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-transparent text-[18px] text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-[14px] font-extrabold uppercase tracking-[0.14em] text-slate-700"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[14px] font-semibold text-[#1f6b4f] hover:underline"
            >
              Forgot?
            </Link>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-transparent bg-[#eef1fb] px-5 py-5 focus-within:border-[#1f6b4f]">
            <Lock size={20} className="text-slate-500" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-transparent text-[18px] text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Enter your password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <p className="mt-3 text-[14px] text-slate-400">
            Minimum 8 characters required
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-4">
          <input
            type="checkbox"
            className="sr-only"
            checked={keepSignedIn}
            onChange={(event) => setKeepSignedIn(event.target.checked)}
          />
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-md border transition ${
              keepSignedIn
                ? 'border-[#1f6b4f] bg-[#1f6b4f] text-white'
                : 'border-slate-300 bg-white text-transparent'
            }`}
          >
            <Check size={16} />
          </div>
          <span className="text-[18px] text-slate-700">
            Keep me signed in for 30 days
          </span>
        </label>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[15px] text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !hasHydrated}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#2d7b64] to-[#66b191] py-5 text-[18px] font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : null}
          <span>{isSubmitting ? 'Signing in...' : 'Sign in to Dashboard'}</span>
        </button>
      </form>

      <div className="mt-10 text-center text-[14px] text-slate-400">
        Access is managed by your store owner.
      </div>
    </div>
  );
}

/** Skeleton shown while the form suspends (avoids CLS during hydration). */
function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-[460px] animate-pulse space-y-6">
      <div className="h-14 w-3/4 rounded-2xl bg-slate-100" />
      <div className="h-6 w-full rounded-xl bg-slate-100" />
      <div className="h-24 rounded-2xl bg-slate-100" />
      <div className="h-16 rounded-2xl bg-slate-100" />
      <div className="h-16 rounded-2xl bg-slate-100" />
      <div className="h-14 rounded-2xl bg-slate-100" />
    </div>
  );
}

export default function MoulHanoutLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f3f4fb] text-slate-900">
      <header className="flex w-full items-center justify-between px-8 py-6 md:px-16">
        <h1 className="text-[22px] font-semibold tracking-tight">Moul Hanout</h1>

        <span className="rounded-xl bg-[#1f6b4f] px-6 py-3 text-[15px] font-semibold text-white shadow-sm">
          Sign In
        </span>
      </header>

      <main className="flex-1 px-6 pb-8 md:px-12">
        <div className="mx-auto grid min-h-[820px] max-w-[1180px] grid-cols-1 overflow-hidden rounded-[36px] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] lg:grid-cols-2">
          <div className="relative p-0">
            <div
              className="h-full min-h-[420px] bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(to top, rgba(0,0,0,0.4), rgba(0,0,0,0.08)), url('/auth/login-hero.png')",
              }}
            />

            <div className="absolute bottom-10 left-10 max-w-[360px] text-white">
              <h2 className="text-5xl font-bold leading-[1.05] tracking-tight">
                Elevate Your Local Commerce
              </h2>
              <p className="mt-5 text-[18px] leading-8 text-white/90">
                Join Morocco&apos;s premium network of digitized neighborhood grocers.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center px-8 py-12 md:px-14">
            {/* Suspense boundary required by Next.js 15 for useSearchParams() */}
            <Suspense fallback={<LoginFormSkeleton />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>

      <footer className="px-6 py-6 md:px-12">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-6 text-[14px] font-medium uppercase tracking-[0.14em] text-slate-400">
          <span>&copy; 2026 Moul Hanout Digital</span>
          <span>&bull;</span>
          <button type="button" className="transition hover:text-slate-600">
            Privacy Policy
          </button>
          <span>&bull;</span>
          <button type="button" className="transition hover:text-slate-600">
            Terms of Service
          </button>
        </div>
      </footer>
    </div>
  );
}
