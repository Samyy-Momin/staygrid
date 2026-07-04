import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true }
});

async function main() {
  const adminEmail = 'admin@staygrid.com';
  
  // Use better auth to create the admin user with password properly linked
  const result = await auth.api.signUpEmail({
    body: {
      email: adminEmail,
      password: 'admin123',
      name: 'System Admin'
    }
  });

  if (result?.user) {
    // Update the custom role field
    await prisma.user.update({
      where: { id: result.user.id },
      data: { role: Role.ADMIN }
    });
    console.log(`System Admin created successfully: ${adminEmail} / admin123`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
