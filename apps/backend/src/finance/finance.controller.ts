import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin Money & Finance')
@Controller('admin/finance')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get Executive Money Overview & Attention Items' })
  async getOverview() {
    return this.financeService.getOverview();
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get Human-Readable Bookings Financial List' })
  async getBookings(@Query('tab') tab?: string, @Query('search') search?: string) {
    return this.financeService.getBookings(tab, search);
  }

  @Get('bookings/:id')
  @ApiOperation({ summary: 'Get Booking Financial Detail & Audit History' })
  async getBookingDetail(@Param('id') id: string) {
    return this.financeService.getBookingDetail(id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get Immutable Financial Transaction Audit Logs' })
  async getHistory() {
    return this.financeService.getHistory();
  }

  @Patch('confirm-cash/:bookingId')
  @ApiOperation({ summary: 'Confirm Check-in Cash Collection by Caretaker' })
  async confirmCash(@Param('bookingId') bookingId: string) {
    return this.financeService.confirmCash(bookingId);
  }

  @Patch('payout/:bookingId')
  @ApiOperation({ summary: 'Settle Owner Payout with Bank UTR Number' })
  async settleOwnerPayout(
    @Param('bookingId') bookingId: string,
    @Body('txnId') txnId: string,
  ) {
    return this.financeService.settleOwnerPayout(bookingId, txnId);
  }

  @Patch('record-owner-payment/:bookingId')
  @ApiOperation({ summary: 'Record Owner Payment to StayGrid (When Owner Owes StayGrid)' })
  async recordOwnerPayment(
    @Param('bookingId') bookingId: string,
    @Body('txnId') txnId: string,
  ) {
    return this.financeService.recordOwnerPayment(bookingId, txnId);
  }

  @Patch('refund/:bookingId')
  @ApiOperation({ summary: 'Settle Customer Refund with Optional Override' })
  async settleCustomerRefund(
    @Param('bookingId') bookingId: string,
    @Body('refundAmount') refundAmount: number,
    @Body('isOverride') isOverride: boolean,
    @Body('reason') reason?: string,
    @Body('txnId') txnId?: string,
  ) {
    return this.financeService.settleCustomerRefund(bookingId, refundAmount, isOverride, reason, txnId);
  }

  @Patch('commission/:bookingId')
  @ApiOperation({ summary: 'Change StayGrid Share / Commission %' })
  async updateCommission(
    @Param('bookingId') bookingId: string,
    @Body('commissionPercentage') commissionPercentage: number,
    @Body('reason') reason?: string,
    @Body('notes') notes?: string,
  ) {
    return this.financeService.updateCommission(bookingId, commissionPercentage, reason, notes);
  }
}
