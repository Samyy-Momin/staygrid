import { Body, Controller, ForbiddenException, Get, Headers, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  AdminUpdateWebsiteDto, CreateEnquiryDto, CreatePlanDto, CreateWebsiteDto,
  RecordWebsitePaymentDto, UpdateEnquiryDto, UpdatePlanDto, WebsiteContentDto,
} from './dto/website.dto';
import { WebsitesService } from './websites.service';

type AuthedRequest = Request & { user: { id: string; role: Role } };

@ApiTags('Owner websites')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('websites')
export class WebsitesController {
  constructor(private readonly websites: WebsitesService) {}

  // ── System admin: plans ──
  @Get('plans') @Roles(Role.ADMIN)
  listPlans() { return this.websites.listPlans(); }

  @Post('plans') @Roles(Role.ADMIN)
  createPlan(@Body() dto: CreatePlanDto) { return this.websites.createPlan(dto); }

  @Patch('plans/:id') @Roles(Role.ADMIN)
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) { return this.websites.updatePlan(id, dto); }

  // ── Owner + admin: enquiries (declared before ':id' routes) ──
  @Get('enquiries') @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Website enquiries (owners see only their own)' })
  listEnquiries(@Req() req: AuthedRequest, @Query('status') status?: string) {
    return this.websites.listEnquiries(req.user, status);
  }

  @Patch('enquiries/:id') @Roles(Role.ADMIN, Role.OWNER)
  updateEnquiry(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: UpdateEnquiryDto) {
    return this.websites.updateEnquiry(id, dto.status, req.user);
  }

  // ── Owner ──
  @Get('mine') @Roles(Role.OWNER, Role.ADMIN)
  listMine(@Req() req: AuthedRequest) { return this.websites.listMine(req.user.id); }

  @Patch(':id/content') @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Edit tagline, about, USPs, WhatsApp number' })
  updateContent(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: WebsiteContentDto) {
    return this.websites.updateContent(id, dto, req.user);
  }

  // ── System admin: websites & subscription ──
  @Get() @Roles(Role.ADMIN)
  listAll() { return this.websites.listAll(); }

  @Post() @Roles(Role.ADMIN)
  create(@Body() dto: CreateWebsiteDto) { return this.websites.create(dto); }

  @Post('generate-missing') @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a DRAFT website for every farmhouse without one' })
  generateMissing(@Body('planId') planId?: string) { return this.websites.generateMissing(planId); }

  @Post('remind-due') @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Send payment-due reminders to all overdue / due-soon owners' })
  remindAllDue() { return this.websites.remindAllDue(); }

  @Patch(':id') @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activate / suspend / change plan, subdomain or custom domain' })
  adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateWebsiteDto) { return this.websites.adminUpdate(id, dto); }

  @Get(':id/payments') @Roles(Role.ADMIN)
  listPayments(@Param('id') id: string) { return this.websites.listPayments(id); }

  @Post(':id/payments') @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Record a subscription payment; extends paidUntil' })
  recordPayment(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: RecordWebsitePaymentDto) {
    return this.websites.recordPayment(id, dto, req.user.id);
  }

  @Post(':id/remind') @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Send a payment-due reminder to this website owner' })
  remind(@Param('id') id: string) { return this.websites.sendDueReminder(id); }
}

/**
 * Called server-to-server by the owner-websites app (apps/sites), never by browsers.
 * When SITES_API_KEY is set, requests must carry it in `x-sites-key`.
 * Throttling is skipped because every request arrives from the sites server's IP;
 * enquiry spam is limited per phone/site in the service instead.
 */
@ApiTags('Owner websites (public)')
@SkipThrottle()
@Controller('public/sites')
export class PublicSitesController {
  constructor(private readonly websites: WebsitesService) {}

  private assertKey(key?: string) {
    const expected = process.env.SITES_API_KEY;
    if (!expected) return;
    const a = Buffer.from(key || '');
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ForbiddenException('Invalid sites key');
  }

  /**
   * Caddy on-demand TLS "ask" hook: 200 only for hosts that belong to a website,
   * so nobody can make us request certificates for arbitrary domains.
   * Internal use only (Caddy -> backend on the private network).
   */
  @Get('tls-check')
  async tlsCheck(@Query('domain') domain: string) {
    await this.websites.assertKnownHost(domain);
    return { ok: true };
  }

  @Get('resolve')
  @ApiOperation({ summary: 'Resolve a host (subdomain or custom domain) to a live website' })
  resolve(@Query('host') host: string, @Headers('x-sites-key') key?: string) {
    this.assertKey(key);
    return this.websites.resolvePublic(host);
  }

  @Post(':subdomain/enquiries')
  @ApiOperation({ summary: 'Book-now request from an owner website' })
  enquiry(@Param('subdomain') subdomain: string, @Body() dto: CreateEnquiryDto, @Headers('x-sites-key') key?: string) {
    this.assertKey(key);
    return this.websites.createEnquiry(subdomain, dto);
  }
}
