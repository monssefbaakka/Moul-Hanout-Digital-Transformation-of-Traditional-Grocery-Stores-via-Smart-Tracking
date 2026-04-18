import Link from 'next/link';
import { AppPageHeader } from '@/components/layout/app-page-header';
import { AuthSessionPanel } from '@/components/auth/auth-session-panel';
import { OwnerQuickLinks } from '@/components/auth/owner-quick-links';

export default function HomePage() {
  return (
    <main className="page stack app-page">
      <AppPageHeader
        eyebrow="Accueil"
        title="Gestion simple du magasin"
        description="Retrouvez vos espaces principaux en un seul endroit pour suivre le stock, organiser le catalogue et gerer l&apos;equipe sans complexite."
        actions={
          <Link href="/inventaire" className="button-link">
            Ouvrir l&apos;inventaire
          </Link>
        }
      />

      <section className="app-dashboard-grid">
        <article className="panel app-stat-card">
          <span className="eyebrow">Lecture rapide</span>
          <strong>Clair</strong>
          <p>Chaque section utilise la meme structure pour etre comprise en quelques secondes.</p>
        </article>

        <article className="panel app-stat-card">
          <span className="eyebrow">Navigation</span>
          <strong>Continue</strong>
          <p>Le menu reste visible pendant tout le parcours pour garder vos reperes.</p>
        </article>

        <article className="panel app-stat-card">
          <span className="eyebrow">Usage</span>
          <strong>Quotidien</strong>
          <p>L&apos;interface vise une gestion simple et lisible pour les operations du magasin.</p>
        </article>
      </section>

      <section className="panel">
        <h2>Session active</h2>
        <AuthSessionPanel />
      </section>

      <OwnerQuickLinks />
    </main>
  );
}
