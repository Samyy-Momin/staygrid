import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AdminUpdateWebsiteDto, CreateEnquiryDto, CreatePlanDto, CreateWebsiteDto,
  RecordWebsitePaymentDto, UpdatePlanDto, WebsiteContentDto,
} from './dto/website.dto';

const RESERVED_SUBDOMAINS = new Set(['www', 'admin', 'api', 'app', 'mail', 'staging', 'dev', 'owner', 'owners', 'staygrid', 'help', 'support', 'blog']);
const DUE_SOON_DAYS = 5;
const DAY_MS = 86_400_000;

export type DueState = 'UNPAID' | 'OVERDUE' | 'DUE_SOON' | 'PAID';

export function dueState(paidUntil: Date | null, now = new Date()): DueState {
  if (!paidUntil) return 'UNPAID';
  if (paidUntil.getTime() < now.getTime()) return 'OVERDUE';
  if (paidUntil.getTime() - now.getTime() < DUE_SOON_DAYS * DAY_MS) return 'DUE_SOON';
  return 'PAID';
}

/** "Sharifa Farm House & Resort" -> "sharifafarmhouseresort" (max 40 chars). */
export function slugifySubdomain(title: string): string {
  const s = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '').slice(0, 40);
  return s.length >= 3 ? s : `stay${s}`.padEnd(4, '0');
}

function addMonthsUtc(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

/** Farmhouse fields that are safe to show on a public website. */
const PUBLIC_FARMHOUSE_SELECT = {
  id: true, title: true, photos: true, price12Hours: true, price24Hours: true, weekendPrice12Hours: true, weekendPrice24Hours: true,
  capacity: true, maxIncludedGuests: true, extraGuestFee: true, isActive: true, isCoupleFriendly: true, isPetFriendly: true,
  streetAddress: true, city: true, state: true, postalCode: true, latitude: true, longitude: true, contactNumbers: true,
  isWheelchairAccessible: true, hasPool: true, poolType: true, poolSize: true, hasTurf: true, hasRainDance: true, hasPlayArea: true,
  hasGardenArea: true, hasGazebo: true, hasCelebrationArea: true, roomCount: true, acRoomCount: true, nonAcRoomCount: true,
  hallCount: true, singleBedCount: true, doubleBedCount: true, hasKitchen: true, hasFridge: true, hasRoWater: true, hasBbq: true,
  hasGas: true, hasCarom: true, hasChess: true, has8BallPool: true, hasCricket: true, hasBadminton: true, hasTv: true,
  hasSpeakers: true, hasMicrophone: true, hasWifi: true, customAmenities: true, hostName: true, avgRating: true, reviewCount: true,
  reviews: {
    select: { id: true, rating: true, comment: true, groupType: true, createdAt: true, user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' as const },
    take: 6,
  },
} satisfies Prisma.FarmhouseSelect;

@Injectable()
export class WebsitesService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  // ───────────── Plans (system admin) ─────────────

  listPlans() {
    return this.prisma.websitePlan.findMany({ orderBy: { monthlyPrice: 'asc' }, include: { _count: { select: { websites: true } } } });
  }

  createPlan(dto: CreatePlanDto) {
    return this.prisma.websitePlan.create({ data: dto }).catch((e) => this.rethrowUnique(e, 'A plan with this name already exists'));
  }

  updatePlan(id: string, dto: UpdatePlanDto) {
    return this.prisma.websitePlan.update({ where: { id }, data: dto }).catch((e) => this.rethrowUnique(e, 'A plan with this name already exists'));
  }

  // ───────────── Websites (system admin) ─────────────

  async listAll() {
    const sites = await this.prisma.website.findMany({
      include: {
        plan: true,
        farmhouse: { select: { id: true, title: true, city: true, photos: true, owner: { select: { id: true, name: true, phone: true } } } },
        _count: { select: { enquiries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    return sites.map((s) => ({ ...s, dueState: dueState(s.paidUntil, now) }));
  }

  async create(dto: CreateWebsiteDto) {
    const farmhouse = await this.prisma.farmhouse.findUnique({ where: { id: dto.farmhouseId }, select: { id: true, title: true } });
    if (!farmhouse) throw new NotFoundException('Farmhouse not found');
    const subdomain = dto.subdomain ? this.assertSubdomainAllowed(dto.subdomain) : await this.freeSubdomain(farmhouse.title);
    return this.prisma.website
      .create({ data: { farmhouseId: farmhouse.id, subdomain, planId: dto.planId || null } })
      .catch((e) => this.rethrowUnique(e, 'This farmhouse already has a website or the subdomain is taken'));
  }

  /** One click: a DRAFT website for every farmhouse that does not have one yet. */
  async generateMissing(planId?: string) {
    const farmhouses = await this.prisma.farmhouse.findMany({ where: { website: null }, select: { id: true, title: true } });
    let created = 0;
    for (const f of farmhouses) {
      await this.prisma.website.create({ data: { farmhouseId: f.id, subdomain: await this.freeSubdomain(f.title), planId: planId || null } });
      created++;
    }
    return { created };
  }

  async adminUpdate(id: string, dto: AdminUpdateWebsiteDto) {
    const site = await this.getOrThrow(id);
    const data: Prisma.WebsiteUncheckedUpdateInput = { ...this.contentData(dto) };
    if (dto.subdomain !== undefined) data.subdomain = this.assertSubdomainAllowed(dto.subdomain);
    if (dto.customDomain !== undefined) data.customDomain = dto.customDomain ? dto.customDomain.toLowerCase() : null;
    if (dto.planId !== undefined) data.planId = dto.planId || null;
    if (dto.status !== undefined) {
      data.status = dto.status;
      data.suspendedReason = dto.status === 'SUSPENDED' ? dto.suspendedReason?.trim() || 'Paused by StayGrid' : null;
    }
    const updated = await this.prisma.website
      .update({ where: { id }, data, include: { farmhouse: { select: { title: true, ownerId: true } } } })
      .catch((e) => this.rethrowUnique(e, 'That subdomain or domain is already used by another website'));
    this.purgeSiteCache(site, updated); // old + new hosts (subdomain/domain may have changed)

    if (dto.status && dto.status !== site.status && (dto.status === 'SUSPENDED' || dto.status === 'ACTIVE')) {
      const live = dto.status === 'ACTIVE';
      await this.notifications.notify({
        userId: updated.farmhouse.ownerId,
        type: live ? 'WEBSITE_LIVE' : 'WEBSITE_SUSPENDED',
        title: live ? 'Your website is live' : 'Your website is paused',
        body: live
          ? `${updated.farmhouse.title} website is now live.`
          : `${updated.farmhouse.title} website is paused. Reason: ${updated.suspendedReason}. Call StayGrid to restart it.`,
        data: { websiteId: id },
      });
    }
    return updated;
  }

  async recordPayment(id: string, dto: RecordWebsitePaymentDto, adminId: string) {
    const site = await this.getOrThrow(id);
    const now = new Date();
    const periodStart = site.paidUntil && site.paidUntil > now ? site.paidUntil : now;
    const periodEnd = addMonthsUtc(periodStart, dto.months);

    const [payment, website] = await this.prisma.$transaction([
      this.prisma.websitePayment.create({
        data: { websiteId: id, amount: dto.amount, months: dto.months, periodStart, periodEnd, method: dto.method, reference: dto.reference, recordedBy: adminId },
      }),
      this.prisma.website.update({
        where: { id },
        data: { paidUntil: periodEnd, ...(dto.activate ? { status: 'ACTIVE', suspendedReason: null } : {}) },
        include: { farmhouse: { select: { title: true, ownerId: true } } },
      }),
    ]);

    if (dto.activate) this.purgeSiteCache(website);
    await this.notifications.notify({
      userId: website.farmhouse.ownerId,
      type: 'WEBSITE_PAYMENT_RECEIVED',
      title: 'Website payment received',
      body: `₹${dto.amount.toLocaleString('en-IN')} received for ${website.farmhouse.title}. Paid till ${formatDate(periodEnd)}.`,
      data: { websiteId: id },
      dedupeKey: `WEBSITE_PAYMENT:${payment.id}`,
    });
    return { payment, website: { ...website, dueState: dueState(website.paidUntil) } };
  }

  listPayments(id: string) {
    return this.prisma.websitePayment.findMany({ where: { websiteId: id }, orderBy: { createdAt: 'desc' } });
  }

  /** Payment-due reminder to the owner (app push + panel bell). At most one per website per day. */
  async sendDueReminder(id: string) {
    const site = await this.prisma.website.findUnique({
      where: { id },
      include: { plan: true, farmhouse: { select: { title: true, ownerId: true } } },
    });
    if (!site) throw new NotFoundException('Website not found');
    const state = dueState(site.paidUntil);
    const amount = site.plan ? `₹${site.plan.monthlyPrice.toLocaleString('en-IN')}/month` : 'your website fee';
    const when = !site.paidUntil
      ? 'is pending'
      : state === 'OVERDUE' ? `was due on ${formatDate(site.paidUntil)}` : `is due on ${formatDate(site.paidUntil)}`;

    const today = new Date().toISOString().slice(0, 10);
    const sent = await this.notifications.notify({
      userId: site.farmhouse.ownerId,
      type: 'WEBSITE_PAYMENT_DUE',
      title: 'Website payment due',
      body: `${site.farmhouse.title}: website payment of ${amount} ${when}. Please pay StayGrid to keep your website live.`,
      data: { websiteId: id },
      dedupeKey: `WEBSITE_DUE:${id}:${today}`,
    });
    await this.prisma.website.update({ where: { id }, data: { lastReminderAt: new Date() } });
    return { sent: Boolean(sent), alreadySentToday: !sent };
  }

  /** Remind every live website that is overdue, unpaid or due within 5 days. */
  async remindAllDue() {
    const soon = new Date(Date.now() + DUE_SOON_DAYS * DAY_MS);
    const due = await this.prisma.website.findMany({
      where: { status: { in: ['ACTIVE', 'SUSPENDED'] }, OR: [{ paidUntil: null }, { paidUntil: { lt: soon } }] },
      select: { id: true },
    });
    let sent = 0;
    for (const s of due) if ((await this.sendDueReminder(s.id)).sent) sent++;
    return { checked: due.length, sent };
  }

  // ───────────── Owner ─────────────

  async listMine(ownerId: string) {
    const sites = await this.prisma.website.findMany({
      where: { farmhouse: { ownerId } },
      include: {
        plan: { select: { name: true, monthlyPrice: true } },
        farmhouse: { select: { id: true, title: true, photos: true } },
        _count: { select: { enquiries: { where: { status: 'NEW' } } } },
      },
    });
    return sites.map((s) => ({ ...s, dueState: dueState(s.paidUntil) }));
  }

  async updateContent(id: string, dto: WebsiteContentDto, actor: { id: string; role: Role }) {
    await this.assertCanManage(id, actor);
    const updated = await this.prisma.website.update({ where: { id }, data: this.contentData(dto) });
    this.purgeSiteCache(updated);
    return updated;
  }

  async listEnquiries(actor: { id: string; role: Role }, status?: string) {
    return this.prisma.websiteEnquiry.findMany({
      where: {
        ...(actor.role === Role.OWNER ? { farmhouse: { ownerId: actor.id } } : {}),
        ...(status ? { status } : {}),
      },
      include: { farmhouse: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async updateEnquiry(id: string, status: string, actor: { id: string; role: Role }) {
    const enquiry = await this.prisma.websiteEnquiry.findUnique({ where: { id }, include: { farmhouse: { select: { ownerId: true } } } });
    if (!enquiry) throw new NotFoundException('Enquiry not found');
    if (actor.role !== Role.ADMIN && enquiry.farmhouse.ownerId !== actor.id) throw new ForbiddenException('Not your enquiry');
    return this.prisma.websiteEnquiry.update({ where: { id }, data: { status } });
  }

  // ───────────── Public (owner websites) ─────────────

  /**
   * Resolve a request host to a live website.
   * "sharifafarmhouse.<root>" -> by subdomain; anything else -> by customDomain (with or without "www.").
   */
  async resolvePublic(rawHost: string) {
    const host = (rawHost || '').toLowerCase().split(':')[0].trim();
    if (!host) throw new NotFoundException('Website not found');
    const root = (process.env.SITES_ROOT_DOMAIN || '').toLowerCase().trim();

    let where: Prisma.WebsiteWhereInput;
    if (root && host.endsWith('.' + root)) {
      where = { subdomain: host.slice(0, -(root.length + 1)) };
    } else {
      const bare = host.replace(/^www\./, '');
      where = { customDomain: { in: [host, bare, `www.${bare}`] } };
    }

    const site = await this.prisma.website.findFirst({
      where: { ...where, status: 'ACTIVE', farmhouse: { isActive: true } },
      select: {
        id: true, subdomain: true, customDomain: true, tagline: true, about: true, usps: true, whatsappNumber: true,
        farmhouse: { select: PUBLIC_FARMHOUSE_SELECT },
      },
    });
    if (!site) throw new NotFoundException('Website not found');
    return site;
  }

  /** Throws 404 unless the host is a subdomain or custom domain of some website (any status). */
  async assertKnownHost(rawHost: string) {
    const host = (rawHost || '').toLowerCase().trim();
    const root = (process.env.SITES_ROOT_DOMAIN || '').toLowerCase();
    const bare = host.replace(/^www\./, '');
    const where: Prisma.WebsiteWhereInput = root && host.endsWith('.' + root)
      ? { subdomain: host.slice(0, -(root.length + 1)) }
      : { customDomain: { in: [host, bare, `www.${bare}`] } };
    const found = host ? await this.prisma.website.findFirst({ where, select: { id: true } }) : null;
    if (!found) throw new NotFoundException('Unknown host');
  }

  async createEnquiry(subdomain: string, dto: CreateEnquiryDto) {
    const site = await this.prisma.website.findFirst({
      where: { subdomain, status: 'ACTIVE' },
      select: { id: true, farmhouseId: true, farmhouse: { select: { title: true, ownerId: true } } },
    });
    if (!site) throw new NotFoundException('Website not found');

    const phone = dto.phone.replace(/\D/g, '').slice(-10);
    const hourAgo = new Date(Date.now() - 3_600_000);
    // ponytail: DB-count spam guard (no IP is reliable behind the sites server). Upgrade: captcha if abused.
    const [samePhone, siteTotal] = await Promise.all([
      this.prisma.websiteEnquiry.count({ where: { websiteId: site.id, phone, createdAt: { gte: hourAgo } } }),
      this.prisma.websiteEnquiry.count({ where: { websiteId: site.id, createdAt: { gte: hourAgo } } }),
    ]);
    if (samePhone >= 3) throw new BadRequestException('We already have your request. The owner will call you soon.');
    if (siteTotal >= 60) throw new BadRequestException('Too many requests right now. Please call or WhatsApp instead.');

    const checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
    if (checkIn && checkIn.getTime() < Date.now() - DAY_MS) throw new BadRequestException('Choose a future date');

    const enquiry = await this.prisma.websiteEnquiry.create({
      data: { websiteId: site.id, farmhouseId: site.farmhouseId, name: dto.name.trim(), phone, checkIn, guests: dto.guests, message: dto.message?.trim() },
    });

    await this.notifications.notify({
      userId: site.farmhouse.ownerId,
      type: 'WEBSITE_ENQUIRY',
      title: 'New booking request',
      body: `${enquiry.name} (${phone}) wants to book ${site.farmhouse.title}${checkIn ? ' on ' + formatDate(checkIn) : ''}. Call them now.`,
      data: { enquiryId: enquiry.id, farmhouseId: site.farmhouseId },
      dedupeKey: `WEBSITE_ENQUIRY:${enquiry.id}`,
    }).catch(() => null);

    return { ok: true, message: 'Request sent! The owner will call you shortly.' };
  }

  // ───────────── helpers ─────────────

  /** Every host a website can be reached on (cache keys in the sites app). */
  private hostsOf(site: { subdomain: string; customDomain: string | null }) {
    const root = (process.env.SITES_ROOT_DOMAIN || '').toLowerCase();
    const hosts = root ? [`${site.subdomain}.${root}`] : [];
    if (site.customDomain) {
      const bare = site.customDomain.replace(/^www\./, '');
      hosts.push(bare, `www.${bare}`);
    }
    return hosts;
  }

  /** Fire-and-forget: ask the sites app to drop its cache for these hosts. */
  private purgeSiteCache(...sites: { subdomain: string; customDomain: string | null }[]) {
    const url = process.env.SITES_REVALIDATE_URL;
    if (!url) return;
    const hosts = [...new Set(sites.flatMap((s) => this.hostsOf(s)))];
    if (!hosts.length) return;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sites-key': process.env.SITES_API_KEY || '' },
      body: JSON.stringify({ hosts }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);
  }

  private contentData(dto: WebsiteContentDto) {
    const data: Prisma.WebsiteUncheckedUpdateInput = {};
    if (dto.tagline !== undefined) data.tagline = dto.tagline.trim() || null;
    if (dto.about !== undefined) data.about = dto.about.trim() || null;
    if (dto.usps !== undefined) data.usps = dto.usps.map((u) => u.trim()).filter(Boolean);
    if (dto.whatsappNumber !== undefined) data.whatsappNumber = dto.whatsappNumber ? dto.whatsappNumber.replace(/\D/g, '').slice(-10) : null;
    return data;
  }

  private async getOrThrow(id: string) {
    const site = await this.prisma.website.findUnique({ where: { id } });
    if (!site) throw new NotFoundException('Website not found');
    return site;
  }

  private async assertCanManage(id: string, actor: { id: string; role: Role }) {
    const site = await this.prisma.website.findUnique({ where: { id }, select: { farmhouse: { select: { ownerId: true } } } });
    if (!site) throw new NotFoundException('Website not found');
    if (actor.role !== Role.ADMIN && site.farmhouse.ownerId !== actor.id) throw new ForbiddenException('Not your website');
  }

  private assertSubdomainAllowed(subdomain: string) {
    const s = subdomain.toLowerCase();
    if (RESERVED_SUBDOMAINS.has(s)) throw new BadRequestException(`"${s}" is reserved`);
    return s;
  }

  private async freeSubdomain(title: string) {
    const base = slugifySubdomain(title);
    for (let i = 0; i < 50; i++) {
      const candidate = i === 0 ? base : `${base.slice(0, 37)}${i + 1}`;
      if (RESERVED_SUBDOMAINS.has(candidate)) continue;
      const taken = await this.prisma.website.findUnique({ where: { subdomain: candidate }, select: { id: true } });
      if (!taken) return candidate;
    }
    throw new ConflictException('Could not find a free subdomain; set one manually');
  }

  private rethrowUnique(e: unknown, message: string): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ConflictException(message);
    throw e;
  }
}
