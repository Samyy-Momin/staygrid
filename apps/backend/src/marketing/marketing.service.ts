/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}

  async logEvent(data: { userId?: string; farmhouseId?: string; eventType: string; metadata?: any }) {
    await this.prisma.userEvent.create({
      data: {
        userId: data.userId || null,
        farmhouseId: data.farmhouseId || null,
        eventType: data.eventType,
        metadata: data.metadata || undefined,
      },
    });
    return { ok: true };
  }

  /** ownerId set => scope every number to that owner's farmhouses. */
  async getFunnelOverview(ownerId?: string) {
    const farmhouseIds = ownerId
      ? (await this.prisma.farmhouse.findMany({ where: { ownerId }, select: { id: true } })).map((f) => f.id)
      : undefined;
    const eventScope = farmhouseIds ? { farmhouseId: { in: farmhouseIds } } : {};
    const bookingScope = farmhouseIds ? { farmhouseId: { in: farmhouseIds } } : {};
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    const [totalViews, totalInitiatedCheckouts, totalAbandonedCartLeads, totalConfirmedBookings] = await Promise.all([
      this.prisma.userEvent.count({ where: { eventType: 'VIEW_FARMHOUSE', ...eventScope } }),
      this.prisma.userEvent.count({ where: { eventType: 'INITIATE_CHECKOUT', ...eventScope } }),
      this.prisma.booking.count({
        where: { status: { in: ['PENDING_PAYMENT', 'ABANDONED', 'SAVED'] }, createdAt: { lte: fifteenMinsAgo }, ...bookingScope },
      }),
      this.prisma.booking.count({ where: { status: 'CONFIRMED', ...bookingScope } }),
    ]);
    return { totalViews, totalInitiatedCheckouts, totalAbandonedCartLeads, totalConfirmedBookings };
  }

  async getAbandonedCheckoutLeads(ownerId?: string) {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    return this.prisma.booking.findMany({
      where: {
        status: { in: ['PENDING_PAYMENT', 'ABANDONED', 'SAVED'] },
        createdAt: { lte: fifteenMinsAgo },
        ...(ownerId ? { farmhouse: { ownerId } } : {}),
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        farmhouse: { select: { id: true, title: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
