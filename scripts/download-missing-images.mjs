import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'backend', 'uploads', 'products');
const BASE_URL = 'http://localhost:4000';
mkdirSync(OUT_DIR, { recursive: true });

// Alt IDs for the 13 that 404'd
const missing = [
  { key: 'pepsi',        id: '1629203851122-3726e06cccab' }, // pepsi bottle (from seed - try again)
  { key: 'pepsi',        id: '1602143407894-4f8d1f75a4fd' }, // soda bottle alt
  { key: 'sprite',       id: '1625772299848-391b6a87d7b3' }, // green can
  { key: 'sprite',       id: '1622483767028-3f66f32aef97' }, // cold drinks
  { key: 'beurre',       id: '1449824913935-59a10b8d2000' }, // butter
  { key: 'beurre',       id: '1558642891-54be180ea339' }, // butter block
  { key: 'petit-beurre', id: '1508610048659-a06b669e3321' }, // biscuits
  { key: 'petit-beurre', id: '1620840867747-d8d1b09c50c6' }, // cookies
  { key: 'crackers',     id: '1617347454861-89dcc18d4f68' }, // crackers (retry)
  { key: 'crackers',     id: '1525351326368-ef539aa65c4b' }, // crackers alt
  { key: 'cacahuetes',   id: '1599599810694-b5b37304c041' }, // peanuts
  { key: 'cacahuetes',   id: '1574856344991-9cdc736e0b1a' }, // nuts bowl
  { key: 'sardines',     id: '1544551763-46a013bb70d5' }, // fish can
  { key: 'sardines',     id: '1571167530149-c1105da4afd4' }, // sardines (retry)
  { key: 'petits-pois',  id: '1563565453-0f8d5bda59ba' }, // peas can
  { key: 'petits-pois',  id: '1590779033100-9f60a05a2135' }, // green peas
  { key: 'savon',        id: '1600857544200-b2f666a9a2ec' }, // soap bar
  { key: 'savon',        id: '1582735689369-4fe89db7114c' }, // soap
  { key: 'dentifrice',   id: '1556742049-0cfed4f6a45d' }, // toothpaste
  { key: 'dentifrice',   id: '1607613009801-e8f0de2ef3e9' }, // toothpaste (retry)
  { key: 'pril',         id: '1563453392212-326f5e854473' }, // dish soap
  { key: 'pril',         id: '1585421514284-efb74c2b69ba' }, // cleaning product
  { key: 'ketchup',      id: '1532636875304-0c89119d9b4d' }, // ketchup bottle
  { key: 'ketchup',      id: '1619566636210-e648e58fb21b' }, // ketchup (retry)
  { key: 'sel',          id: '1502741338009-cac2772e18bc' }, // salt
  { key: 'sel',          id: '1518110925495-a37f1ea54ae0' }, // salt (retry)
];

// Deduplicate: try each key, use first success
const needed = ['pepsi','sprite','beurre','petit-beurre','crackers','cacahuetes','sardines','petits-pois','savon','dentifrice','pril','ketchup','sel'];
const done = new Set();

async function tryDownload(key, id) {
  const url = `https://images.unsplash.com/photo-${id}?w=512&h=512&fit=crop&auto=format&q=85`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(OUT_DIR, `${key}.jpg`), buf);
  return `${BASE_URL}/uploads/products/${key}.jpg`;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('Retrying 13 missing images with alt photo IDs...\n');
  const results = {};

  for (const { key, id } of missing) {
    if (done.has(key)) continue;
    process.stdout.write(`  ${key} (${id.slice(0,8)}...) ... `);
    try {
      const url = await tryDownload(key, id);
      done.add(key);
      results[key] = url;
      console.log('✓');
    } catch (e) {
      console.log(`✗ ${e.message} — will try next alt`);
    }
    await sleep(150);
  }

  const stillMissing = needed.filter(k => !done.has(k));
  console.log(`\nFixed: ${done.size}/${needed.length}`);
  if (stillMissing.length) console.log('Still missing:', stillMissing.join(', '));
  console.log('\nURL map:\n' + JSON.stringify(results, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
