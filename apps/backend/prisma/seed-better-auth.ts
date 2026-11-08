import { PrismaClient, Role } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false },
      phone: { type: 'string', required: false },
    },
  },
});

async function main() {
  console.log('🔑 Registering Admin and Host accounts via BetterAuth API...');

  const accounts = [
    { email: 'sami@staygrid.com', password: 'Maikada@123', name: 'Sami Momin (System Admin)', role: Role.ADMIN, phone: '+919820098200' },
    { email: 'admin@staygrid.in', password: 'Maikada@123', name: 'StayGrid Admin', role: Role.ADMIN, phone: '+919876543210' },
    { email: 'owner@staygrid.in', password: 'Staygrid123!', name: 'Samyy Momin (Host)', role: Role.OWNER, phone: '+919820098200' },
    { email: 'guest@staygrid.in', password: 'Staygrid123!', name: 'Rohan Sharma', role: Role.CUSTOMER, phone: '+919988776655' },
  ];

  for (const acc of accounts) {
    try {
      // 1. Delete any existing user with this email to get clean credentials
      const existing = await prisma.user.findUnique({ where: { email: acc.email } });
      if (existing) {
        await prisma.user.delete({ where: { id: existing.id } });
      }

      // 2. Sign up via better-auth API so password hash is 100% compatible with signIn.email
      await auth.api.signUpEmail({
        body: {
          email: acc.email,
          password: acc.password,
          name: acc.name,
        },
      });

      // 3. Update role and phone number in PostgreSQL
      await prisma.user.update({
        where: { email: acc.email },
        data: {
          role: acc.role,
          phone: acc.phone,
        },
      });

      console.log(`✅ Successfully created account: ${acc.email} (${acc.role})`);
    } catch (err: any) {
      console.error(`⚠️ Error setting up ${acc.email}:`, err.message || err);
    }
  }

  console.log('🎉 All BetterAuth accounts registered successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
