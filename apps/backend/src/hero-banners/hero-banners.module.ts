import { Module } from '@nestjs/common';
import { HeroBannersService } from './hero-banners.service';
import { HeroBannersController } from './hero-banners.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HeroBannersController],
  providers: [HeroBannersService],
})
export class HeroBannersModule {}
