'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellRing, Mail, ShieldCheck } from 'lucide-react';
import { ApiError, usersApi } from '@/lib/api/api-client';
import { AppPageHeader } from '@/components/layout/app-page-header';
import { useAuthStore } from '@/store/auth.store';

type ProfileFormState = {
  email: string;
};

const INITIAL_FORM: ProfileFormState = {
  email: '',
};

export function ProfileWorkspace() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, updateUser } = useAuthStore();
  const [form, setForm] = useState<ProfileFormState>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    let isMounted = true;

    async function loadProfile() {
      try {
        const profile = await usersApi.me();

        if (!isMounted) {
          return;
        }

        setForm({
          email: profile.email,
        });
        updateUser({
          email: profile.email,
          name: profile.name,
          role: profile.role,
          isActive: profile.isActive,
          createdAt: profile.createdAt,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Impossible de charger le profil pour le moment.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, isAuthenticated, router, updateUser]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const updatedProfile = await usersApi.updateMe({
        email: form.email.trim(),
      });

      updateUser({
        email: updatedProfile.email,
        name: updatedProfile.name,
        role: updatedProfile.role,
        isActive: updatedProfile.isActive,
        createdAt: updatedProfile.createdAt,
      });
      setForm({
        email: updatedProfile.email,
      });
      setStatusMessage(
        "L'adresse email du profil a ete mise a jour avec succes.",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Impossible de mettre a jour le profil.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasHydrated || !isAuthenticated || isLoading) {
    return (
      <main className="page">
        <section className="panel">
          <p>Chargement du profil...</p>
        </section>
      </main>
    );
  }

  const isOwner = user?.role === 'OWNER';

  return (
    <main className="page stack app-page">
      <AppPageHeader
        title="Profil du compte"
        subtitle="Mettez a jour l'adresse email du compte proprietaire pour recevoir les notifications importantes du stock."
      />

      <section className="profile-grid">
        <article className="panel profile-card">
          <div className="profile-card__head">
            <div className="profile-card__badge">
              <Mail size={18} />
            </div>
            <div>
              <h2>Email de connexion</h2>
              <p>
                Cette adresse sert a la connexion et, pour le proprietaire, a la
                reception des emails SMTP de stock bas et d&apos;expiration.
              </p>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field field-wide">
              <span>Adresse email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ email: event.target.value })
                }
                placeholder="gerant@magasin.ma"
                autoComplete="email"
                required
              />
            </label>

            <div className="form-actions field-wide">
              <button
                className="app-btn app-btn--primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mise a jour...' : 'Enregistrer'}
              </button>
            </div>
          </form>

          {statusMessage ? (
            <p className="status-success" role="status">
              {statusMessage}
            </p>
          ) : null}
          {errorMessage ? (
            <p className="status-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </article>

        <aside className="panel profile-side-card">
          <div className="profile-side-card__row">
            <div className="profile-side-card__icon is-primary">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2>{user?.name}</h2>
              <p>{isOwner ? 'Proprietaire du magasin' : 'Compte caisse'}</p>
            </div>
          </div>

          <div className="profile-side-card__meta">
            <div>
              <span>Role</span>
              <strong>{isOwner ? 'Proprietaire' : 'Caissier'}</strong>
            </div>
            <div>
              <span>Compte cree le</span>
              <strong>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('fr-MA')
                  : 'Non disponible'}
              </strong>
            </div>
          </div>

          {isOwner ? (
            <div className="profile-alert-note">
              <BellRing size={18} />
              <div>
                <strong>Notifications email actives via SMTP</strong>
                <p>
                  Quand SMTP est configure, cette adresse recevra un resume des
                  produits en stock bas et des produits proches de
                  l&apos;expiration.
                </p>
              </div>
            </div>
          ) : (
            <div className="profile-alert-note">
              <BellRing size={18} />
              <div>
                <strong>Information du compte</strong>
                <p>
                  Les notifications stock par email sont reservees au
                  proprietaire du magasin.
                </p>
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
