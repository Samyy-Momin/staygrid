import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { MarketingService } from './marketing.service';

const ALLOWED_EVENTS = new Set(['VIEW_FARMHOUSE', 'INITIATE_CHECKOUT', 'ABANDON_CHECKOUT', 'WEBSITE_VIEW', 'WEBSITE_ENQUIRY']);

type MaybeAuthedRequest = Request & { user?: { id: string; role: Role } };

@ApiTags('Marketing analytics')
@Controller('admin/marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post('event')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Log a user behavior event' })
  logEvent(@Req() req: MaybeAuthedRequest, @Body() body: { farmhouseId?: string; eventType: string; metadata?: any }) {
    if (!ALLOWED_EVENTS.has(body?.eventType)) throw new BadRequestException('Unknown event type');
    const metadata = body.metadata && JSON.stringify(body.metadata).length <= 2000 ? body.metadata : undefined;
    // userId always comes from the session, never from the request body.
    return this.marketingService.logEvent({ userId: req.user?.id, farmhouseId: body.farmhouseId, eventType: body.eventType, metadata });
  }

  @Get('overview')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  getFunnelOverview(@Req() req: MaybeAuthedRequest) {
    return this.marketingService.getFunnelOverview(req.user!.role === Role.OWNER ? req.user!.id : undefined);
  }

  @Get('abandoned-leads')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List abandoned checkout leads (owners see only their own farmhouses)' })
  getAbandonedCheckoutLeads(@Req() req: MaybeAuthedRequest) {
    return this.marketingService.getAbandonedCheckoutLeads(req.user!.role === Role.OWNER ? req.user!.id : undefined);
  }
}
