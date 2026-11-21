import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PublicSitesController, WebsitesController } from './websites.controller';
import { WebsitesService } from './websites.service';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [WebsitesController, PublicSitesController],
  providers: [WebsitesService],
})
export class WebsitesModule {}
