import { writeFileSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'backend', 'uploads', 'products');
const BASE_URL = 'http://localhost:4000';

mkdirSync(OUT_DIR, { recursive: true });

const products = [
  { name: 'Sidi Ali 1.5L',                           prompt: 'Sidi Ali 1.5L Moroccan mineral water bottle, professional product photography, white background, studio lighting' },
  { name: 'Sidi Ali 0.5L',                            prompt: 'small 500ml mineral water bottle, professional product photography, white background, studio lighting' },
  { name: 'Coca-Cola 33cl',                           prompt: 'Coca-Cola 330ml aluminum can, professional product photography, white background, studio lighting' },
  { name: 'Pepsi 1.5L',                               prompt: 'Pepsi 1.5L plastic bottle, professional product photography, white background, studio lighting' },
  { name: 'Hawai Jus Orange 1L',                      prompt: 'orange juice carton 1 liter, professional product photography, white background, studio lighting' },
  { name: 'Nescafé Classic 200g',                     prompt: 'Nescafe Classic instant coffee 200g glass jar red lid, professional product photography, white background' },
  { name: 'Thé Lipton Yellow Label 25 sachets',       prompt: 'Lipton Yellow Label tea box 25 teabags, professional product photography, white background, studio lighting' },
  { name: 'Sprite 33cl',                              prompt: 'Sprite 330ml green aluminum can, professional product photography, white background, studio lighting' },
  { name: 'Sucre en Poudre Cosumar 1kg',              prompt: 'white sugar 1kg packet, professional product photography, white background, studio lighting' },
  { name: 'Farine Tendre Bonne Graine 1kg',           prompt: 'wheat flour 1kg paper bag, professional product photography, white background, studio lighting' },
  { name: 'Riz Long Grain 1kg',                       prompt: 'long grain white rice 1kg bag, professional product photography, white background, studio lighting' },
  { name: 'Couscous Moyen Dari 1kg',                  prompt: 'couscous semolina 1kg packet, professional product photography, white background, studio lighting' },
  { name: 'Huile de Tournesol Lesieur 1L',            prompt: 'sunflower cooking oil 1L clear bottle, professional product photography, white background, studio lighting' },
  { name: 'Semoule Fine 1kg',                         prompt: 'fine wheat semolina 1kg bag, professional product photography, white background, studio lighting' },
  { name: 'Pâtes Spaghetti El Mazraa 500g',           prompt: 'spaghetti pasta 500g packet, professional product photography, white background, studio lighting' },
  { name: 'Lait Jaouda 1L',                           prompt: 'pasteurized milk 1L carton brick, professional product photography, white background, studio lighting' },
  { name: 'Lben 1L',                                  prompt: 'Moroccan fermented buttermilk lben 1L carton, professional product photography, white background, studio lighting' },
  { name: 'Yaourt Nature Activia 125g x4',            prompt: 'Activia plain yogurt 4-pack cups, professional product photography, white background, studio lighting' },
  { name: 'Fromage Kiri 8 portions',                  prompt: 'Kiri cream cheese 8 portions triangles box, professional product photography, white background, studio lighting' },
  { name: 'Beurre Président 200g',                    prompt: 'butter 200g foil wrapped block, professional product photography, white background, studio lighting' },
  { name: 'Bimo Chips Nature 60g',                    prompt: 'potato chips 60g snack bag, professional product photography, white background, studio lighting' },
  { name: 'Biscuits Petit Beurre LU 200g',            prompt: 'LU Petit Beurre butter biscuits 200g packet, professional product photography, white background, studio lighting' },
  { name: 'Crackers Club Social 150g',                prompt: 'salted crackers 150g packet, professional product photography, white background, studio lighting' },
  { name: 'Chocolat Milka Lait 100g',                 prompt: 'Milka milk chocolate bar 100g purple wrapper, professional product photography, white background, studio lighting' },
  { name: 'Cacahuètes Grillées 100g',                 prompt: 'roasted salted peanuts 100g bag, professional product photography, white background, studio lighting' },
  { name: 'Sardines à l\'Huile Saupiquet 125g',       prompt: 'canned sardines in olive oil 125g tin, professional product photography, white background, studio lighting' },
  { name: 'Concentré de Tomate Aicha 70g',            prompt: 'tomato paste concentrate 70g small tin can, professional product photography, white background, studio lighting' },
  { name: 'Thon à l\'Huile Rio Mare 160g',            prompt: 'Rio Mare tuna in olive oil 160g can, professional product photography, white background, studio lighting' },
  { name: 'Petits Pois Extra Fins 400g',              prompt: 'green peas 400g tin can, professional product photography, white background, studio lighting' },
  { name: 'Savon Hammam Palmolive 100g',              prompt: 'Palmolive Hammam soap bar 100g, professional product photography, white background, studio lighting' },
  { name: 'Shampoing Pantene Lisse & Brillant 400ml', prompt: 'Pantene shampoo 400ml bottle, professional product photography, white background, studio lighting' },
  { name: 'Dentifrice Signal White 75ml',             prompt: 'Signal toothpaste 75ml tube, professional product photography, white background, studio lighting' },
  { name: 'Papier Toilette Tempo x6',                 prompt: 'toilet paper roll 6-pack, professional product photography, white background, studio lighting' },
  { name: 'Liquide Vaisselle Pril 500ml',             prompt: 'Pril lemon dish soap 500ml bottle, professional product photography, white background, studio lighting' },
  { name: 'Harissa Aïcha 135g',                       prompt: 'harissa chili paste 135g tin can, Moroccan condiment, professional product photography, white background' },
  { name: 'Ketchup Heinz 342g',                       prompt: 'Heinz tomato ketchup 342g bottle, professional product photography, white background, studio lighting' },
  { name: 'Sel de Table Salines du Midi 1kg',         prompt: 'table salt 1kg packet, professional product photography, white background, studio lighting' },
  { name: 'Cumin Moulu La Cigogne 50g',               prompt: 'ground cumin spice 50g sachet, professional product photography, white background, studio lighting' },
  { name: 'Moutarde Amora 200g',                      prompt: 'Amora Dijon mustard 200g tube, professional product photography, white background, studio lighting' },
  { name: 'Pain de Mie Harry\'s Nature 500g',         prompt: 'sandwich bread loaf 500g package, professional product photography, white background, studio lighting' },
  { name: 'Msemen Surgelé x6',                        prompt: 'Moroccan msemen flatbread 6-pack package, professional product photography, white background, studio lighting' },
];

async function downloadImage(product, index) {
  const encoded = encodeURIComponent(product.prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${index + 42}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const ext = contentType.includes('png') ? '.png' : '.jpg';
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(join(OUT_DIR, filename), buffer);
  return { filename, url: `${BASE_URL}/uploads/products/${filename}` };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Generating ${products.length} product images via Pollinations.ai (FLUX model)...\n`);
  const results = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    process.stdout.write(`[${i + 1}/${products.length}] ${product.name} ... `);
    try {
      const { filename, url } = await downloadImage(product, i);
      results.push({ name: product.name, filename, url });
      console.log(`✓ ${filename}`);
    } catch (err) {
      console.log(`✗ ${err.message}`);
      results.push({ name: product.name, filename: null, url: null, error: err.message });
    }
    if (i < products.length - 1) await sleep(500);
  }

  const succeeded = results.filter(r => r.url);
  const failed = results.filter(r => !r.url);

  console.log(`\nDone: ${succeeded.length} OK, ${failed.length} failed`);

  if (succeeded.length > 0) {
    console.log('\n=== SEED URL MAP ===');
    for (const r of results) {
      if (r.url) console.log(`  '${r.name}': '${r.url}',`);
      else console.log(`  '${r.name}': null, // ${r.error}`);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
