import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MarketingService } from './marketing.service';

@ApiTags('Marketing analytics')
@Controller('admin/marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post('event')
  @ApiOperation({ summary: 'Log a user behavior event' })
  logEvent(@Body() body: { userId?: string; farmhouseId?: string; eventType: string; metadata?: any }) {
    return this.marketingService.logEvent(body);
  }

  @Get('overview')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  getFunnelOverview() {
    return this.marketingService.getFunnelOverview();
  }

  @Get('abandoned-leads')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List abandoned checkout leads' })
  getAbandonedCheckoutLeads() {
    return this.marketingService.getAbandonedCheckoutLeads();
  }
}
