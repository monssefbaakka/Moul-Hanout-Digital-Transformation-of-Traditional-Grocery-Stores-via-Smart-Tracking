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

  const productSeeds = [
    {
      name: 'Aïn Saïss Pack Familial Eau minérale 6 x 1,5L',
      categoryName: 'Boissons',
      barcode: '3300',
      salePrice: 22.4,
      costPrice: 25.0,
      description:
        'Eau minérale naturelle. Riche en calcium, magnésium, sodium et potassium. Contenance : 6 x 1,5 L = 9 L.',
      unit: 'Pack (6 x 1,5L = 9L)',
      photo: 'https://res.cloudinary.com/dcphm6bor/image/upload/q_75,f_auto,w_828/v1747947014/product/c3234d198146bb5b4fd7d49f65b2a9b8.webp',
      lowStockThreshold: 5,
      currentStock: 0,
      expirationDate: null,
    },
    {
      name: 'Fromage Edam boule environ 900g - KROON',
      categoryName: 'Produits Laitiers',
      barcode: '27479',
      salePrice: 102.95,
      costPrice: 142.95,
      description:
        'Fromage Edam en boule, à la pâte ferme et à la saveur douce et légèrement salée. Conservation : endroit frais et sec. Poids : environ 900 g.',
      unit: 'kg (~900g)',
      photo: 'https://res.cloudinary.com/dcphm6bor/image/upload/q_75,f_auto,w_828/v1761209494/product/9de5676967e2eaea456e11ea3dc427b6.webp',
      lowStockThreshold: 5,
      currentStock: 0,
      expirationDate: null,
    },
    {
      name: 'Farine fleur pâtissière de blé tendre 10Kg - KENZ',
      categoryName: 'Épicerie Sèche',
      barcode: '4614',
      salePrice: 54.95,
      costPrice: 57.5,
      description:
        'Farine fleur pâtissière reconnue pour sa finesse et sa qualité supérieure. Idéale pour gâteaux, pains, crêpes et pâtisseries. Garantit une texture légère et moelleuse.',
      unit: 'kg (10 Kg)',
      photo: 'https://res.cloudinary.com/dcphm6bor/image/upload/q_75,f_auto,w_828/v1775569596/product/413de78dd1116c5a20c142f4a8d2a61a.webp',
      lowStockThreshold: 5,
      currentStock: 0,
      expirationDate: null,
    },
    {
      name: 'Boissons gazeuses (coca + sprite + hawai tropical + hawai) 4x1L',
      categoryName: 'Boissons',
      barcode: '56094',
      salePrice: 27.95,
      costPrice: 31.95,
      description:
        'Boissons gazeuses assorties (Coca, Sprite, Hawai Tropical, Hawai). Parfaites à partager en famille ou entre amis. Contenance : 4 x 1 L.',
      unit: 'Pack (4 x 1L)',
      photo: 'https://res.cloudinary.com/dcphm6bor/image/upload/q_75,f_auto,w_828/v1777304046/product/4c53aabda57126675313cdacc5c4914d.webp',
      lowStockThreshold: 5,
      currentStock: 0,
      expirationDate: null,
    },
    {
      name: 'Couscous moyen 3x500g - AL ITKANE',
      categoryName: 'Épicerie Sèche',
      barcode: '56104',
      salePrice: 14.5,
      costPrice: 21.5,
      description:
        'Couscous moyen aux grains réguliers et de qualité. Idéal pour plats traditionnels. Offre avec 1 paquet gratuit inclus.',
      unit: 'Pack (2 x 500g + 1 gratuit)',
      photo: 'https://res.cloudinary.com/dcphm6bor/image/upload/q_75,f_auto,w_828/v1777367110/product/8a48c94e7054eb71ec5a26caf45d2426.webp',
      lowStockThreshold: 5,
      currentStock: 0,
      expirationDate: null,
    },
    {
      name: "Thon entier à l'huile végétale 3x85g - DELFY",
      categoryName: 'Conserves',
      barcode: '43929',
      salePrice: 25.95,
      costPrice: 33.5,
      description:
        "Thon entier savoureux, conservé à l'huile végétale. Idéal pour salades, sandwichs et plats cuisinés. Format pratique 3x85 g.",
      unit: 'Pack (3 x 85g)',
      photo: 'https://res.cloudinary.com/dcphm6bor/image/upload/q_75,f_auto,w_828/v1744385334/product/7f5ec0d33a3e3f245ecbebd63449c8ef.webp',
      lowStockThreshold: 5,
      currentStock: 0,
      expirationDate: null,
    },
    {
      name: 'Fromage frais à tartiner 2x190g - JEBLI',
      categoryName: 'Produits Laitiers',
      barcode: '475',
      salePrice: 23.5,
      costPrice: 29.95,
      description:
        'Fromage frais à tartiner et à cuisiner. 19% de matière grasse. Valeur énergétique : 225 Kcal/100g. Poids net : 2 x 190 g.',
      unit: 'Pack (2 x 190g)',
      photo: 'https://res.cloudinary.com/dcphm6bor/image/upload/q_75,f_auto,w_828/v1755692545/product/2091042152b3ee03b925eaa3c9466fb2.webp',
      lowStockThreshold: 5,
      currentStock: 0,
      expirationDate: null,
    },
    {
      name: 'Oulmès Eau minérale gazeuse 6x1L',
      categoryName: 'Boissons',
      barcode: '7997',
      salePrice: 36.95,
      costPrice: 41.7,
      description:
        "Eau minérale naturelle délicatement gazéifiée. Captée à la source d'Oulmès dans les montagnes du Moyen Atlas au Maroc.",
      unit: 'Pack (6 x 1L)',
      photo: 'https://res.cloudinary.com/dcphm6bor/image/upload/q_75,f_auto,w_828/v1747660347/product/e3be784d148ab8ce3b36a659ef97674a.webp',
      lowStockThreshold: 5,
      currentStock: 0,
      expirationDate: null,
    },
    {
      name: "Thon à l'huile végétale 3x 80g - PESCADA",
      categoryName: 'Conserves',
      barcode: '459',
      salePrice: 26.95,
      costPrice: 31.5,
      description:
        "Morceaux de thon à l'huile végétale. Valeur énergétique : 464,3 Kcal/100g. Poids net : 3 x 80 g.",
      unit: 'Pack (3 x 80g)',
      photo: 'https://res.cloudinary.com/dcphm6bor/image/upload/q_75,f_auto,w_828/v1756904076/product/1ca6e4bb84f9a1b3e7f9b4a63aeb16f3.webp',
      lowStockThreshold: 5,
      currentStock: 0,
      expirationDate: null,
    },
    {
      name: 'Vinaigre citron 50cl + vinaigre blanc 50cl + vinaigre National 50cl - STAR',
      categoryName: 'Condiments & Épices',
      barcode: '31857',
      salePrice: 13.5,
      costPrice: 13.95,
      description: 'Assortiment de 3 vinaigres : citron, blanc et National. Contenance totale : 1,5 L.',
      unit: 'Pack (3 x 50cl = 1,5L)',
      photo: 'https://res.cloudinary.com/dcphm6bor/image/upload/q_75,f_auto,w_828/v1700680171/product/6cfccadfc458541ee6a721ac432d64cc.webp',
      lowStockThreshold: 5,
      currentStock: 0,
      expirationDate: null,
    },
  ];

  let created = 0;
  let updated = 0;
  const seededBarcodes = productSeeds.map((productSeed) => productSeed.barcode);

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

  const deactivatedProducts = await prisma.product.updateMany({
    where: {
      shopId: shop.id,
      isActive: true,
      NOT: {
        barcode: {
          in: seededBarcodes,
        },
      },
    },
    data: {
      isActive: false,
    },
  });

  console.log(`Users: ${owner.email}, ${cashier.email}`);
  console.log(`Categories: ${categorySeeds.length}`);
  console.log(
    `Products: ${created} created, ${updated} updated, ${deactivatedProducts.count} deactivated (${productSeeds.length} seeded total)`,
  );
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
