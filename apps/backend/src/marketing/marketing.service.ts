/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}

  async logEvent(data: { userId?: string; farmhouseId?: string; eventType: string; metadata?: any }) {
    return this.prisma.userEvent.create({
      data: {
        userId: data.userId || null,
        farmhouseId: data.farmhouseId || null,
        eventType: data.eventType,
        metadata: data.metadata || undefined,
      },
    });
  }

  async getFunnelOverview() {
    const totalViews = await this.prisma.userEvent.count({ where: { eventType: 'VIEW_FARMHOUSE' } });
    const totalInitiatedCheckouts = await this.prisma.userEvent.count({ where: { eventType: 'INITIATE_CHECKOUT' } });
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const totalAbandonedCartLeads = await this.prisma.booking.count({
      where: { status: { in: ['PENDING_PAYMENT', 'ABANDONED', 'SAVED'] }, createdAt: { lte: fifteenMinsAgo } },
    });
    const totalConfirmedBookings = await this.prisma.booking.count({ where: { status: 'CONFIRMED' } });
    return { totalViews, totalInitiatedCheckouts, totalAbandonedCartLeads, totalConfirmedBookings };
  }

  async getAbandonedCheckoutLeads() {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    return this.prisma.booking.findMany({
      where: { status: { in: ['PENDING_PAYMENT', 'ABANDONED', 'SAVED'] }, createdAt: { lte: fifteenMinsAgo } },
      include: { user: true, farmhouse: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
