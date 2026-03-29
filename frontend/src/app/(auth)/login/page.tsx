'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/sales');
    }
  }, [isAuthenticated, router]);

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) return;

    try {
      await login(formData.email, formData.password);
      // router.push will happen via the useEffect above
    } catch (err: any) {
      // Backend error will be in the store's error state
      console.error('Login attempt failed:', err);
    }
  };

  const currentError = formError || error;

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="auth-card-top">
          <span className="eyebrow">Digital Transformation</span>
          <h1>Welcome Back</h1>
          <p>Access your Moul Hanout dashboard to manage your sales and inventory.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {currentError && (
            <div className="alert-box error" role="alert">
              <span className="alert-icon">⚠️</span>
              <p>{currentError}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              placeholder="e.g. owner@moulhanout.ma"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={formError && !formData.email ? 'invalid' : ''}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <Link href="/forgot-password" title="Recover password" className="link-text sm">
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={formError && !formData.password ? 'invalid' : ''}
              disabled={isLoading}
              required
            />
          </div>

          <button 
            type="submit" 
            className={`button-primary full-width ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account yet?{' '}
            <Link href="/register" className="link-text">
              Contact Admin
            </Link>
          </p>
        </div>
      </section>

      <style jsx>{`
        .auth-card-top {
          margin-bottom: 2rem;
          text-align: center;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        label {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text);
        }

        input {
          padding: 0.85rem 1rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          font-family: inherit;
          transition: all 0.2s ease;
          outline: none;
        }

        input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--accent-soft);
        }

        input.invalid {
          border-color: #ef4444;
        }

        input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-primary {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 12px;
          background: var(--accent);
          color: white;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: transform 0.1s active, opacity 0.2s;
        }

        .button-primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .button-primary:active:not(:disabled) {
          transform: scale(0.98);
        }

        .full-width {
          width: 100%;
        }

        .alert-box {
          padding: 1rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
        }

        .alert-box.error {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #991b1b;
        }

        .link-text {
          color: var(--accent);
          font-weight: 700;
        }

        .link-text.sm {
          font-size: 0.85rem;
        }

        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.9rem;
        }
      `}</style>
    </main>
  );
}
