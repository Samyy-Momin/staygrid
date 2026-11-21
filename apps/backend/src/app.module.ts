import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { PricingModule } from './pricing/pricing.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FinanceModule } from './finance/finance.module';
import { ExploreModule } from './explore/explore.module';
import { MarketingModule } from './marketing/marketing.module';
import { WebsitesModule } from './websites/websites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
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
    PricingModule,
    MailModule,
    NotificationsModule,
    FinanceModule,
    ExploreModule,
    MarketingModule,
    WebsitesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global per-IP limit: 120 requests/minute. Tighter limits on sensitive routes via @Throttle.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
