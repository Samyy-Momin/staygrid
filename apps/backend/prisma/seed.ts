import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding categories...');
  
  const categories = [
    { name: 'Location', filterKey: 'location', order: 1, iconName: 'MapPin' },
    { name: 'Turf', filterKey: 'hasTurf', order: 2, iconName: 'Tent' },
    { name: 'Big Pools', filterKey: 'hasPool', order: 3, iconName: 'Droplet' },
    { name: 'Couple Friendly', filterKey: 'isCoupleFriendly', order: 4, iconName: 'Users' },
    { name: 'Pet Friendly', filterKey: 'isPetFriendly', order: 5, iconName: 'Dog' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {
        filterKey: category.filterKey,
        order: category.order,
        iconName: category.iconName,
      },
      create: {
        name: category.name,
        filterKey: category.filterKey,
        order: category.order,
        iconName: category.iconName,
        isActive: true,
      },
    });
  }

  console.log('Categories seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
