'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from 'lucide-react';
import { ApiError, authApi } from '@/lib/api/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const logout = useAuthStore((state) => state.logout);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const token = searchParams.get('token')?.trim() ?? '';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setErrorMessage('Le lien de reinitialisation est incomplet. Demandez un nouveau lien.');
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Les deux champs mot de passe sont obligatoires.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await authApi.resetPassword({ token, password });
      logout();
      setSuccessMessage(result.message);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Impossible de reinitialiser le mot de passe pour le moment.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-form-shell">
      <div className="mb-6">
        <Link href="/login" className="auth-link inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Retour a la connexion
        </Link>
      </div>

      <h2 className="auth-title">
        Choisir un nouveau mot de passe
      </h2>

      {successMessage ? (
        <div className="mt-8 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--primary)]">
            <Check size={32} />
          </div>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
            Mot de passe mis a jour
          </h3>
          <p className="mt-3 auth-subtitle">
            {successMessage}
          </p>
          <div className="mt-10">
            <Link href="/login" className="app-btn app-btn--secondary w-full">
              Se reconnecter
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="auth-subtitle">
            Choisissez un nouveau mot de passe pour votre compte. Toutes les sessions actuelles seront fermees.
          </p>

          {!token ? (
            <div className="auth-error mt-8">
              Ce lien de reinitialisation est incomplet ou invalide. Demandez un nouvel email.
            </div>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="auth-field-label">
                Nouveau mot de passe
              </label>
              <div className="auth-input-wrap">
                <Lock size={20} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Entrez votre nouveau mot de passe"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="auth-input-action"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="auth-field-label">
                Confirmer le mot de passe
              </label>
              <div className="auth-input-wrap">
                <Lock size={20} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Saisissez a nouveau le mot de passe"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="auth-input-action"
                  aria-label={
                    showConfirmPassword
                      ? 'Masquer la confirmation du mot de passe'
                      : 'Afficher la confirmation du mot de passe'
                  }
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div className="auth-error">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="app-btn app-btn--primary w-full"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : null}
              <span>{isSubmitting ? 'Reinitialisation...' : 'Reinitialiser le mot de passe'}</span>
            </button>
          </form>
        </>
      )}
    </div>
  );
}
