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
    {
      name: 'Boissons',
      description: 'Soft drinks, juices, and bottled water',
    },
    {
      name: 'Snacks',
      description: 'Biscuits, chips, and quick snacks',
    },
    {
      name: 'Produits laitiers',
      description: 'Milk, yogurt, and chilled essentials',
    },
  ];

  const categoryMap = new Map<string, { id: string; name: string }>();

  for (const categorySeed of categorySeeds) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        shopId: shop.id,
        name: categorySeed.name,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const category = existingCategory
      ? await prisma.category.update({
          where: { id: existingCategory.id },
          data: {
            description: categorySeed.description,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : await prisma.category.create({
          data: {
            shopId: shop.id,
            name: categorySeed.name,
            description: categorySeed.description,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
          },
        });

    categoryMap.set(category.name, category);
  }

  const productSeeds = [
    {
      name: 'Eau Minerale 1.5L',
      categoryName: 'Boissons',
      barcode: '220000000001',
      salePrice: 6,
      costPrice: 4,
      description: 'Bottle of still water',
      unit: 'bottle',
      photo: 'https://example.com/products/eau-minerale-1-5l.jpg',
      lowStockThreshold: 8,
      currentStock: 20,
      expirationDate: null,
    },
    {
      name: 'Jus Orange 1L',
      categoryName: 'Boissons',
      barcode: '220000000002',
      salePrice: 14,
      costPrice: 10,
      description: 'Orange juice carton',
      unit: 'carton',
      photo: 'https://example.com/products/jus-orange-1l.jpg',
      lowStockThreshold: 6,
      currentStock: 4,
      expirationDate: new Date('2026-04-21T00:00:00.000Z'),
    },
    {
      name: 'Chips Salees',
      categoryName: 'Snacks',
      barcode: '220000000003',
      salePrice: 8,
      costPrice: 5,
      description: 'Classic salted chips',
      unit: 'bag',
      photo: 'https://example.com/products/chips-salees.jpg',
      lowStockThreshold: 10,
      currentStock: 11,
      expirationDate: null,
    },
    {
      name: 'Biscuits Chocolat',
      categoryName: 'Snacks',
      barcode: '220000000004',
      salePrice: 7,
      costPrice: 4.5,
      description: 'Chocolate sandwich biscuits',
      unit: 'pack',
      photo: 'https://example.com/products/biscuits-chocolat.jpg',
      lowStockThreshold: 9,
      currentStock: 6,
      expirationDate: new Date('2026-04-23T00:00:00.000Z'),
    },
    {
      name: 'Lait Demi-Ecreme 1L',
      categoryName: 'Produits laitiers',
      barcode: '220000000005',
      salePrice: 11,
      costPrice: 8,
      description: 'Semi-skimmed milk',
      unit: 'carton',
      photo: 'https://example.com/products/lait-demi-ecreme-1l.jpg',
      lowStockThreshold: 7,
      currentStock: 14,
      expirationDate: new Date('2026-04-28T00:00:00.000Z'),
    },
  ];

  for (const productSeed of productSeeds) {
    const category = categoryMap.get(productSeed.categoryName);

    if (!category) {
      throw new Error(`Missing category ${productSeed.categoryName} during seed`);
    }

    await prisma.product.upsert({
      where: {
        shopId_barcode: {
          shopId: shop.id,
          barcode: productSeed.barcode,
        },
      },
      update: {
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
      create: {
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
  }

  console.log(`Seeded users: ${owner.email}, ${cashier.email}`);
  console.log(`Seeded categories: ${categorySeeds.length}`);
  console.log(`Seeded products: ${productSeeds.length}`);
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
