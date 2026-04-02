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
    <div className="flex min-h-screen flex-col bg-[#f3f4fb] text-slate-900">
      <header className="flex w-full items-center justify-between px-8 py-6 md:px-16">
        <h1 className="text-[22px] font-semibold tracking-tight">Moul Hanout</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-[15px] font-medium text-slate-700 transition hover:text-slate-900 flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 pb-8 md:px-12 flex items-center justify-center">
        <div className="w-full max-w-[500px] overflow-hidden rounded-[36px] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] px-8 py-12 md:px-14">
          <h2 className="text-[40px] leading-none font-semibold tracking-tight text-slate-900">
            Reset Password
          </h2>
          
          {isSuccess ? (
            <div className="mt-8 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c8f0d8] text-[#1f6b4f]">
                <Check size={32} />
              </div>
              <h3 className="text-[20px] font-semibold tracking-tight text-slate-900">Check your email</h3>
              <p className="mt-3 text-[18px] leading-8 text-slate-600">
                We&apos;ve sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
              </p>
              <div className="mt-10">
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#f2f4fb] py-5 text-[18px] font-semibold text-slate-700 transition hover:bg-[#e9edf8]"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-5 text-[18px] leading-8 text-slate-600">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

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
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full bg-transparent text-[18px] text-slate-700 outline-none placeholder:text-slate-400"
                      placeholder="Enter your email"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#2d7b64] to-[#66b191] py-5 text-[18px] font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
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
