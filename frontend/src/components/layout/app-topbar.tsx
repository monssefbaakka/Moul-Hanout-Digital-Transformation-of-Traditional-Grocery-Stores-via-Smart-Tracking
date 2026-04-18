'use client';

export function AppTopbar() {
  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6"
      aria-label="Barre superieure"
    >
      <div className="text-sm text-[var(--text-muted)]" />
      <div />
    </header>
  );
}
