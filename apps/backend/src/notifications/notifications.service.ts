import { BadRequestException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type NotificationPayload = {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  dedupeKey?: string;
};

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private reminderTimer?: NodeJS.Timeout;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.runCheckInReminders().catch((error) => this.logger.error('Check-in reminders failed', error));
    this.reminderTimer = setInterval(() => {
      this.runCheckInReminders().catch((error) => this.logger.error('Check-in reminders failed', error));
    }, 15 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.reminderTimer) clearInterval(this.reminderTimer);
  }

  async savePushToken(userId: string, token: string, platform?: string) {
    if (!/^(Expo(nent)?PushToken)\[[^\]]+\]$/.test(token)) {
      throw new BadRequestException('Invalid Expo push token');
    }
    return this.prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  async deletePushToken(userId: string, token: string) {
    return this.prisma.pushToken.deleteMany({ where: { userId, token } });
  }

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /** In-app notification + push to every device of the user. Same dedupeKey twice = sent once. */
  notify(payload: NotificationPayload) {
    return this.createNotification(payload);
  }

  /** System-admin broadcast to explicit users or all owners. */
  async sendToUsers(input: { userIds?: string[]; audience?: 'ALL_OWNERS'; title: string; body: string }) {
    const title = input.title?.trim();
    const body = input.body?.trim();
    if (!title || !body || title.length > 80 || body.length > 500) {
      throw new BadRequestException('Title (max 80) and message (max 500) are required');
    }
    const userIds = input.audience === 'ALL_OWNERS'
      ? (await this.prisma.user.findMany({ where: { role: 'OWNER' }, select: { id: true } })).map((u) => u.id)
      : [...new Set(input.userIds || [])];
    if (userIds.length === 0) throw new BadRequestException('Choose at least one recipient');
    if (userIds.length > 1000) throw new BadRequestException('Too many recipients in one send');

    let sent = 0;
    for (const userId of userIds) {
      await this.createNotification({ userId, type: 'ADMIN_MESSAGE', title, body });
      sent++;
    }
    return { sent };
  }

  private async createNotification(payload: NotificationPayload) {
    let notification;
    try {
      notification = await this.prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          dedupeKey: payload.dedupeKey,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') return;
      throw error;
    }

    const tokens = await this.prisma.pushToken.findMany({ where: { userId: payload.userId } });
    await Promise.all(tokens.map(({ token }) => this.sendPushNotification(token, payload.title, payload.body, payload.data)));
    return notification;
  }

  async sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>) {
    if (!/^(Expo(nent)?PushToken)\[[^\]]+\]$/.test(token)) {
      this.logger.warn('Skipping malformed Expo push token');
      return;
    }

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: token, sound: 'default', title, body, data }),
      });
      const result = await response.json() as { data?: { status?: string; details?: { error?: string } } | Array<{ status?: string; details?: { error?: string } }> };
      if (!response.ok) throw new Error('Expo push service returned HTTP ' + response.status);
      const tickets = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
      if (tickets.some((ticket) => ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered')) {
        await this.prisma.pushToken.deleteMany({ where: { token } });
      }
      if (tickets.some((ticket) => ticket.status === 'error')) {
        this.logger.warn('Expo rejected a push notification');
      }
    } catch (error) {
      this.logger.error('Error sending Expo push notification', error);
    }
  }

  async sendBookingConfirmation(booking: any) {
    if (!booking.userId) return;
    // Tell the farmhouse owner too — this is the alert they care about most.
    const ownerId = booking.farmhouse?.ownerId;
    if (ownerId && ownerId !== booking.userId) {
      const when = new Date(booking.checkIn).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
      await this.createNotification({
        userId: ownerId,
        type: 'OWNER_NEW_BOOKING',
        title: 'New booking',
        body: `${booking.user?.name || 'A guest'} booked ${booking.farmhouse?.title || 'your farmhouse'} for ${when}. Guests: ${(booking.adults || 0) + (booking.children || 0)}.`,
        data: { ownerBookingId: booking.id, farmhouseId: booking.farmhouseId },
        dedupeKey: 'OWNER_NEW_BOOKING:' + booking.id,
      }).catch((e) => this.logger.error('Owner booking notification failed', e));
    }
    return this.createNotification({
      userId: booking.userId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking confirmed',
      body: 'Your stay at ' + (booking.farmhouse?.title || 'the farmhouse') + ' is confirmed.',
      data: { bookingId: booking.id, farmhouseId: booking.farmhouseId },
      dedupeKey: 'BOOKING_CONFIRMED:' + booking.id,
    });
  }

  async sendBookingCancellation(booking: any) {
    if (!booking.userId) return;
    const refund = Number(booking.refundAmount || 0);
    return this.createNotification({
      userId: booking.userId,
      type: 'BOOKING_CANCELLED',
      title: 'Booking cancelled',
      body: refund > 0 ? 'Your booking was cancelled. A refund of ₹' + refund.toLocaleString('en-IN') + ' is pending.' : 'Your booking was cancelled. No refund is due.',
      data: { bookingId: booking.id, farmhouseId: booking.farmhouseId },
      dedupeKey: 'BOOKING_CANCELLED:' + booking.id,
    });
  }

  async sendCashPaymentConfirmed(booking: any) {
    if (!booking.userId) return;
    return this.createNotification({
      userId: booking.userId,
      type: 'PAYMENT_CONFIRMED',
      title: 'Payment confirmed',
      body: 'The cash payment for ' + (booking.farmhouse?.title || 'your stay') + ' has been confirmed by both parties.',
      data: { bookingId: booking.id, farmhouseId: booking.farmhouseId },
      dedupeKey: 'PAYMENT_CONFIRMED:' + booking.id,
    });
  }

  async runCheckInReminders() {
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const threeDays = new Date(today);
    threeDays.setDate(threeDays.getDate() + 3);
    const threeDaysStart = new Date(threeDays);
    threeDaysStart.setHours(0, 0, 0, 0);
    const threeDaysEnd = new Date(threeDays);
    threeDaysEnd.setHours(23, 59, 59, 999);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        OR: [
          { checkIn: { gte: todayStart, lte: todayEnd } },
          { checkIn: { gte: threeDaysStart, lte: threeDaysEnd } },
        ],
      },
      include: { user: true, farmhouse: true },
    });

    for (const booking of bookings) {
      const isToday = booking.checkIn >= todayStart && booking.checkIn <= todayEnd;
      const day = isToday ? 'today' : 'in three days';
      const dateKey = isToday ? todayStart.toISOString().slice(0, 10) : threeDaysStart.toISOString().slice(0, 10);
      await this.createNotification({
        userId: booking.userId,
        type: isToday ? 'CHECK_IN_TODAY' : 'CHECK_IN_SOON',
        title: isToday ? 'Your check-in is today' : 'Your stay is coming up',
        body: 'Your stay at ' + (booking.farmhouse?.title || 'the farmhouse') + ' starts ' + day + '.',
        data: { bookingId: booking.id, farmhouseId: booking.farmhouseId },
        dedupeKey: 'CHECK_IN:' + booking.id + ':' + dateKey,
      });
    }
  }
}
