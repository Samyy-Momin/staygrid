import { Module } from '@nestjs/common';
import { FarmhousesService } from './farmhouses.service';
import { FarmhousesController } from './farmhouses.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FarmhousesController],
  providers: [FarmhousesService],
})
export class FarmhousesModule {}
