import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const owner = await prisma.user.findFirst({
    where: { email: { contains: 'naufil', mode: 'insensitive' } },
    include: { accounts: true },
  });

  console.log('Found user:', owner?.email);
  if (!owner) return;

  const newPass = '12345678';
  const hashed = await hashPassword(newPass);
  console.log('Generated hash:', hashed);

  const account = owner.accounts.find(a => a.providerId === 'credential');
  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashed, updatedAt: new Date() },
    });
    console.log('✅ Updated password for naufil to 12345678');
  }

  const updatedAcc = await prisma.account.findUnique({ where: { id: account!.id } });
  const check = await verifyPassword({ hash: updatedAcc!.password!, password: newPass });
  console.log('Verification check:', check);
}

main().catch(console.error).finally(() => prisma.$disconnect());
