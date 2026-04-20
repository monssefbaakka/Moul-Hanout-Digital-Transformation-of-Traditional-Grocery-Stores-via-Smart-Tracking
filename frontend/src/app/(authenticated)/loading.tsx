function LoadingBlock({ className }: { className?: string }) {
  return <div className={`app-route-loading__block${className ? ` ${className}` : ''}`} aria-hidden="true" />;
}

export default function AuthenticatedLoading() {
  return (
    <main className="page stack app-page app-route-loading" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement de la page...</span>

      <section className="app-route-loading__header">
        <div className="app-route-loading__header-copy">
          <LoadingBlock className="app-route-loading__eyebrow" />
          <LoadingBlock className="app-route-loading__title" />
          <LoadingBlock className="app-route-loading__subtitle app-route-loading__subtitle--wide" />
          <LoadingBlock className="app-route-loading__subtitle" />
        </div>

        <div className="app-route-loading__header-actions" aria-hidden="true">
          <LoadingBlock className="app-route-loading__button" />
          <LoadingBlock className="app-route-loading__button app-route-loading__button--secondary" />
        </div>
      </section>

      <section className="app-dashboard-grid" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="panel app-route-loading__card">
            <LoadingBlock className="app-route-loading__card-label" />
            <LoadingBlock className="app-route-loading__card-value" />
            <LoadingBlock className="app-route-loading__card-copy app-route-loading__card-copy--wide" />
            <LoadingBlock className="app-route-loading__card-copy" />
          </article>
        ))}
      </section>

      <section className="app-route-loading__body" aria-hidden="true">
        <article className="panel app-route-loading__panel">
          <div className="app-route-loading__panel-header">
            <div className="app-route-loading__panel-copy">
              <LoadingBlock className="app-route-loading__panel-title" />
              <LoadingBlock className="app-route-loading__panel-copy-line app-route-loading__panel-copy-line--wide" />
            </div>
            <LoadingBlock className="app-route-loading__chip" />
          </div>

          <div className="app-route-loading__rows">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="app-route-loading__row">
                <div className="app-route-loading__row-copy">
                  <LoadingBlock className="app-route-loading__row-title" />
                  <LoadingBlock className="app-route-loading__row-subtitle" />
                </div>
                <LoadingBlock className="app-route-loading__row-meta" />
              </div>
            ))}
          </div>
        </article>

        <aside className="app-card app-route-loading__side-panel">
          <LoadingBlock className="app-route-loading__side-title" />
          <LoadingBlock className="app-route-loading__side-copy app-route-loading__side-copy--wide" />
          <LoadingBlock className="app-route-loading__side-copy" />

          <div className="app-route-loading__side-stats">
            <LoadingBlock className="app-route-loading__side-stat" />
            <LoadingBlock className="app-route-loading__side-stat" />
            <LoadingBlock className="app-route-loading__side-stat" />
          </div>

          <LoadingBlock className="app-route-loading__button app-route-loading__button--full" />
        </aside>
      </section>
    </main>
  );
}
