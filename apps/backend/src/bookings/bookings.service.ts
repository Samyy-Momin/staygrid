import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class BookingsService {
  private razorpay: any;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });
  }

  async createBooking(createBookingDto: CreateBookingDto, userId: string) {
    const farmhouse = await this.prisma.farmhouse.findUnique({
      where: { id: createBookingDto.farmhouseId },
    });
    if (!farmhouse) throw new NotFoundException('Farmhouse not found');

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

    // Use a fixed price if it's a partial day, otherwise normal calculation (can be edited later by Admin)
    const totalAmount =
      nights === 0 ? farmhouse.pricePerNight : nights * farmhouse.pricePerNight;
    const tokenPaid = farmhouse.tokenAmount || 2000;

    const booking = await this.prisma.booking.create({
      data: {
        checkIn,
        checkOut,
        adults: createBookingDto.adults,
        children: createBookingDto.children,
        totalAmount,
        tokenPaid,
        userId,
        farmhouseId: farmhouse.id,
      },
    });

    // Create Razorpay Order
    const options = {
      amount: Math.round(tokenPaid * 100), // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: booking.id,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const order = await this.razorpay.orders.create(options);

    return await this.prisma.booking.update({
      where: { id: booking.id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      data: { razorpayOrderId: order.id } as any,
    });
  }

  async verifyPayment(verifyDto: VerifyPaymentDto) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = verifyDto;

    const secret: string = this.configService.get('RAZORPAY_KEY_SECRET') || '';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    if (generatedSignature === razorpaySignature) {
      // Payment is successful

      const booking = await this.prisma.booking.findFirst({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: { razorpayOrderId } as any,
      });
      if (!booking) throw new NotFoundException('Booking not found');

      return this.prisma.booking.update({
        where: { id: booking.id },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: {
          status: 'CONFIRMED',
          razorpayPaymentId,
        } as any,
      });
    } else {
      throw new BadRequestException('Invalid signature');
    }
  }

  async findByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { farmhouse: true },
    });
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

  async createAdminBooking(createBookingDto: CreateBookingDto, userId: string) {
    const farmhouse = await this.prisma.farmhouse.findUnique({
      where: { id: createBookingDto.farmhouseId },
    });
    if (!farmhouse) throw new NotFoundException('Farmhouse not found');

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
      nights === 0 ? farmhouse.pricePerNight : nights * farmhouse.pricePerNight;
    const tokenPaid = farmhouse.tokenAmount || 2000;

    const booking = await this.prisma.booking.create({
      data: {
        checkIn,
        checkOut,
        adults: createBookingDto.adults,
        children: createBookingDto.children,
        totalAmount,
        tokenPaid,
        userId,
        farmhouseId: farmhouse.id,
        status: 'CONFIRMED', // Admin books are automatically confirmed
      },
    });

    return booking;
  }

  async generateInvoicePdf(bookingId: string, res: any) {
    const PDFDocument = require('pdfkit');

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        farmhouse: { include: { owner: true } },
        user: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

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

  async cancelBooking(id: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
