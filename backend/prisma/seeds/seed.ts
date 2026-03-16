import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default owner
  const hashedPassword = await bcrypt.hash('Admin@123!', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@moulhanout.ma' },
    update: {},
    create: {
      email: 'owner@moulhanout.ma',
      password: hashedPassword,
      name: 'Store Owner',
      role: 'OWNER',
    },
  });

  // Create cashier
  const cashierPassword = await bcrypt.hash('Cashier@123!', 12);
  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@moulhanout.ma' },
    update: {},
    create: {
      email: 'cashier@moulhanout.ma',
      password: cashierPassword,
      name: 'Default Cashier',
      role: 'CASHIER',
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: { name: 'Beverages', color: '#3B82F6', icon: 'coffee' },
    }),
    prisma.category.upsert({
      where: { name: 'Snacks' },
      update: {},
      create: { name: 'Snacks', color: '#F59E0B', icon: 'package' },
    }),
    prisma.category.upsert({
      where: { name: 'Dairy' },
      update: {},
      create: { name: 'Dairy', color: '#10B981', icon: 'droplet' },
    }),
    prisma.category.upsert({
      where: { name: 'Bakery' },
      update: {},
      create: { name: 'Bakery', color: '#EF4444', icon: 'wheat' },
    }),
  ]);

  console.log(`✅ Seeded: ${owner.email}, ${cashier.email}`);
  console.log(`✅ Seeded ${categories.length} categories`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
