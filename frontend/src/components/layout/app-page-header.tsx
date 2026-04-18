import type { ReactNode } from 'react';

type AppPageHeaderProps = {
  title: string;
  subtitle?: string; // optional now
  actions?: ReactNode;
};

export function AppPageHeader({
  title,
  subtitle,
  actions,
}: AppPageHeaderProps) {
  return (
    <section className="app-page-header">
      <div className="app-page-header__main">
        <h1>{title}</h1>
        {subtitle ? <p className="text-muted">{subtitle}</p> : null}
      </div>

      {actions ? (
        <div className="app-page-header__actions">{actions}</div>
      ) : null}
    </section>
  );
}