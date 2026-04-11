import { Suspense } from 'react';
import LoginForm from './login-form';

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
