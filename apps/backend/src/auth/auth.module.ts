import { Module } from '@nestjs/common';
import { BetterAuthService } from './better-auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [BetterAuthService],
  exports: [BetterAuthService],
})
export class AuthModule {}
