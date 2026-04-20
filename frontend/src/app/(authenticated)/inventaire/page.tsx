import { Suspense } from 'react';
import { InventoryWorkspace } from '../../inventaire/inventory-workspace';

export default function InventairePage() {
  return (
    <Suspense fallback={<main className="inv-page"><div className="inv-loading">Chargement de l&apos;inventaire...</div></main>}>
      <InventoryWorkspace />
    </Suspense>
  );
}
