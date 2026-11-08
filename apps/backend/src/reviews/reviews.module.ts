import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FarmhousesModule } from '../farmhouses/farmhouses.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, FarmhousesModule, AuthModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
