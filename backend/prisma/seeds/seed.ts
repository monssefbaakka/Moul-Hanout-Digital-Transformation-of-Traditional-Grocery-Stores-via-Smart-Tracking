import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding shop, users, categories, and products...');

  const ownerPassword = await bcrypt.hash('Admin@123!', 12);
  const cashierPassword = await bcrypt.hash('Cashier@123!', 12);

  let shop = await prisma.shop.findFirst({ where: { name: 'Main Shop' } });
  if (!shop) {
    shop = await prisma.shop.create({ data: { name: 'Main Shop' } });
  }

  const owner = await prisma.user.upsert({
    where: { email: 'owner@moulhanout.ma' },
    update: {},
    create: {
      email: 'owner@moulhanout.ma',
      password: ownerPassword,
      name: 'Store Owner',
      shopRoles: {
        create: {
          shopId: shop.id,
          role: Role.OWNER,
        },
      },
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@moulhanout.ma' },
    update: {},
    create: {
      email: 'cashier@moulhanout.ma',
      password: cashierPassword,
      name: 'Default Cashier',
      shopRoles: {
        create: {
          shopId: shop.id,
          role: Role.CASHIER,
        },
      },
    },
  });

  const categorySeeds = [
    { name: 'Boissons', description: 'Eaux, jus, sodas et boissons chaudes' },
    { name: 'Épicerie Sèche', description: 'Riz, farine, sucre, huile et produits de base' },
    { name: 'Produits Laitiers', description: 'Lait, yaourt, fromage et beurre' },
    { name: 'Snacks & Biscuits', description: 'Chips, biscuits et en-cas' },
    { name: 'Conserves', description: 'Sardines, thon, concentré de tomate et légumes' },
    { name: 'Hygiène & Entretien', description: 'Savon, shampoing, dentifrice et nettoyants' },
    { name: 'Condiments & Épices', description: 'Harissa, ketchup, sel, épices et sauces' },
    { name: 'Pain & Viennoiserie', description: 'Pain de mie, croissants et pâtisseries' },
  ];

  const categoryMap = new Map<string, { id: string; name: string }>();

  for (const categorySeed of categorySeeds) {
    const existingCategory = await prisma.category.findFirst({
      where: { shopId: shop.id, name: categorySeed.name },
      select: { id: true, name: true },
    });

    const category = existingCategory
      ? await prisma.category.update({
          where: { id: existingCategory.id },
          data: { description: categorySeed.description, isActive: true },
          select: { id: true, name: true },
        })
      : await prisma.category.create({
          data: {
            shopId: shop.id,
            name: categorySeed.name,
            description: categorySeed.description,
            isActive: true,
          },
          select: { id: true, name: true },
        });

    categoryMap.set(category.name, category);
  }

  // Dates for expiration
  const d = (iso: string) => new Date(iso);
  const near = d('2026-06-15T00:00:00.000Z');   // ~1 month away
  const mid  = d('2026-09-01T00:00:00.000Z');   // ~3 months away
  const far  = d('2027-03-01T00:00:00.000Z');   // ~10 months away

  const productSeeds = [
    // ── BOISSONS ─────────────────────────────────────────────────────────────
    {
      name: 'Sidi Ali 1.5L',
      categoryName: 'Boissons',
      barcode: '6111014001502',
      salePrice: 6,
      costPrice: 4,
      description: 'Eau minérale naturelle marocaine 1.5L',
      unit: 'bouteille',
      photo: 'http://localhost:4000/uploads/products/sidi-ali-15.jpg',
      lowStockThreshold: 24,
      currentStock: 120,
      expirationDate: null,
    },
    {
      name: 'Sidi Ali 0.5L',
      categoryName: 'Boissons',
      barcode: '6111014000505',
      salePrice: 3,
      costPrice: 2,
      description: 'Eau minérale naturelle marocaine 0.5L',
      unit: 'bouteille',
      photo: 'http://localhost:4000/uploads/products/sidi-ali-05.jpg',
      lowStockThreshold: 30,
      currentStock: 200,
      expirationDate: null,
    },
    {
      name: 'Coca-Cola 33cl',
      categoryName: 'Boissons',
      barcode: '5449000000996',
      salePrice: 8,
      costPrice: 5.5,
      description: 'Boisson gazeuse Coca-Cola canette 33cl',
      unit: 'canette',
      photo: 'http://localhost:4000/uploads/products/coca-cola.jpg',
      lowStockThreshold: 12,
      currentStock: 48,
      expirationDate: far,
    },
    {
      name: 'Pepsi 1.5L',
      categoryName: 'Boissons',
      barcode: '4902102113137',
      salePrice: 12,
      costPrice: 8,
      description: 'Boisson gazeuse Pepsi 1.5L',
      unit: 'bouteille',
      photo: 'http://localhost:4000/uploads/products/pepsi.jpg',
      lowStockThreshold: 12,
      currentStock: 36,
      expirationDate: far,
    },
    {
      name: 'Hawai Jus Orange 1L',
      categoryName: 'Boissons',
      barcode: '6111069012018',
      salePrice: 14,
      costPrice: 10,
      description: 'Nectar d\'orange Hawai 1L',
      unit: 'brick',
      photo: 'http://localhost:4000/uploads/products/jus-orange.jpg',
      lowStockThreshold: 8,
      currentStock: 24,
      expirationDate: mid,
    },
    {
      name: 'Nescafé Classic 200g',
      categoryName: 'Boissons',
      barcode: '7613036626378',
      salePrice: 55,
      costPrice: 42,
      description: 'Café soluble Nescafé Classic 200g',
      unit: 'bocal',
      photo: 'http://localhost:4000/uploads/products/nescafe.jpg',
      lowStockThreshold: 5,
      currentStock: 18,
      expirationDate: far,
    },
    {
      name: 'Thé Lipton Yellow Label 25 sachets',
      categoryName: 'Boissons',
      barcode: '8718114710556',
      salePrice: 20,
      costPrice: 14,
      description: 'Thé noir Lipton Yellow Label 25 sachets',
      unit: 'boîte',
      photo: 'http://localhost:4000/uploads/products/lipton.jpg',
      lowStockThreshold: 6,
      currentStock: 30,
      expirationDate: far,
    },
    {
      name: 'Sprite 33cl',
      categoryName: 'Boissons',
      barcode: '5449000054227',
      salePrice: 8,
      costPrice: 5.5,
      description: 'Boisson gazeuse Sprite citron-citron vert 33cl',
      unit: 'canette',
      photo: 'http://localhost:4000/uploads/products/sprite.jpg',
      lowStockThreshold: 12,
      currentStock: 5,
      expirationDate: far,
    },

    // ── ÉPICERIE SÈCHE ────────────────────────────────────────────────────────
    {
      name: 'Sucre en Poudre Cosumar 1kg',
      categoryName: 'Épicerie Sèche',
      barcode: '6111059000019',
      salePrice: 9,
      costPrice: 7,
      description: 'Sucre blanc raffiné Cosumar 1kg',
      unit: 'paquet',
      photo: 'http://localhost:4000/uploads/products/sucre.jpg',
      lowStockThreshold: 10,
      currentStock: 60,
      expirationDate: null,
    },
    {
      name: 'Farine Tendre Bonne Graine 1kg',
      categoryName: 'Épicerie Sèche',
      barcode: '6111075000012',
      salePrice: 8,
      costPrice: 6,
      description: 'Farine de blé tendre 1kg',
      unit: 'paquet',
      photo: 'http://localhost:4000/uploads/products/farine.jpg',
      lowStockThreshold: 10,
      currentStock: 40,
      expirationDate: mid,
    },
    {
      name: 'Riz Long Grain 1kg',
      categoryName: 'Épicerie Sèche',
      barcode: '6111070001019',
      salePrice: 16,
      costPrice: 12,
      description: 'Riz long grain blanc 1kg',
      unit: 'paquet',
      photo: 'http://localhost:4000/uploads/products/riz.jpg',
      lowStockThreshold: 8,
      currentStock: 35,
      expirationDate: null,
    },
    {
      name: 'Couscous Moyen Dari 1kg',
      categoryName: 'Épicerie Sèche',
      barcode: '6111060001017',
      salePrice: 18,
      costPrice: 13,
      description: 'Semoule de blé dur moyenne Dari 1kg',
      unit: 'paquet',
      photo: 'http://localhost:4000/uploads/products/couscous.jpg',
      lowStockThreshold: 8,
      currentStock: 28,
      expirationDate: null,
    },
    {
      name: 'Huile de Tournesol Lesieur 1L',
      categoryName: 'Épicerie Sèche',
      barcode: '3068320009001',
      salePrice: 25,
      costPrice: 19,
      description: 'Huile de tournesol Lesieur 1L',
      unit: 'bouteille',
      photo: 'http://localhost:4000/uploads/products/huile.jpg',
      lowStockThreshold: 6,
      currentStock: 22,
      expirationDate: far,
    },
    {
      name: 'Semoule Fine 1kg',
      categoryName: 'Épicerie Sèche',
      barcode: '6111060002014',
      salePrice: 13,
      costPrice: 9,
      description: 'Semoule de blé fine pour harira 1kg',
      unit: 'paquet',
      photo: 'http://localhost:4000/uploads/products/semoule.jpg',
      lowStockThreshold: 6,
      currentStock: 4,
      expirationDate: null,
    },
    {
      name: 'Pâtes Spaghetti El Mazraa 500g',
      categoryName: 'Épicerie Sèche',
      barcode: '6111015000018',
      salePrice: 9,
      costPrice: 6.5,
      description: 'Spaghetti de blé dur El Mazraa 500g',
      unit: 'paquet',
      photo: 'http://localhost:4000/uploads/products/spaghetti.jpg',
      lowStockThreshold: 8,
      currentStock: 45,
      expirationDate: far,
    },

    // ── PRODUITS LAITIERS ─────────────────────────────────────────────────────
    {
      name: 'Lait Jaouda 1L',
      categoryName: 'Produits Laitiers',
      barcode: '6111046001015',
      salePrice: 11,
      costPrice: 8,
      description: 'Lait pasteurisé demi-écrémé Jaouda 1L',
      unit: 'brick',
      photo: 'http://localhost:4000/uploads/products/lait.jpg',
      lowStockThreshold: 12,
      currentStock: 50,
      expirationDate: near,
    },
    {
      name: 'Lben 1L',
      categoryName: 'Produits Laitiers',
      barcode: '6111046002012',
      salePrice: 9,
      costPrice: 6.5,
      description: 'Lait fermenté Lben 1L',
      unit: 'brick',
      photo: 'http://localhost:4000/uploads/products/lben.jpg',
      lowStockThreshold: 8,
      currentStock: 30,
      expirationDate: near,
    },
    {
      name: 'Yaourt Nature Activia 125g x4',
      categoryName: 'Produits Laitiers',
      barcode: '7622210100580',
      salePrice: 16,
      costPrice: 12,
      description: 'Yaourt nature Activia pack de 4 x125g',
      unit: 'pack',
      photo: 'http://localhost:4000/uploads/products/activia.jpg',
      lowStockThreshold: 6,
      currentStock: 20,
      expirationDate: near,
    },
    {
      name: 'Fromage Kiri 8 portions',
      categoryName: 'Produits Laitiers',
      barcode: '3033710027744',
      salePrice: 25,
      costPrice: 19,
      description: 'Fromage fondu Kiri 8 portions',
      unit: 'boîte',
      photo: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop',
      lowStockThreshold: 5,
      currentStock: 15,
      expirationDate: mid,
    },
    {
      name: 'Beurre Président 200g',
      categoryName: 'Produits Laitiers',
      barcode: '3228020210015',
      salePrice: 32,
      costPrice: 25,
      description: 'Beurre doux Président 200g',
      unit: 'plaquette',
      photo: 'https://images.unsplash.com/photo-1589985270827-c4729fa28dff?w=400&h=400&fit=crop',
      lowStockThreshold: 4,
      currentStock: 12,
      expirationDate: mid,
    },

    // ── SNACKS & BISCUITS ─────────────────────────────────────────────────────
    {
      name: 'Bimo Chips Nature 60g',
      categoryName: 'Snacks & Biscuits',
      barcode: '6111024001064',
      salePrice: 7,
      costPrice: 4.5,
      description: 'Chips de pomme de terre nature Bimo 60g',
      unit: 'sachet',
      photo: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop',
      lowStockThreshold: 15,
      currentStock: 80,
      expirationDate: mid,
    },
    {
      name: 'Biscuits Petit Beurre LU 200g',
      categoryName: 'Snacks & Biscuits',
      barcode: '7622210449153',
      salePrice: 10,
      costPrice: 7,
      description: 'Biscuits Petit Beurre LU 200g',
      unit: 'paquet',
      photo: 'https://images.unsplash.com/photo-1499636667926-4f8c7a22b2c3?w=400&h=400&fit=crop',
      lowStockThreshold: 10,
      currentStock: 35,
      expirationDate: far,
    },
    {
      name: 'Crackers Club Social 150g',
      categoryName: 'Snacks & Biscuits',
      barcode: '7622210452009',
      salePrice: 12,
      costPrice: 8.5,
      description: 'Crackers salés Club Social 150g',
      unit: 'paquet',
      photo: 'https://images.unsplash.com/photo-1517456793572-1396f0c62ee8?w=400&h=400&fit=crop',
      lowStockThreshold: 8,
      currentStock: 25,
      expirationDate: far,
    },
    {
      name: 'Chocolat Milka Lait 100g',
      categoryName: 'Snacks & Biscuits',
      barcode: '7622210951939',
      salePrice: 22,
      costPrice: 16,
      description: 'Tablette chocolat au lait Milka 100g',
      unit: 'tablette',
      photo: 'https://images.unsplash.com/photo-1575377222312-dd1a63a51638?w=400&h=400&fit=crop',
      lowStockThreshold: 5,
      currentStock: 20,
      expirationDate: far,
    },
    {
      name: 'Cacahuètes Grillées 100g',
      categoryName: 'Snacks & Biscuits',
      barcode: '6111080001009',
      salePrice: 7,
      costPrice: 5,
      description: 'Arachides grillées salées 100g',
      unit: 'sachet',
      photo: 'https://images.unsplash.com/photo-1548476641-1b00c78d74b0?w=400&h=400&fit=crop',
      lowStockThreshold: 10,
      currentStock: 3,
      expirationDate: mid,
    },

    // ── CONSERVES ─────────────────────────────────────────────────────────────
    {
      name: 'Sardines à l\'Huile Saupiquet 125g',
      categoryName: 'Conserves',
      barcode: '3162980001054',
      salePrice: 13,
      costPrice: 9,
      description: 'Sardines entières à l\'huile d\'olive 125g',
      unit: 'boîte',
      photo: 'https://images.unsplash.com/photo-1571167530149-c1105da4afd4?w=400&h=400&fit=crop',
      lowStockThreshold: 8,
      currentStock: 40,
      expirationDate: far,
    },
    {
      name: 'Concentré de Tomate Aicha 70g',
      categoryName: 'Conserves',
      barcode: '6111035000070',
      salePrice: 5,
      costPrice: 3.5,
      description: 'Double concentré de tomate Aicha 70g',
      unit: 'boîte',
      photo: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400&h=400&fit=crop',
      lowStockThreshold: 12,
      currentStock: 60,
      expirationDate: far,
    },
    {
      name: 'Thon à l\'Huile Rio Mare 160g',
      categoryName: 'Conserves',
      barcode: '8004030303051',
      salePrice: 28,
      costPrice: 21,
      description: 'Filets de thon à l\'huile d\'olive Rio Mare 160g',
      unit: 'boîte',
      photo: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop',
      lowStockThreshold: 5,
      currentStock: 18,
      expirationDate: far,
    },
    {
      name: 'Petits Pois Extra Fins 400g',
      categoryName: 'Conserves',
      barcode: '3012420001552',
      salePrice: 13,
      costPrice: 9.5,
      description: 'Petits pois extra fins en conserve 400g',
      unit: 'boîte',
      photo: 'https://images.unsplash.com/photo-1599091439741-62d0a7d73e4d?w=400&h=400&fit=crop',
      lowStockThreshold: 6,
      currentStock: 22,
      expirationDate: far,
    },

    // ── HYGIÈNE & ENTRETIEN ───────────────────────────────────────────────────
    {
      name: 'Savon Hammam Palmolive 100g',
      categoryName: 'Hygiène & Entretien',
      barcode: '8718951247161',
      salePrice: 6,
      costPrice: 4,
      description: 'Savon de toilette Palmolive Hammam 100g',
      unit: 'pain',
      photo: 'https://images.unsplash.com/photo-1584308666744-2d9b6f50c350?w=400&h=400&fit=crop',
      lowStockThreshold: 8,
      currentStock: 50,
      expirationDate: null,
    },
    {
      name: 'Shampoing Pantene Lisse & Brillant 400ml',
      categoryName: 'Hygiène & Entretien',
      barcode: '8001841390659',
      salePrice: 38,
      costPrice: 28,
      description: 'Shampoing Pantene Pro-V lisse et brillant 400ml',
      unit: 'flacon',
      photo: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=400&fit=crop',
      lowStockThreshold: 4,
      currentStock: 14,
      expirationDate: null,
    },
    {
      name: 'Dentifrice Signal White 75ml',
      categoryName: 'Hygiène & Entretien',
      barcode: '8717163584422',
      salePrice: 20,
      costPrice: 14,
      description: 'Dentifrice Signal White System 75ml',
      unit: 'tube',
      photo: 'https://images.unsplash.com/photo-1607613009801-e8f0de2ef3e9?w=400&h=400&fit=crop',
      lowStockThreshold: 5,
      currentStock: 20,
      expirationDate: null,
    },
    {
      name: 'Papier Toilette Tempo x6',
      categoryName: 'Hygiène & Entretien',
      barcode: '4015600282547',
      salePrice: 32,
      costPrice: 24,
      description: 'Papier toilette Tempo double épaisseur x6 rouleaux',
      unit: 'paquet',
      photo: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=400&h=400&fit=crop',
      lowStockThreshold: 4,
      currentStock: 16,
      expirationDate: null,
    },
    {
      name: 'Liquide Vaisselle Pril 500ml',
      categoryName: 'Hygiène & Entretien',
      barcode: '8720181119361',
      salePrice: 20,
      costPrice: 14,
      description: 'Liquide vaisselle Pril citron 500ml',
      unit: 'flacon',
      photo: 'https://images.unsplash.com/photo-1556909115-f158478d5296?w=400&h=400&fit=crop',
      lowStockThreshold: 5,
      currentStock: 2,
      expirationDate: null,
    },

    // ── CONDIMENTS & ÉPICES ───────────────────────────────────────────────────
    {
      name: 'Harissa Aïcha 135g',
      categoryName: 'Condiments & Épices',
      barcode: '6111035001350',
      salePrice: 9,
      costPrice: 6.5,
      description: 'Harissa tunisienne Aïcha 135g',
      unit: 'boîte',
      photo: 'https://images.unsplash.com/photo-1526181899374-42f5f0d7bc87?w=400&h=400&fit=crop',
      lowStockThreshold: 6,
      currentStock: 30,
      expirationDate: far,
    },
    {
      name: 'Ketchup Heinz 342g',
      categoryName: 'Condiments & Épices',
      barcode: '0057000012181',
      salePrice: 26,
      costPrice: 19,
      description: 'Ketchup Heinz tomate 342g',
      unit: 'bouteille',
      photo: 'https://images.unsplash.com/photo-1619566636210-e648e58fb21b?w=400&h=400&fit=crop',
      lowStockThreshold: 4,
      currentStock: 12,
      expirationDate: far,
    },
    {
      name: 'Sel de Table Salines du Midi 1kg',
      categoryName: 'Condiments & Épices',
      barcode: '3282780012172',
      salePrice: 4,
      costPrice: 2.5,
      description: 'Sel de table fin iodé 1kg',
      unit: 'paquet',
      photo: 'https://images.unsplash.com/photo-1518110925495-a37f1ea54ae0?w=400&h=400&fit=crop',
      lowStockThreshold: 8,
      currentStock: 45,
      expirationDate: null,
    },
    {
      name: 'Cumin Moulu La Cigogne 50g',
      categoryName: 'Condiments & Épices',
      barcode: '6111090000506',
      salePrice: 7,
      costPrice: 5,
      description: 'Cumin moulu La Cigogne sachet 50g',
      unit: 'sachet',
      photo: 'https://images.unsplash.com/photo-1597081989543-efc9a1fac250?w=400&h=400&fit=crop',
      lowStockThreshold: 5,
      currentStock: 25,
      expirationDate: far,
    },
    {
      name: 'Moutarde Amora 200g',
      categoryName: 'Condiments & Épices',
      barcode: '3032900003030',
      salePrice: 20,
      costPrice: 14,
      description: 'Moutarde de Dijon Amora 200g',
      unit: 'tube',
      photo: 'https://images.unsplash.com/photo-1568901839119-631418a3910d?w=400&h=400&fit=crop',
      lowStockThreshold: 4,
      currentStock: 10,
      expirationDate: far,
    },

    // ── PAIN & VIENNOISERIE ───────────────────────────────────────────────────
    {
      name: 'Pain de Mie Harry\'s Nature 500g',
      categoryName: 'Pain & Viennoiserie',
      barcode: '3256227002015',
      salePrice: 18,
      costPrice: 13,
      description: 'Pain de mie complet Harry\'s 500g',
      unit: 'sachet',
      photo: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=400&fit=crop',
      lowStockThreshold: 5,
      currentStock: 12,
      expirationDate: near,
    },
    {
      name: 'Msemen Surgele x6',
      categoryName: 'Pain & Viennoiserie',
      barcode: '6111095000619',
      salePrice: 22,
      costPrice: 16,
      description: 'Msemen marocain surgelé prêt à cuire x6 pièces',
      unit: 'paquet',
      photo: 'https://images.unsplash.com/photo-1600850056064-a8b29c11b8c5?w=400&h=400&fit=crop',
      lowStockThreshold: 4,
      currentStock: 8,
      expirationDate: d('2026-08-01T00:00:00.000Z'),
    },
  ];

  let created = 0;
  let updated = 0;

  for (const productSeed of productSeeds) {
    const category = categoryMap.get(productSeed.categoryName);
    if (!category) {
      throw new Error(`Missing category: ${productSeed.categoryName}`);
    }

    const existing = await prisma.product.findUnique({
      where: { shopId_barcode: { shopId: shop.id, barcode: productSeed.barcode } },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          categoryId: category.id,
          name: productSeed.name,
          description: productSeed.description,
          isActive: true,
          unit: productSeed.unit,
          photo: productSeed.photo,
          salePrice: productSeed.salePrice,
          costPrice: productSeed.costPrice,
          lowStockThreshold: productSeed.lowStockThreshold,
          currentStock: productSeed.currentStock,
          expirationDate: productSeed.expirationDate,
        },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: {
          shopId: shop.id,
          categoryId: category.id,
          name: productSeed.name,
          description: productSeed.description,
          isActive: true,
          unit: productSeed.unit,
          photo: productSeed.photo,
          barcode: productSeed.barcode,
          salePrice: productSeed.salePrice,
          costPrice: productSeed.costPrice,
          lowStockThreshold: productSeed.lowStockThreshold,
          currentStock: productSeed.currentStock,
          expirationDate: productSeed.expirationDate,
        },
      });
      created++;
    }
  }

  console.log(`Users: ${owner.email}, ${cashier.email}`);
  console.log(`Categories: ${categorySeeds.length}`);
  console.log(`Products: ${created} created, ${updated} updated (${productSeeds.length} total)`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
