/**
 * Downloads curated high-quality product images from Unsplash CDN
 * and saves them locally. Run once, then reseed.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'backend', 'uploads', 'products');
const BASE_URL = 'http://localhost:4000';

mkdirSync(OUT_DIR, { recursive: true });

// Curated Unsplash photo IDs — best match per product
const products = [
  { key: 'sidi-ali-15',      id: '1548839140-29a749e1cf4d', ext: 'jpg' }, // water bottle 1.5L
  { key: 'sidi-ali-05',      id: '1622543925917-763c34d1a86e', ext: 'jpg' }, // small water bottle
  { key: 'coca-cola',        id: '1554866585-cd94860890b7', ext: 'jpg' }, // cola can
  { key: 'pepsi',            id: '1629203851122-3726e06cccab', ext: 'jpg' }, // pepsi bottle
  { key: 'jus-orange',       id: '1621506289937-a8e4df240d0b', ext: 'jpg' }, // orange juice carton
  { key: 'nescafe',          id: '1447933601403-0c6688de566e', ext: 'jpg' }, // coffee jar
  { key: 'lipton',           id: '1576092768241-dec231879fc3', ext: 'jpg' }, // tea box
  { key: 'sprite',           id: '1624552184280-9e8ac97a8d96', ext: 'jpg' }, // green can
  { key: 'sucre',            id: '1558618666-fcd25c85cd64', ext: 'jpg' }, // sugar
  { key: 'farine',           id: '1556909114-f6e7ad7d3136', ext: 'jpg' }, // flour bag
  { key: 'riz',              id: '1586201375761-83865001e31c', ext: 'jpg' }, // rice bag
  { key: 'couscous',         id: '1512058564366-18510be2db19', ext: 'jpg' }, // couscous
  { key: 'huile',            id: '1474979266404-7eaacbcd87c5', ext: 'jpg' }, // cooking oil bottle
  { key: 'semoule',          id: '1536304929831-ee1ca9d44906', ext: 'jpg' }, // semolina
  { key: 'spaghetti',        id: '1551462147-ff29053bfc14', ext: 'jpg' }, // pasta
  { key: 'lait',             id: '1563636619-e9143da7973b', ext: 'jpg' }, // milk carton
  { key: 'lben',             id: '1550583724-b2692b85b150', ext: 'jpg' }, // buttermilk
  { key: 'activia',          id: '1488477181946-6428a0291777', ext: 'jpg' }, // yogurt cups
  { key: 'kiri',             id: '1486297678162-eb2a19b0a32d', ext: 'jpg' }, // cream cheese
  { key: 'beurre',           id: '1589985270827-c4729fa28dff', ext: 'jpg' }, // butter
  { key: 'chips',            id: '1566478989037-eec170784d0b', ext: 'jpg' }, // chips bag
  { key: 'petit-beurre',     id: '1499636667926-4f8c7a22b2c3', ext: 'jpg' }, // biscuits
  { key: 'crackers',         id: '1617347454861-89dcc18d4f68', ext: 'jpg' }, // crackers
  { key: 'milka',            id: '1575377222312-dd1a63a51638', ext: 'jpg' }, // chocolate bar
  { key: 'cacahuetes',       id: '1548476641-1b00c78d74b0', ext: 'jpg' }, // peanuts
  { key: 'sardines',         id: '1571167530149-c1105da4afd4', ext: 'jpg' }, // fish can
  { key: 'tomate',           id: '1592417817098-8fd3d9eb14a5', ext: 'jpg' }, // tomato paste tin
  { key: 'thon',             id: '1599487488170-d11ec9c172f0', ext: 'jpg' }, // tuna can
  { key: 'petits-pois',      id: '1599091439741-62d0a7d73e4d', ext: 'jpg' }, // green peas can
  { key: 'savon',            id: '1584308666744-2d9b6f50c350', ext: 'jpg' }, // soap bar
  { key: 'shampoing',        id: '1556228453-efd6c1ff04f6', ext: 'jpg' }, // shampoo bottle
  { key: 'dentifrice',       id: '1607613009801-e8f0de2ef3e9', ext: 'jpg' }, // toothpaste
  { key: 'papier-toilette',  id: '1584556812952-905ffd0c611a', ext: 'jpg' }, // toilet paper
  { key: 'pril',             id: '1556909115-f158478d5296', ext: 'jpg' }, // dish soap
  { key: 'harissa',          id: '1508615039623-a25605d2b022', ext: 'jpg' }, // chili paste
  { key: 'ketchup',          id: '1619566636210-e648e58fb21b', ext: 'jpg' }, // ketchup bottle
  { key: 'sel',              id: '1518110925495-a37f1ea54ae0', ext: 'jpg' }, // salt
  { key: 'cumin',            id: '1579113800032-c38bd7635818', ext: 'jpg' }, // spice
  { key: 'moutarde',         id: '1568901839119-631418a3910d', ext: 'jpg' }, // mustard
  { key: 'pain-mie',         id: '1549931319-a545dcf3bc73', ext: 'jpg' }, // bread
  { key: 'msemen',           id: '1585937421612-70a008356fbe', ext: 'jpg' }, // flatbread
];

async function download(product) {
  const url = `https://images.unsplash.com/photo-${product.id}?w=512&h=512&fit=crop&auto=format&q=85`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const filename = `${product.key}.${product.ext}`;
  writeFileSync(join(OUT_DIR, filename), buf);
  return { filename, url: `${BASE_URL}/uploads/products/${filename}` };
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`Downloading ${products.length} product images...\n`);
  const results = {};

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`[${i+1}/${products.length}] ${p.key} ... `);
    try {
      const { filename, url } = await download(p);
      results[p.key] = url;
      console.log(`✓ ${filename}`);
    } catch (err) {
      console.log(`✗ ${err.message}`);
      results[p.key] = null;
    }
    if (i < products.length - 1) await sleep(200);
  }

  const ok = Object.values(results).filter(Boolean).length;
  const fail = products.length - ok;
  console.log(`\nDone: ${ok} OK, ${fail} failed`);
  console.log('\nResults JSON:\n' + JSON.stringify(results, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
