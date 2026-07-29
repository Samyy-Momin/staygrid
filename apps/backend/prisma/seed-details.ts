import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding detailed amenities and reviews...');
  
  const users = await prisma.user.findMany({ take: 1 });
  const userId = users.length > 0 ? users[0].id : null;

  const farmhouses = await prisma.farmhouse.findMany();
  
  for (const fh of farmhouses) {
    await prisma.farmhouse.update({
      where: { id: fh.id },
      data: {
        roomCount: 4,
        acRoomCount: 3,
        nonAcRoomCount: 1,
        hallCount: 2,
        singleBedCount: 4,
        doubleBedCount: 3,
        extraMattressCount: 5,
        balconyCount: 2,
        hasPool: true,
        poolType: 'Private Infinity',
        poolSize: '15x30 ft',
        babyPoolSize: '5x5 ft',
        hasTurf: true,
        hasRainDance: true,
        hasPlayArea: true,
        hasGardenArea: true,
        hasKitchen: true,
        hasFridge: true,
        hasWifi: true,
        hasTv: true,
      }
    });

    if (userId) {
      const existing = await prisma.review.findFirst({ where: { farmhouseId: fh.id } });
      if (!existing) {
        await prisma.review.create({
          data: {
            rating: 5,
            comment: "Absolutely incredible! The pool was massive and the rooms were spotless. We had a great family time.",
            farmhouseId: fh.id,
            userId: userId,
          }
        });
      }
    }
  }
  
  console.log('Seeding complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
