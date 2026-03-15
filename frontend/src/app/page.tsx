import Link from 'next/link';

const modules = [
  { name: 'Auth', href: '/login', note: 'Access shell and route protection base.' },
  { name: 'Products', href: '/products', note: 'First recommended end-to-end module.' },
  { name: 'Stock', href: '/stock', note: 'Second module after products stabilizes.' },
  { name: 'Sales', href: '/sales', note: 'Depends on products and stock contracts.' },
];

export default function HomePage() {
  return (
    <main className="page stack">
      <section className="hero">
        <span className="eyebrow">Minimum Base</span>
        <h1>Parallel development shell for two developers.</h1>
        <p>
          This frontend stays intentionally small. It gives the team stable routes, a shared
          app shell, and placeholder module pages while feature work remains separate.
        </p>
      </section>

      <section className="module-grid">
        {modules.map((module) => (
          <article key={module.name}>
            <h2>{module.name}</h2>
            <p>{module.note}</p>
            <Link href={module.href} className="button-link secondary">
              Open module
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
