import { Global, Module } from '@nestjs/common';
import { BetterAuthService } from './better-auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from './guards/roles.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [BetterAuthService, RolesGuard, OptionalAuthGuard],
  exports: [BetterAuthService, RolesGuard, OptionalAuthGuard],
})
export class AuthModule {}
