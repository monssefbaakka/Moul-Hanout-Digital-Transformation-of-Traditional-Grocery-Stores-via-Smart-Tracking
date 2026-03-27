import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 1 users...');

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

  console.log(`Seeded users: ${owner.email}, ${cashier.email}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
