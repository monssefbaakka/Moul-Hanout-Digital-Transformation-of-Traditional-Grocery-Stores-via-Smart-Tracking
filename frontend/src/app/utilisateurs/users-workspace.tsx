'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminUser } from '@moul-hanout/shared-types';
import { ApiError, authApi, usersApi } from '@/lib/api/api-client';
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
          error instanceof Error ? error.message : 'Unable to load users.',
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
        `Cashier account for ${created.name} was created and can sign in immediately.`,
      );
      setForm(INITIAL_FORM);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to create the user right now.');
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
      setStatusMessage(`${updated.name} was deactivated and can no longer sign in.`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to deactivate this user right now.');
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
      setStatusMessage(`${updated.name} was reactivated and can sign in again.`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to reactivate this user right now.');
      }
    } finally {
      setPendingActionUserId(null);
    }
  }

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="page">
        <section className="panel">
          <p>Loading workspace...</p>
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
    <main className="page stack">
      <section className="hero">
        <span className="eyebrow">Utilisateurs</span>
        <h1>Owner user management</h1>
        <p>
          Create accounts for cashiers and deactivate users that should no longer access the
          shop. Account creation is restricted to owners.
        </p>
        <p>Inactive users stay visible here and can be reactivated at any time.</p>
      </section>

      <section className="products-layout">
        <article className="panel">
          <h2>Create a user</h2>
          <form className="form-grid" onSubmit={handleCreate}>
            <label className="field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Cashier full name"
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
              <span>Temporary password</span>
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
                {isSubmitting ? 'Creating...' : 'Create user'}
              </button>
            </div>
          </form>

          {statusMessage ? <p className="status-success">{statusMessage}</p> : null}
          {errorMessage ? <p className="status-error">{errorMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>Shop users</h2>
          <p>
            Active users can sign in. Inactive users are blocked from login until you reactivate
            them.
          </p>
          <div className="product-list">
            {users.length === 0 ? <p>No users yet.</p> : null}
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
                    <dt>Status</dt>
                    <dd>{member.isActive ? 'Active' : 'Inactive'}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
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
                      {pendingActionUserId === member.id ? 'Updating...' : 'Deactivate'}
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
                      {pendingActionUserId === member.id ? 'Updating...' : 'Reactivate'}
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
