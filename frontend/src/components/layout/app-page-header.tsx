import type { ReactNode } from 'react';

type AppPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function AppPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: AppPageHeaderProps) {
  return (
    <section className="app-page-header">
      <div className="app-page-header__main">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {actions ? <div className="app-page-header__actions">{actions}</div> : null}
    </section>
  );
}
