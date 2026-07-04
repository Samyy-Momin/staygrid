import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BetterAuthService {
  public auth;

  constructor(public prisma: PrismaService) {
    this.auth = betterAuth({
      database: prismaAdapter(this.prisma, {
        provider: 'postgresql',
      }),
      emailAndPassword: {
        enabled: true,
      },
      baseURL: 'http://localhost:3000',
      trustedOrigins: [
        'http://localhost:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3001',
      ],
    });
  }
}
