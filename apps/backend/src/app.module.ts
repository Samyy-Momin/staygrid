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
import { ImportModule } from './import/import.module';
import { UploadModule } from './upload/upload.module';
import { OffersModule } from './offers/offers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    FarmhousesModule,
    CloudinaryModule,
    BookingsModule,
    ImportModule,
    UploadModule,
    OffersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
