import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FarmhousesModule } from './farmhouses/farmhouses.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { BookingsModule } from './bookings/bookings.module';
import { UploadModule } from './upload/upload.module';
import { ImportModule } from './import/import.module';
import { GeoModule } from './geo/geo.module';
import { CategoriesModule } from './categories/categories.module';
import { HeroBannersModule } from './hero-banners/hero-banners.module';
import { ReviewsModule } from './reviews/reviews.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    FarmhousesModule,
    CloudinaryModule,
    BookingsModule,
    UploadModule,
    ImportModule,
    GeoModule,
    CategoriesModule,
    HeroBannersModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
