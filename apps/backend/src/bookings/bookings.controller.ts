import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Param,
  Res,
  Patch,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string; [key: string]: any };
}

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create Booking',
    description: 'Creates a booking and a Razorpay order (Protected)',
  })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(createBookingDto, req.user.id);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verify Payment',
    description: 'Verifies Razorpay signature and confirms booking',
  })
  async verifyPayment(@Body() verifyDto: VerifyPaymentDto) {
    return this.bookingsService.verifyPayment(verifyDto);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'My Bookings',
    description: 'Get all bookings for the logged-in customer',
  })
  async getMyBookings(@Req() req: AuthenticatedRequest) {
    return this.bookingsService.findByUser(req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'All Bookings (Role Aware)',
    description: 'Get all bookings (System Admin sees all, Owner sees theirs)',
  })
  async getAllBookings(@Req() req: AuthenticatedRequest) {
    if (req.user.role === Role.OWNER) {
      return this.bookingsService.findByOwner(req.user.id);
    }
    return this.bookingsService.findAll();
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin Create Booking',
    description: 'Creates a confirmed booking on behalf of an end user',
  })
  async createAdminBooking(
    @Body() createBookingDto: CreateBookingDto & { userId: string },
  ) {
    const { userId, ...dto } = createBookingDto;
    return this.bookingsService.createAdminBooking(dto, userId);
  }

  @Get(':id/invoice')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Download Invoice',
    description: 'Generates and streams a PDF invoice for a booking',
  })
  async getInvoice(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: any,
  ) {
    return this.bookingsService.generateInvoicePdf(id, res);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel Booking',
    description: 'Mark a booking as CANCELLED',
  })
  async cancelBooking(@Param('id') id: string) {
    return this.bookingsService.cancelBooking(id);
  }
}
