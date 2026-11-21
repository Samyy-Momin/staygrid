import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { istDay } from '../common/utils/ist-date';

/**
 * Snapshot the farmhouse's negotiated commission onto the booking at creation time,
 * so later rate changes never rewrite history and finance reports use the real rate.
 */
export function commissionSnapshot(totalAmount: number, defaultCommissionPercentage: number | null | undefined) {
  const commissionPercentage = Number(defaultCommissionPercentage ?? 20);
  const staygridNetCommission = Math.round(totalAmount * commissionPercentage) / 100;
  return {
    commissionPercentage,
    staygridNetCommission,
    ownerShareAmount: Math.round((totalAmount - staygridNetCommission) * 100) / 100,
  };
}

@Injectable()
export class BookingsService {
  private get razorpay(): Razorpay {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException('Online payments are not configured');
    }
    if (process.env.NODE_ENV === 'production' && keyId.startsWith('rzp_test_')) {
      throw new ServiceUnavailableException('Live Razorpay credentials are required in production');
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto, userId: string) {
    const farmhouse = await this.prisma.farmhouse.findUnique({
      where: { id: createBookingDto.farmhouseId },
    });
    if (!farmhouse) throw new NotFoundException('Farmhouse not found');
    if (!farmhouse.isActive) throw new BadRequestException('This farmhouse is not currently accepting bookings');
    if (!createBookingDto.termsAcceptedAt || new Date(createBookingDto.termsAcceptedAt).getTime() > Date.now()) {
      throw new BadRequestException('Accept the booking terms before continuing');
    }

    const checkIn = new Date(createBookingDto.checkIn);
    const checkOut = new Date(createBookingDto.checkOut);
    const durationHours = (checkOut.getTime() - checkIn.getTime()) / 3_600_000;
    const durationDays = Math.ceil(durationHours / 24);

    if (durationHours <= 0)
      throw new BadRequestException('Check-out must be after check-in');

    const bookingType = createBookingDto.bookingType || (durationHours <= 12 ? '12H' : durationHours <= 24 ? '24H' : 'CUSTOM');
    if (!['12H', '24H', 'CUSTOM'].includes(bookingType)) {
      throw new BadRequestException('Booking type must be 12H, 24H, or CUSTOM');
    }
    if ((bookingType === '12H' && durationHours > 12.5) || (bookingType === '24H' && durationHours > 24.5)) {
      throw new BadRequestException('Selected duration does not match the booking type');
    }
    if (bookingType === 'CUSTOM' && durationHours <= 24) {
      throw new BadRequestException('Custom stays must be longer than 24 hours');
    }

    // Time-based Overlap Check (Excludes SAVED and abandoned PENDING_PAYMENT older than 15 min)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const existingPending = await this.prisma.booking.findFirst({
      where: {
        userId,
        farmhouseId: farmhouse.id,
        checkIn,
        checkOut,
        status: 'PENDING_PAYMENT',
        createdAt: { gte: fifteenMinsAgo },
      },
    });

    if (existingPending?.razorpayOrderId) {
      return { ...existingPending, razorpayKeyId: this.configService.get<string>('RAZORPAY_KEY_ID') };
    }

    // Check for date-based pricing overrides
    const checkInDate = istDay(checkIn);
    const pricingOverride = await this.prisma.pricingOverride.findUnique({
      where: { farmhouseId_date: { farmhouseId: farmhouse.id, date: checkInDate } },
    });

    const isWeekend = checkInDate.getUTCDay() === 0 || checkInDate.getUTCDay() === 6;
    const default12H = isWeekend ? (farmhouse.weekendPrice12Hours || farmhouse.price12Hours) : farmhouse.price12Hours;
    const default24H = isWeekend ? (farmhouse.weekendPrice24Hours || farmhouse.price24Hours) : farmhouse.price24Hours;

    const price12H = pricingOverride?.price12Hours ?? default12H;
    const price24H = pricingOverride?.price24Hours ?? default24H;

    let totalAmount: number;
    if (bookingType === '12H') {
      totalAmount = price12H;
    } else {
      totalAmount = (bookingType === 'CUSTOM' ? durationDays : 1) * price24H;
    }

    const guestCount = createBookingDto.adults + createBookingDto.children;
    const includedGuests = farmhouse.capacity;
    const maxGuests = farmhouse.maxIncludedGuests ?? farmhouse.capacity;
    if (maxGuests > 0 && guestCount > maxGuests) {
      throw new BadRequestException(`This farmhouse allows up to ${maxGuests} guests`);
    }
    const extraGuestFee = Math.max(0, guestCount - includedGuests) * (farmhouse.extraGuestFee || 0);
    totalAmount += extraGuestFee;

    // Token: 50% for 12H/24H, 100% for CUSTOM
    const configuredToken = Number(farmhouse.tokenAmount || 0);
    const tokenPaid = bookingType === 'CUSTOM'
      ? totalAmount
      : Math.min(totalAmount, configuredToken > 0 ? configuredToken : Math.round(totalAmount * 0.5));

    // Serialize booking creation per farmhouse so simultaneous checkout requests
    // cannot both pass the overlap check and reserve the same slot.
    const booking = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "farmhouse" WHERE "id" = ${farmhouse.id} FOR UPDATE`;
      const overlappingBooking = await tx.booking.findFirst({
        where: {
          farmhouseId: farmhouse.id,
          status: { notIn: ['CANCELLED', 'ABANDONED', 'SAVED'] },
          OR: [
            { status: 'CONFIRMED' },
            { status: 'PENDING_PAYMENT', createdAt: { gte: fifteenMinsAgo } },
          ],
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
      });
      if (overlappingBooking) {
        throw new BadRequestException('This time slot overlaps with an existing booking.');
      }

      const overlappingBlocked = await tx.blockedDateRange.findFirst({
        where: { farmhouseId: farmhouse.id, startDate: { lt: checkOut }, endDate: { gt: checkIn } },
      });
      if (overlappingBlocked) {
        throw new BadRequestException('This time slot overlaps with blocked dates.');
      }

      return tx.booking.create({
        data: {
          checkIn,
          checkOut,
          adults: createBookingDto.adults,
          children: createBookingDto.children,
          totalAmount,
          tokenPaid,
          ...commissionSnapshot(totalAmount, farmhouse.defaultCommissionPercentage),
          notes: createBookingDto.notes || null,
          termsAcceptedAt: createBookingDto.termsAcceptedAt ? new Date(createBookingDto.termsAcceptedAt) : null,
          userId,
          farmhouseId: farmhouse.id,
        },
      });
    });

    try {
      const options = {
        amount: Math.round(tokenPaid * 100),
        currency: 'INR',
        receipt: booking.id,
      };
      const order = await this.razorpay.orders.create(options);
      if (!order?.id || order.amount !== options.amount || order.currency !== options.currency) {
        throw new Error('Razorpay returned an invalid order');
      }
      const updatedBooking = await this.prisma.booking.update({
        where: { id: booking.id },
        data: { razorpayOrderId: order.id },
      });
      return {
        ...updatedBooking,
        razorpayKeyId: this.configService.get<string>('RAZORPAY_KEY_ID'),
      };
    } catch (error) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'ABANDONED' },
      });
      throw new ServiceUnavailableException('Could not create a secure payment order. Please try again.');
    }
  }

  async verifyPayment(verifyDto: VerifyPaymentDto) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = verifyDto;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new BadRequestException('Payment order, payment ID, and signature are required');
    }
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret) throw new ServiceUnavailableException('Online payments are not configured');

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest();
    const suppliedSignature = Buffer.from(razorpaySignature, 'hex');
    const validSignature = suppliedSignature.length === generatedSignature.length && crypto.timingSafeEqual(generatedSignature, suppliedSignature);

    if (!validSignature) {
      throw new BadRequestException('Invalid signature');
    }

    const booking = await this.prisma.booking.findFirst({
      where: { razorpayOrderId },
      include: { farmhouse: true, user: true },
    });
    if (!booking) throw new NotFoundException('Payment order not found');
    if (booking.status === 'CONFIRMED' && booking.razorpayPaymentId === razorpayPaymentId) {
      return { status: 'success', booking };
    }
    if (booking.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('This booking is not awaiting payment');
    }

    let payment: any;
    try {
      payment = await this.razorpay.payments.fetch(razorpayPaymentId);
    } catch {
      throw new ServiceUnavailableException('Could not verify payment with Razorpay');
    }
    if (
      payment.order_id !== razorpayOrderId ||
      payment.amount !== Math.round(booking.tokenPaid * 100) ||
      payment.currency !== 'INR' ||
      payment.status !== 'captured'
    ) {
      throw new BadRequestException('Payment is not captured for the expected amount and order');
    }

    return this.confirmCapturedPayment(razorpayOrderId, razorpayPaymentId);
  }

  async handleRazorpayWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!rawBody || !signature || !webhookSecret) {
      throw new ServiceUnavailableException('Razorpay webhook verification is not configured');
    }
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest();
    const supplied = Buffer.from(signature, 'hex');
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(expected, supplied)) {
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.event !== 'payment.captured') return { received: true, ignored: true };
    const payment = event.payload?.payment?.entity;
    if (!payment?.order_id || !payment?.id || payment.status !== 'captured') {
      throw new BadRequestException('Captured payment event is missing required fields');
    }
    const booking = await this.prisma.booking.findFirst({ where: { razorpayOrderId: payment.order_id } });
    if (!booking) throw new NotFoundException('Booking for payment order not found');
    if (payment.amount !== Math.round(booking.tokenPaid * 100) || payment.currency !== 'INR') {
      throw new BadRequestException('Captured payment amount does not match the booking');
    }
    return this.confirmCapturedPayment(payment.order_id, payment.id);
  }

  private async confirmCapturedPayment(orderId: string, paymentId: string) {
    const booking = await this.prisma.booking.findFirst({ where: { razorpayOrderId: orderId } });
    if (!booking) throw new NotFoundException('Payment order not found');
    if (booking.status === 'CONFIRMED' && booking.razorpayPaymentId === paymentId) {
      const confirmed = await this.prisma.booking.findUnique({ where: { id: booking.id }, include: { farmhouse: true, user: true } });
      return { status: 'success', booking: confirmed };
    }
    const updated = await this.prisma.booking.updateMany({
      where: { id: booking.id, status: 'PENDING_PAYMENT', razorpayPaymentId: null },
      data: { status: 'CONFIRMED', paymentMethod: 'ONLINE', razorpayPaymentId: paymentId },
    });
    if (updated.count !== 1) {
      const latest = await this.prisma.booking.findUnique({ where: { id: booking.id }, include: { farmhouse: true, user: true } });
      if (latest?.status === 'CONFIRMED' && latest.razorpayPaymentId === paymentId) {
        return { status: 'success', booking: latest };
      }
      throw new BadRequestException('This booking has already been settled with a different payment');
    }
    const confirmedBooking = await this.prisma.booking.findUnique({
      where: { id: booking.id },
      include: { farmhouse: true, user: true },
    });
    if (!confirmedBooking) throw new NotFoundException('Confirmed booking not found');
    this.mailService.sendBookingConfirmationEmail(confirmedBooking).catch(console.error);
    this.notificationsService.sendBookingConfirmation(confirmedBooking).catch(console.error);
    return { status: 'success', booking: confirmedBooking };
  }

  async findByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { farmhouse: true },
    });
  }

  async getAvailability(farmhouseId: string, dateStr: string, type: '12H' | '24H') {
    if (!farmhouseId || !dateStr || isNaN(new Date(dateStr).getTime()) || !['12H', '24H'].includes(type)) {
      throw new BadRequestException('Farmhouse, date, and booking type are required');
    }
    try {
      const dayStart = new Date(dateStr);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dateStr);
      dayEnd.setHours(23, 59, 59, 999);
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

      const bookings = await this.prisma.booking.findMany({
        where: {
          farmhouseId,
          OR: [
            { status: 'CONFIRMED' },
            { status: 'PENDING_PAYMENT', createdAt: { gte: fifteenMinsAgo } },
          ],
          checkOut: { gt: dayStart },
          checkIn: { lt: dayEnd }
        },
        orderBy: { checkIn: 'asc' }
      });

      if (bookings.length === 0) {
        if (type === '12H') return ['10:00 AM', '10:00 PM'];
        return ['10:00 AM'];
      }

    const availableSlots: string[] = [];

    const defaultStart = new Date(dateStr);
    defaultStart.setHours(10, 0, 0, 0);
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultStart.getHours() + (type === '12H' ? 12 : 24));
    
    let defaultOverlaps = false;
    for (const b of bookings) {
      if (b.checkIn < defaultEnd && b.checkOut > defaultStart) {
        defaultOverlaps = true; break;
      }
    }
    if (!defaultOverlaps) {
      availableSlots.push('10:00 AM');
    }

    if (type === '12H') {
       const nightStart = new Date(dateStr);
       nightStart.setHours(22, 0, 0, 0);
       const nightEnd = new Date(nightStart);
       nightEnd.setHours(nightStart.getHours() + 12);
       
       let nightOverlaps = false;
       for (const b of bookings) {
         if (b.checkIn < nightEnd && b.checkOut > nightStart) {
           nightOverlaps = true; break;
         }
       }
       if (!nightOverlaps) {
         availableSlots.push('10:00 PM');
       }
    }

    for (const b of bookings) {
       if (b.checkOut > dayStart && b.checkOut < dayEnd) {
         const proposedStart = new Date(b.checkOut);
         const proposedEnd = new Date(proposedStart);
         proposedEnd.setHours(proposedStart.getHours() + (type === '12H' ? 12 : 24));
         
         let overlaps = false;
         for (const other of bookings) {
           if (other.checkIn < proposedEnd && other.checkOut > proposedStart) {
             overlaps = true; break;
           }
         }
         
         if (!overlaps) {
           let hours = proposedStart.getHours();
           const ampm = hours >= 12 ? 'PM' : 'AM';
           hours = hours % 12;
           hours = hours ? hours : 12; 
           const minutes = proposedStart.getMinutes().toString().padStart(2, '0');
           availableSlots.push(`${hours}:${minutes} ${ampm}`);
         }
       }
    }

      return Array.from(new Set(availableSlots));
    } catch (e) {
      console.error('Availability lookup failed:', e);
      if (e instanceof BadRequestException) throw e;
      throw new ServiceUnavailableException('Availability could not be checked. Please retry.');
    }
  }

  async getBookedDates(farmhouseId: string) {
    if (!farmhouseId) return [];

    const bookings = await this.prisma.booking.findMany({
      where: {
        farmhouseId,
        OR: [
          { status: 'CONFIRMED' },
          { status: 'PENDING_PAYMENT', createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
        ],
      },
      select: { checkIn: true, checkOut: true },
    });

    const blocked = await this.prisma.blockedDateRange.findMany({
      where: { farmhouseId },
      select: { startDate: true, endDate: true },
    });

    const bookedSet = new Set<string>();

    const addRangeToSet = (start: Date, end: Date) => {
      const cur = new Date(start);
      cur.setHours(0, 0, 0, 0);
      const last = new Date(end);
      last.setHours(0, 0, 0, 0);

      while (cur < last) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        bookedSet.add(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
      }
    };

    for (const b of bookings) {
      if (b.checkIn && b.checkOut) addRangeToSet(b.checkIn, b.checkOut);
    }
    for (const bl of blocked) {
      if (bl.startDate && bl.endDate) addRangeToSet(bl.startDate, bl.endDate);
    }

    return Array.from(bookedSet);
  }

  async findByOwner(ownerId: string) {
    return this.prisma.booking.findMany({
      where: { farmhouse: { ownerId } },
      include: {
        farmhouse: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    });
  }

  async getOwnerAnalytics(
    ownerId: string,
    role: string,
    farmhouseId?: string,
    period: string = '30d',
    customStartDate?: string,
    customEndDate?: string,
  ) {
    const now = new Date();

    // 1. Resolve Farmhouses
    let targetFarmhouseIds: string[] = [];
    let ownedProperties: Array<{ id: string; title: string }> = [];

    if (role === 'OWNER') {
      const list = await this.prisma.farmhouse.findMany({
        where: { ownerId },
        select: { id: true, title: true },
      });
      ownedProperties = list;
      const allIds = list.map((f) => f.id);
      if (farmhouseId && farmhouseId !== 'ALL' && allIds.includes(farmhouseId)) {
        targetFarmhouseIds = [farmhouseId];
      } else {
        targetFarmhouseIds = allIds;
      }
    } else {
      // ADMIN
      const list = await this.prisma.farmhouse.findMany({
        select: { id: true, title: true },
      });
      ownedProperties = list;
      if (farmhouseId && farmhouseId !== 'ALL') {
        targetFarmhouseIds = [farmhouseId];
      } else {
        targetFarmhouseIds = list.map((f) => f.id);
      }
    }

    if (targetFarmhouseIds.length === 0) {
      return {
        properties: [],
        period,
        dateRange: { start: now.toISOString(), end: now.toISOString() },
        businessHealth: {
          narrative: 'No properties found. Add your first farmhouse to view analytics.',
          alert: null,
          revenueThisPeriod: 0,
          bookingsCount: 0,
          cancellationRate: 0,
          upcomingBookings: 0,
        },
        overview: {
          totalRevenue: 0,
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          upcomingBookings: 0,
          occupancyRate: 0,
        },
        revenueAnalytics: {
          totalBookingValue: 0,
          amountCollected: 0,
          pendingPayments: 0,
          refundsIssued: 0,
          netRevenue: 0,
          monthlyTrends: [],
        },
        cancellationAnalytics: {
          totalBookings: 0,
          cancelledBookings: 0,
          cancellationRate: 0,
          refundsIssued: 0,
          cancelledValue: 0,
          cancellationFeesRetained: 0,
          smartRebookedCount: 0,
          smartRebookedRevenue: 0,
          potentialLostRevenue: 0,
          reasonsBreakdown: [],
          trends: [],
        },
        performance: {
          confirmedBookings: 0,
          completedStays: 0,
          upcomingStays: 0,
          avgBookingValue: 0,
          avgAdvancePayment: 0,
          avgStayDuration: 0,
          weekdayVsWeekend: {
            weekendCount: 0,
            weekendPercent: 0,
            weekdayCount: 0,
            weekdayPercent: 0,
          },
          mostPopularDay: 'Saturday',
        },
        occupancy: {
          totalNights: 0,
          bookedNights: 0,
          blockedNights: 0,
          unbookedNights: 0,
          occupancyRate: 0,
          calendarDays: [],
        },
      };
    }

    // 2. Resolve Date Window
    let startDate: Date;
    let endDate: Date;

    if (period === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
    } else if (period === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === '3m') {
      startDate = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
    } else {
      // 30d default
      startDate = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
    }

    // 3. Fetch Bookings in period & historical for trends
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);

    const [periodBookings, allHistoricalBookings, blockedRanges] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          farmhouseId: { in: targetFarmhouseIds },
          checkIn: { gte: startDate, lte: endDate },
        },
        include: {
          farmhouse: { select: { id: true, title: true } },
          user: { select: { name: true, phone: true } },
        },
        orderBy: { checkIn: 'asc' },
      }),
      this.prisma.booking.findMany({
        where: {
          farmhouseId: { in: targetFarmhouseIds },
          checkIn: { gte: sixMonthsAgo },
        },
        select: {
          id: true,
          farmhouseId: true,
          checkIn: true,
          checkOut: true,
          totalAmount: true,
          tokenPaid: true,
          status: true,
          refundAmount: true,
          cancellationReason: true,
        },
      }),
      this.prisma.blockedDateRange.findMany({
        where: {
          farmhouseId: { in: targetFarmhouseIds },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      }),
    ]);

    // 4. Calculations
    const confirmedAndCompleted = periodBookings.filter(
      (b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED',
    );
    const cancelledList = periodBookings.filter((b) => b.status === 'CANCELLED');
    const totalBookingsCount = periodBookings.length;

    // Completed stays: status COMPLETED or (CONFIRMED and checkOut <= now)
    const completedStays = confirmedAndCompleted.filter(
      (b) => b.status === 'COMPLETED' || new Date(b.checkOut) <= now,
    );
    // Upcoming stays: CONFIRMED and checkIn > now
    const upcomingStays = confirmedAndCompleted.filter(
      (b) => b.status === 'CONFIRMED' && new Date(b.checkIn) > now,
    );

    // Revenue metrics
    const totalBookingValue = confirmedAndCompleted.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0,
    );
    const totalTokenPaid = confirmedAndCompleted.reduce(
      (sum, b) => sum + (b.tokenPaid || 0),
      0,
    );
    const confirmedCash = confirmedAndCompleted
      .filter((b) => b.cashPaymentConfirmedByOwner && b.paymentMethod === 'CASH')
      .reduce((sum, b) => sum + Math.max(0, (b.totalAmount || 0) - (b.tokenPaid || 0)), 0);
    const amountCollected = totalTokenPaid + confirmedCash;
    const pendingPayments = Math.max(0, totalBookingValue - amountCollected);

    const refundsIssued = cancelledList.reduce(
      (sum, b) => sum + (b.refundAmount || 0),
      0,
    );
    const netRevenue = Math.max(0, totalBookingValue - refundsIssued);

    // Cancellation Analytics
    const cancellationRate = totalBookingsCount > 0
      ? Math.round((cancelledList.length / totalBookingsCount) * 1000) / 10
      : 0;
    const cancelledValue = cancelledList.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const cancellationFeesRetained = cancelledList.reduce((sum, b) => {
      const retained = (b.tokenPaid || 0) - (b.refundAmount || 0);
      return sum + Math.max(0, retained);
    }, 0);

    // Smart Rebooked Calculation:
    // Check if each cancelled booking was re-booked by an active confirmed/completed booking
    let smartRebookedCount = 0;
    let smartRebookedRevenue = 0;

    for (const cb of cancelledList) {
      const cbIn = new Date(cb.checkIn).getTime();
      const cbOut = new Date(cb.checkOut).getTime();
      const replacement = allHistoricalBookings.find((hb) => {
        if (hb.farmhouseId !== cb.farmhouseId || hb.id === cb.id) return false;
        if (hb.status !== 'CONFIRMED' && hb.status !== 'COMPLETED') return false;
        const hbIn = new Date(hb.checkIn).getTime();
        const hbOut = new Date(hb.checkOut).getTime();
        return hbIn < cbOut && hbOut > cbIn;
      });

      if (replacement) {
        smartRebookedCount += 1;
        smartRebookedRevenue += Math.min(cb.totalAmount || 0, replacement.totalAmount || 0);
      }
    }

    const potentialLostRevenue = Math.max(
      0,
      cancelledValue - smartRebookedRevenue - cancellationFeesRetained,
    );

    // Cancellation Reasons Breakdown
    const reasonCounts: Record<string, number> = {};
    for (const cb of cancelledList) {
      const r = cb.cancellationReason?.trim() || 'Other / Not Specified';
      reasonCounts[r] = (reasonCounts[r] || 0) + 1;
    }
    const reasonsBreakdown = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percent: cancelledList.length > 0 ? Math.round((count / cancelledList.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Booking Performance: Avg value, avg advance, stay duration, weekday vs weekend
    const avgBookingValue = confirmedAndCompleted.length > 0
      ? Math.round(totalBookingValue / confirmedAndCompleted.length)
      : 0;
    const avgAdvancePayment = confirmedAndCompleted.length > 0
      ? Math.round(totalTokenPaid / confirmedAndCompleted.length)
      : 0;

    let totalNightsSum = 0;
    let weekendCount = 0;
    let weekdayCount = 0;
    const dayFrequency: Record<string, number> = {
      Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0,
    };
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const b of confirmedAndCompleted) {
      const inDate = new Date(b.checkIn);
      const outDate = new Date(b.checkOut);
      const nights = Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 3600 * 24)));
      totalNightsSum += nights;

      const dayIdx = inDate.getDay();
      const dayName = dayNames[dayIdx];
      dayFrequency[dayName] = (dayFrequency[dayName] || 0) + 1;

      // Friday (5), Saturday (6), Sunday (0) count as Weekend
      if (dayIdx === 0 || dayIdx === 5 || dayIdx === 6) {
        weekendCount += 1;
      } else {
        weekdayCount += 1;
      }
    }

    const avgStayDuration = confirmedAndCompleted.length > 0
      ? Math.round((totalNightsSum / confirmedAndCompleted.length) * 10) / 10
      : 1;

    const totalDatedBookings = weekendCount + weekdayCount;
    const weekendPercent = totalDatedBookings > 0 ? Math.round((weekendCount / totalDatedBookings) * 100) : 0;
    const weekdayPercent = totalDatedBookings > 0 ? Math.round((weekdayCount / totalDatedBookings) * 100) : 0;

    let mostPopularDay = 'Saturday';
    let maxDayCount = -1;
    for (const [d, count] of Object.entries(dayFrequency)) {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostPopularDay = d;
      }
    }

    // Occupancy calculation for the period
    const msInDay = 1000 * 3600 * 24;
    const totalDaysCount = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msInDay));
    const totalPossibleNights = totalDaysCount * Math.max(1, targetFarmhouseIds.length);

    // Collect calendar days representation (for up to 31 days in range)
    const calendarDays: Array<{
      date: string;
      dayOfWeek: string;
      status: 'BOOKED' | 'AVAILABLE' | 'BLOCKED' | 'CANCELLED';
    }> = [];

    const maxDaysToDisplay = Math.min(31, totalDaysCount);
    let totalBookedNightsCount = 0;
    let totalBlockedNightsCount = 0;

    for (let i = 0; i < maxDaysToDisplay; i++) {
      const currentDay = new Date(startDate.getTime() + i * msInDay);
      const dateStr = currentDay.toISOString().split('T')[0];
      const dayName = dayNames[currentDay.getDay()];
      const dayTime = currentDay.getTime();

      // Check if booked
      const isBooked = confirmedAndCompleted.some((b) => {
        const bIn = new Date(b.checkIn).getTime();
        const bOut = new Date(b.checkOut).getTime();
        return dayTime >= bIn && dayTime < bOut;
      });

      // Check if blocked
      const isBlocked = blockedRanges.some((br) => {
        const sTime = new Date(br.startDate).getTime();
        const eTime = new Date(br.endDate).getTime();
        return dayTime >= sTime && dayTime <= eTime;
      });

      // Check if cancelled
      const isCancelled = cancelledList.some((cb) => {
        const cbIn = new Date(cb.checkIn).getTime();
        const cbOut = new Date(cb.checkOut).getTime();
        return dayTime >= cbIn && dayTime < cbOut;
      });

      let status: 'BOOKED' | 'AVAILABLE' | 'BLOCKED' | 'CANCELLED' = 'AVAILABLE';
      if (isBooked) {
        status = 'BOOKED';
        totalBookedNightsCount += 1;
      } else if (isBlocked) {
        status = 'BLOCKED';
        totalBlockedNightsCount += 1;
      } else if (isCancelled) {
        status = 'CANCELLED';
      }

      calendarDays.push({
        date: dateStr,
        dayOfWeek: dayName.slice(0, 3),
        status,
      });
    }

    const unbookedNightsCount = Math.max(
      0,
      totalPossibleNights - totalBookedNightsCount - totalBlockedNightsCount,
    );
    const bookableNights = Math.max(1, totalPossibleNights - totalBlockedNightsCount);
    const occupancyRate = Math.min(100, Math.round((totalBookedNightsCount / bookableNights) * 100));

    // Monthly trends (Last 6 months)
    const monthlyTrendsMap: Record<string, { revenue: number; bookings: number }> = {};
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const key = d.toLocaleString('en-IN', { month: 'short' });
      monthlyTrendsMap[key] = { revenue: 0, bookings: 0 };
    }

    for (const b of allHistoricalBookings) {
      if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
        const bMonth = new Date(b.checkIn).toLocaleString('en-IN', { month: 'short' });
        if (monthlyTrendsMap[bMonth]) {
          monthlyTrendsMap[bMonth].revenue += b.totalAmount || 0;
          monthlyTrendsMap[bMonth].bookings += 1;
        }
      }
    }

    const monthlyTrends = Object.entries(monthlyTrendsMap).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      bookings: data.bookings,
    }));

    // Hero narrative synthesis
    const propertyLabel = targetFarmhouseIds.length === 1 ? 'your property' : 'your properties';
    const narrative = `In this period, ${propertyLabel} generated ₹${netRevenue.toLocaleString('en-IN')} across ${totalBookingsCount} bookings with an occupancy rate of ${occupancyRate}%. You have ${upcomingStays.length} upcoming guest stays.`;

    let alert: string | null = null;
    if (cancelledList.length > 0) {
      alert = `⚠️ ${cancelledList.length} ${cancelledList.length === 1 ? 'cancellation' : 'cancellations'} occurred in this period. Review reasons below to identify recurring patterns.`;
    } else if (occupancyRate >= 70) {
      alert = `🔥 High demand! Your property achieved ${occupancyRate}% occupancy this period.`;
    } else if (occupancyRate < 35 && totalBookingsCount > 0) {
      alert = `💡 Weekday demand is open. Offering special weekday packages could lift occupancy.`;
    }

    // Phase 3: Growth & Optimization Tools
    // 1. Repeat Customer Metrics across all confirmed/completed bookings for this owner
    const allCustomerBookings = await this.prisma.booking.findMany({
      where: {
        farmhouseId: { in: targetFarmhouseIds },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { checkIn: 'desc' },
    });

    const guestMap: Record<
      string,
      { id: string; name: string; phone: string; visits: number; totalSpent: number; lastStay: string }
    > = {};

    for (const b of allCustomerBookings) {
      const identifier = b.user?.phone || b.userId;
      if (!guestMap[identifier]) {
        guestMap[identifier] = {
          id: b.userId,
          name: b.user?.name || 'Guest User',
          phone: b.user?.phone || '',
          visits: 0,
          totalSpent: 0,
          lastStay: b.checkIn.toISOString().split('T')[0],
        };
      }
      guestMap[identifier].visits += 1;
      guestMap[identifier].totalSpent += b.totalAmount || 0;
    }

    const allGuests = Object.values(guestMap);
    const totalUniqueGuests = allGuests.length;
    const repeatGuests = allGuests.filter((g) => g.visits >= 2);
    const repeatGuestsCount = repeatGuests.length;
    const newGuestsCount = Math.max(0, totalUniqueGuests - repeatGuestsCount);
    const repeatGuestRate =
      totalUniqueGuests > 0 ? Math.round((repeatGuestsCount / totalUniqueGuests) * 100) : 0;
    const topLoyalGuests = [...allGuests]
      .sort((a, b) => b.visits - a.visits || b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // 2. Underperforming Date Alerts (Gap Watcher for upcoming 14 days)
    const in14Days = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
    const upcoming14Bookings = await this.prisma.booking.findMany({
      where: {
        farmhouseId: { in: targetFarmhouseIds },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        checkIn: { gte: now, lte: in14Days },
      },
      select: { checkIn: true, checkOut: true },
    });

    const underperformingAlerts: Array<{
      type: 'URGENT_WEEKEND_GAP' | 'WEEKDAY_LULL';
      priority: 'HIGH' | 'MEDIUM';
      title: string;
      message: string;
      suggestedDiscount: string;
      targetDates: string;
    }> = [];

    // Scan for unbooked upcoming weekend days
    for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
      const futureDate = new Date(now.getTime() + dayOffset * 24 * 3600 * 1000);
      const dayOfWeek = futureDate.getDay();
      const isWeekendDay = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0; // Fri/Sat/Sun

      if (isWeekendDay) {
        const isCovered = upcoming14Bookings.some((b) => {
          const bIn = new Date(b.checkIn).getTime();
          const bOut = new Date(b.checkOut).getTime();
          return futureDate.getTime() >= bIn && futureDate.getTime() < bOut;
        });

        if (!isCovered) {
          const dateLabel = futureDate.toLocaleDateString('en-IN', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          const daysAway = dayOffset;
          const isHighPriority = daysAway <= 7;

          // Don't add duplicate alert for same weekend
          const existingAlert = underperformingAlerts.find(
            (a) => a.type === 'URGENT_WEEKEND_GAP' && Math.abs(daysAway - 1) <= 2,
          );

          if (!existingAlert && underperformingAlerts.length < 3) {
            underperformingAlerts.push({
              type: 'URGENT_WEEKEND_GAP',
              priority: isHighPriority ? 'HIGH' : 'MEDIUM',
              title: `Upcoming Weekend (${dateLabel}) Unbooked`,
              message: `${dateLabel} is only ${daysAway} days away with 0 confirmed bookings. Offer a last-minute deal to secure guests.`,
              suggestedDiscount: '15% OFF Flash Deal',
              targetDates: dateLabel,
            });
          }
        }
      }
    }

    // 3. Promotional Offer Suggestions
    const promotionalSuggestions: Array<{
      title: string;
      reason: string;
      discountBadge: string;
      targetAudience: string;
    }> = [];

    if (underperformingAlerts.length > 0) {
      promotionalSuggestions.push({
        title: 'Last-Minute Weekend Special',
        reason: 'Fill upcoming vacant weekend dates before the weekend begins.',
        discountBadge: '15% OFF',
        targetAudience: 'Couples & Quick Weekend Getaways',
      });
    }

    if (weekdayPercent < 35) {
      promotionalSuggestions.push({
        title: 'Mid-Week Workation Package',
        reason: 'Boost Monday-Thursday stays when weekend demand is already high.',
        discountBadge: '20% OFF',
        targetAudience: 'Remote Workers & Small Teams',
      });
    }

    promotionalSuggestions.push({
      title: 'Repeat Guest VIP Appreciation',
      reason: 'Encourage past guests to rebook for upcoming holidays.',
      discountBadge: '10% Exclusive Credit',
      targetAudience: 'Past Returning Guests',
    });

    return {
      properties: ownedProperties,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      businessHealth: {
        narrative,
        alert,
        revenueThisPeriod: netRevenue,
        bookingsCount: totalBookingsCount,
        cancellationRate,
        upcomingBookings: upcomingStays.length,
      },
      overview: {
        totalRevenue: netRevenue,
        totalBookings: totalBookingsCount,
        completedBookings: completedStays.length,
        cancelledBookings: cancelledList.length,
        upcomingBookings: upcomingStays.length,
        occupancyRate,
      },
      revenueAnalytics: {
        totalBookingValue,
        amountCollected,
        pendingPayments,
        refundsIssued,
        netRevenue,
        monthlyTrends,
      },
      cancellationAnalytics: {
        totalBookings: totalBookingsCount,
        cancelledBookings: cancelledList.length,
        cancellationRate,
        refundsIssued,
        cancelledValue,
        cancellationFeesRetained,
        smartRebookedCount,
        smartRebookedRevenue,
        potentialLostRevenue,
        reasonsBreakdown,
        trends: [],
      },
      performance: {
        confirmedBookings: confirmedAndCompleted.length,
        completedStays: completedStays.length,
        upcomingStays: upcomingStays.length,
        avgBookingValue,
        avgAdvancePayment,
        avgStayDuration,
        weekdayVsWeekend: {
          weekendCount,
          weekendPercent,
          weekdayCount,
          weekdayPercent,
        },
        mostPopularDay,
      },
      occupancy: {
        totalNights: totalPossibleNights,
        bookedNights: totalBookedNightsCount,
        blockedNights: totalBlockedNightsCount,
        unbookedNights: unbookedNightsCount,
        occupancyRate,
        calendarDays,
      },
      growth: {
        underperformingAlerts,
        promotionalSuggestions,
        repeatCustomers: {
          totalUniqueGuests,
          repeatGuestsCount,
          newGuestsCount,
          repeatGuestRate,
          topLoyalGuests,
        },
      },
    };
  }

  async findAll() {
    return this.prisma.booking.findMany({
      include: {
        farmhouse: {
          select: { title: true, owner: { select: { name: true } } },
        },
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdminBooking(createBookingDto: CreateBookingDto, userId: string, actorId: string, actorRole: string) {
    const farmhouse = await this.prisma.farmhouse.findUnique({
      where: { id: createBookingDto.farmhouseId },
    });
    if (!farmhouse) throw new NotFoundException('Farmhouse not found');
    if (actorRole === 'OWNER' && farmhouse.ownerId !== actorId) {
      throw new BadRequestException('You do not own this farmhouse');
    }

    const checkIn = new Date(createBookingDto.checkIn);
    const checkOut = new Date(createBookingDto.checkOut);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24),
    );

    if (nights < 0 || checkOut <= checkIn)
      throw new BadRequestException('Check-out must be after check-in');

    // Time-based Overlap Check
    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        farmhouseId: farmhouse.id,
        status: { notIn: ['CANCELLED', 'ABANDONED'] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    });
    if (overlappingBooking) {
      throw new BadRequestException(
        'This time slot overlaps with an existing booking.',
      );
    }

    const overlappingBlocked = await this.prisma.blockedDateRange.findFirst({
      where: {
        farmhouseId: farmhouse.id,
        startDate: { lt: checkOut },
        endDate: { gt: checkIn },
      },
    });
    if (overlappingBlocked) {
      throw new BadRequestException(
        'This time slot overlaps with blocked dates.',
      );
    }

    const totalAmount =
      nights === 0 ? farmhouse.price12Hours : nights * farmhouse.price24Hours;
    const tokenPaid = farmhouse.tokenAmount || 2000;

    const booking = await this.prisma.booking.create({
      data: {
        checkIn,
        checkOut,
        adults: createBookingDto.adults,
        children: createBookingDto.children,
        totalAmount,
        tokenPaid,
        ...commissionSnapshot(totalAmount, farmhouse.defaultCommissionPercentage),
        userId,
        farmhouseId: farmhouse.id,
        status: 'CONFIRMED', // Admin books are automatically confirmed
      },
    });

    const confirmedBooking = await this.prisma.booking.findUnique({
      where: { id: booking.id },
      include: { farmhouse: true, user: true },
    });
    if (confirmedBooking) {
      this.mailService.sendBookingConfirmationEmail(confirmedBooking).catch(console.error);
      this.notificationsService.sendBookingConfirmation(confirmedBooking).catch(console.error);
      return confirmedBooking;
    }
    return booking;
  }

  async generateInvoicePdf(bookingId: string, res: any, actorId: string, actorRole: string) {
    const PDFDocument = require('pdfkit');

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        farmhouse: { include: { owner: true } },
        user: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (actorRole === 'CUSTOMER' && booking.userId !== actorId) {
      throw new BadRequestException('This invoice does not belong to you');
    }
    if (actorRole === 'OWNER' && booking.farmhouse.ownerId !== actorId) {
      throw new BadRequestException('You do not own this farmhouse');
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${booking.id}.pdf`,
    );

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('StayGrid', { align: 'right' });
    doc.fontSize(10).text('123 Booking Street, Tech City', { align: 'right' });
    doc.text('contact@staygrid.com', { align: 'right' });
    doc.moveDown();

    // Title
    doc.fontSize(24).text('INVOICE', { align: 'left' });
    doc
      .fontSize(10)
      .text(`Invoice Number: INV-${booking.id.substring(0, 8).toUpperCase()}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown(2);

    // Bill To
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10).text(`Name: ${booking.user.name}`);
    doc.text(`Email: ${booking.user.email}`);
    if (booking.user.phone) doc.text(`Phone: ${booking.user.phone}`);
    doc.moveDown(2);

    // Booking Details
    doc.fontSize(12).text('Booking Details:', { underline: true });
    doc.fontSize(10).text(`Farmhouse: ${booking.farmhouse.title}`);
    doc.text(`Location: StayGrid Verified Property`);
    doc.text(`Check-In: ${booking.checkIn.toLocaleDateString()}`);
    doc.text(`Check-Out: ${booking.checkOut.toLocaleDateString()}`);
    doc.text(`Guests: ${booking.adults} Adults, ${booking.children} Children`);
    doc.moveDown(2);

    // Pricing Table
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Total', 450, tableTop, { align: 'right' });
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(500, tableTop + 15)
      .stroke();

    doc.font('Helvetica');
    doc.text('Farmhouse Stay', 50, tableTop + 25);
    doc.text(`INR ${booking.totalAmount.toFixed(2)}`, 450, tableTop + 25, {
      align: 'right',
    });

    doc.text('Token Amount Paid', 50, tableTop + 45);
    doc.text(`INR ${booking.tokenPaid.toFixed(2)}`, 450, tableTop + 45, {
      align: 'right',
    });

    doc.font('Helvetica-Bold');
    doc.text('Balance Due', 50, tableTop + 75);
    doc.text(
      `INR ${(booking.totalAmount - booking.tokenPaid).toFixed(2)}`,
      450,
      tableTop + 75,
      { align: 'right' },
    );

    doc
      .moveTo(50, tableTop + 90)
      .lineTo(500, tableTop + 90)
      .stroke();

    doc.moveDown(4);
    doc
      .font('Helvetica')
      .fontSize(10)
      .text('Thank you for booking with StayGrid!', { align: 'center' });

    doc.end();
  }

  async saveBooking(createBookingDto: CreateBookingDto, userId: string) {
    const farmhouse = await this.prisma.farmhouse.findUnique({
      where: { id: createBookingDto.farmhouseId },
    });
    if (!farmhouse) throw new NotFoundException('Farmhouse not found');

    const checkIn = new Date(createBookingDto.checkIn);
    const checkOut = new Date(createBookingDto.checkOut);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24),
    );
    const totalAmount =
      nights === 0 ? farmhouse.price12Hours : nights * farmhouse.price24Hours;
    const tokenPaid = farmhouse.tokenAmount || 2000;

    return this.prisma.booking.create({
      data: {
        checkIn,
        checkOut,
        adults: createBookingDto.adults,
        children: createBookingDto.children,
        totalAmount,
        tokenPaid,
        ...commissionSnapshot(totalAmount, farmhouse.defaultCommissionPercentage),
        notes: createBookingDto.notes || null,
        status: 'SAVED',
        userId,
        farmhouseId: farmhouse.id,
      },
      include: { farmhouse: true },
    });
  }

  async rearrangeBooking(id: string, checkInStr: string, checkOutStr: string, actorId: string, actorRole: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { farmhouse: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (actorRole === 'OWNER' && booking.farmhouse.ownerId !== actorId) {
      throw new BadRequestException('You do not own this farmhouse');
    }

    const newCheckIn = new Date(checkInStr);
    const newCheckOut = new Date(checkOutStr);

    if (
      isNaN(newCheckIn.getTime()) ||
      isNaN(newCheckOut.getTime()) ||
      newCheckOut <= newCheckIn
    ) {
      throw new BadRequestException('Invalid check-in or check-out date');
    }

    const overlap = await this.prisma.booking.findFirst({
      where: {
        farmhouseId: booking.farmhouseId,
        id: { not: id },
        status: { notIn: ['CANCELLED', 'ABANDONED', 'SAVED'] },
        checkIn: { lt: newCheckOut },
        checkOut: { gt: newCheckIn },
      },
    });

    if (overlap) {
      throw new BadRequestException(
        'Selected new dates overlap with an existing booking',
      );
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        checkIn: newCheckIn,
        checkOut: newCheckOut,
      },
      include: { farmhouse: true, user: true },
    });
  }

  async cancelBooking(id: string, userId: string, userRole: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { farmhouse: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (userRole === 'CUSTOMER' && booking.userId !== userId) {
      throw new BadRequestException('This booking does not belong to you');
    }
    if (userRole === 'OWNER' && booking.farmhouse.ownerId !== userId) {
      throw new BadRequestException('You do not own this farmhouse');
    }

    const hoursSinceBooking = (Date.now() - booking.createdAt.getTime()) / (1000 * 3600);
    const daysUntilCheckIn = (booking.checkIn.getTime() - Date.now()) / (1000 * 3600 * 24);

    let refundPercent: number;
    // 2-hour unconditional grace period
    if (hoursSinceBooking <= 2) {
      refundPercent = 100;
    } else if (daysUntilCheckIn >= 30) {
      refundPercent = 100;
    } else if (daysUntilCheckIn >= 15) {
      refundPercent = 50;
    } else {
      refundPercent = 0;
    }

    const refundAmount = Math.round(booking.tokenPaid * refundPercent / 100);

    const cancelledBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason || null,
        refundAmount,
        refundStatus: refundAmount > 0 ? 'PENDING' : 'NONE',
        cancelledAt: new Date(),
      },
      include: { farmhouse: true, user: true },
    });

    if (booking.status !== 'CANCELLED') {
      const guest = cancelledBooking.user;
      const title = cancelledBooking.farmhouse?.title || 'your stay';
      if (guest?.email) {
        this.mailService.sendCancellationEmail(
          guest.email, guest.name, title, refundAmount,
          refundAmount > 0 ? 'Pending' : 'No refund due',
        ).catch(console.error);
      }
      this.notificationsService.sendBookingCancellation(cancelledBooking).catch(console.error);
    }
    return cancelledBooking;
  }

  async confirmCashPayment(bookingId: string, userRole: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { farmhouse: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const updateData: any = {};
    if (userRole === 'OWNER') {
      // Verify this owner owns the farmhouse
      if (booking.farmhouse.ownerId !== userId) {
        throw new BadRequestException('You do not own this farmhouse');
      }
      updateData.cashPaymentConfirmedByOwner = true;
    } else {
      // Customer confirming
      if (booking.userId !== userId) {
        throw new BadRequestException('This is not your booking');
      }
      updateData.cashPaymentConfirmedByUser = true;
    }

    updateData.paymentMethod = 'CASH';

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: { farmhouse: true, user: true },
    });
    const wasConfirmed = booking.cashPaymentConfirmedByOwner && booking.cashPaymentConfirmedByUser;
    const isConfirmed = updatedBooking.cashPaymentConfirmedByOwner && updatedBooking.cashPaymentConfirmedByUser;
    if (!wasConfirmed && isConfirmed) {
      this.mailService.sendCashPaymentConfirmedEmail(updatedBooking).catch(console.error);
      this.notificationsService.sendCashPaymentConfirmed(updatedBooking).catch(console.error);
    }
    return updatedBooking;
  }
}
