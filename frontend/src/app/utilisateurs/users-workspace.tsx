'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminUser } from '@moul-hanout/shared-types';
import { ApiError, authApi, usersApi } from '@/lib/api/api-client';
import { AppPageHeader } from '@/components/layout/app-page-header';
import { useAuthStore } from '@/store/auth.store';

type CreateUserFormState = {
  name: string;
  email: string;
  password: string;
};

const INITIAL_FORM: CreateUserFormState = {
  name: '',
  email: '',
  password: '',
};

export function UsersWorkspace() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<CreateUserFormState>(INITIAL_FORM);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingActionUserId, setPendingActionUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated || user?.role !== 'OWNER') {
      router.replace('/');
      return;
    }

    let isMounted = true;

    async function loadData() {
      try {
        const list = await usersApi.list();
        if (!isMounted) return;
        setUsers(list);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : 'Impossible de charger les utilisateurs.',
        );
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, isAuthenticated, router, user?.role]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const created = await authApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setUsers((current) =>
        [...current, created].sort((left, right) => left.name.localeCompare(right.name)),
      );
      setStatusMessage(
        `Compte caissier pour ${created.name} créé avec succès. Il peut se connecter immédiatement.`,
      );
      setForm(INITIAL_FORM);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Impossible de créer l'utilisateur pour le moment.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate(userId: string) {
    setPendingActionUserId(userId);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const updated = await usersApi.deactivate(userId);
      setUsers((current) => current.map((u) => (u.id === userId ? updated : u)));
      setStatusMessage(`${updated.name} a été désactivé et ne peut plus se connecter.`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Impossible de désactiver cet utilisateur pour le moment.');
      }
    } finally {
      setPendingActionUserId(null);
    }
  }

  async function handleActivate(userId: string) {
    setPendingActionUserId(userId);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const updated = await usersApi.activate(userId);
      setUsers((current) => current.map((u) => (u.id === userId ? updated : u)));
      setStatusMessage(`${updated.name} a été réactivé et peut de nouveau se connecter.`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Impossible de réactiver cet utilisateur pour le moment.');
      }
    } finally {
      setPendingActionUserId(null);
    }
  }

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="page">
        <section className="panel">
          <p>Chargement...</p>
        </section>
      </main>
    );
  }

  if (user?.role !== 'OWNER') {
    return (
      <main className="page">
        <section className="panel">
          <p>Redirecting...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page stack app-page">
      <AppPageHeader
        title="Gestion de l&apos;equipe magasin"
        subtitle="Creez les acces du personnel, bloquez les comptes inactifs et gardez une lecture simple des utilisateurs autorises."
      />

      <section className="products-layout">
        <article className="panel">
          <h2>Creer un utilisateur</h2>
          <form className="form-grid" onSubmit={handleCreate}>
            <label className="field">
              <span>Nom</span>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Prénom et nom du caissier"
                required
                minLength={2}
                maxLength={80}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="cashier@moulhanout.ma"
                required
                autoComplete="off"
              />
            </label>

            <label className="field field-wide">
              <span>Mot de passe provisoire</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </label>

            <div className="form-actions field-wide">
              <button className="button-link" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creation...' : 'Creer utilisateur'}
              </button>
            </div>
          </form>

          {statusMessage ? <p className="status-success" role="status">{statusMessage}</p> : null}
          {errorMessage ? <p className="status-error" role="alert">{errorMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>Equipe du magasin</h2>
          <p>
            Les utilisateurs actifs peuvent se connecter. Les comptes inactifs restent bloques
            jusqu&apos;a reactivation.
          </p>
          <div className="product-list">
            {users.length === 0 ? <p>Aucun utilisateur pour le moment.</p> : null}
            {users.map((member) => (
              <article key={member.id} className="product-card">
                <div>
                  <h3>{member.name}</h3>
                  <p>
                    {member.email} | {member.role}
                  </p>
                </div>
                <dl>
                  <div>
                    <dt>Statut</dt>
                    <dd>{member.isActive ? 'Actif' : 'Inactif'}</dd>
                  </div>
                  <div>
                    <dt>Cree le</dt>
                    <dd>{new Date(member.createdAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
                {member.isActive && member.id !== user?.id ? (
                  <div className="form-actions">
                    <button
                      type="button"
                      className="button-link secondary"
                      onClick={() => handleDeactivate(member.id)}
                      disabled={pendingActionUserId === member.id}
                    >
                      {pendingActionUserId === member.id ? 'Mise a jour...' : 'Desactiver'}
                    </button>
                  </div>
                ) : null}
                {!member.isActive ? (
                  <div className="form-actions">
                    <button
                      type="button"
                      className="button-link"
                      onClick={() => handleActivate(member.id)}
                      disabled={pendingActionUserId === member.id}
                    >
                      {pendingActionUserId === member.id ? 'Mise a jour...' : 'Reactiver'}
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
