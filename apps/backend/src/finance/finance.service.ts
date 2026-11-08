import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Round monetary amounts safely to 2 decimal places
  private roundMoney(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  // Calculate Policy Refund Recommendation
  private calculatePolicyRefund(booking: any): number {
    if (!booking.tokenPaid || booking.tokenPaid <= 0) return 0;
    const tokenPaid = Number(booking.tokenPaid);
    const createdAt = new Date(booking.createdAt).getTime();
    const cancelledAt = booking.cancelledAt ? new Date(booking.cancelledAt).getTime() : Date.now();
    const checkIn = new Date(booking.checkIn).getTime();

    // Grace Period: Cancelled within 2 hours of booking -> 100% refund
    if (cancelledAt - createdAt <= 2 * 3600 * 1000) {
      return tokenPaid;
    }

    const daysBeforeCheckIn = (checkIn - cancelledAt) / (1000 * 3600 * 24);

    if (daysBeforeCheckIn >= 30) {
      return tokenPaid; // 100% refund
    } else if (daysBeforeCheckIn >= 15) {
      return this.roundMoney(tokenPaid * 0.5); // 50% refund
    } else {
      return 0; // 0% refund (token forfeited)
    }
  }

  // Overview: Money Control Room Data
  async getOverview() {
    const rawBookings = await this.prisma.booking.findMany({
      include: { farmhouse: true },
    });

    let totalBookingValue = 0;
    let staygridReceivedTotal = 0;
    let staygridEarnsTotal = 0;
    let ownerPaymentsTotal = 0;
    let refundsTotal = 0;

    let ownersToPayCount = 0;
    let cashUnconfirmedCount = 0;
    let refundsPendingCount = 0;

    rawBookings.forEach((b: any) => {
      const total = Number(b.totalAmount || 0);
      const token = Number(b.tokenPaid || 0);
      const isCancelled = b.status === 'CANCELLED';
      const commPct = Number(b.commissionPercentage ?? b.farmhouse?.defaultCommissionPercentage ?? 20.0);
      const staygridEarns = this.roundMoney((total * commPct) / 100);
      const ownerShare = this.roundMoney(total - staygridEarns);

      if (!isCancelled && b.status !== 'ABANDONED') {
        totalBookingValue += total;
        staygridReceivedTotal += token;
        staygridEarnsTotal += staygridEarns;

        const isCashConfirmed = b.cashPaymentConfirmedByOwner || b.cashPaymentConfirmedByUser;
        const ownerGot = isCashConfirmed ? Math.max(0, total - token) : 0;
        const ownerRemaining = this.roundMoney(ownerShare - ownerGot);

        if (!isCashConfirmed && total > token) {
          cashUnconfirmedCount += 1;
        }

        if (b.ownerPayoutStatus !== 'PAID' && ownerRemaining > 0 && isCashConfirmed) {
          ownerPaymentsTotal += ownerRemaining;
          ownersToPayCount += 1;
        }
      }

      if (isCancelled) {
        const policyRefund = this.calculatePolicyRefund(b);
        const actualRefund = b.refundAmount !== null && b.refundAmount !== undefined ? Number(b.refundAmount) : policyRefund;
        if (b.refundStatus !== 'PROCESSED' && actualRefund > 0) {
          refundsTotal += actualRefund;
          refundsPendingCount += 1;
        }
      }
    });

    return {
      totalBookingValue: this.roundMoney(totalBookingValue),
      staygridReceivedTotal: this.roundMoney(staygridReceivedTotal),
      staygridEarnsTotal: this.roundMoney(staygridEarnsTotal),
      ownerPaymentsTotal: this.roundMoney(ownerPaymentsTotal),
      refundsTotal: this.roundMoney(refundsTotal),
      attentionItems: {
        ownersToPayCount,
        cashUnconfirmedCount,
        refundsPendingCount,
        totalAttentionCount: ownersToPayCount + cashUnconfirmedCount + refundsPendingCount,
      },
    };
  }

  // Bookings List (Filterable)
  async getBookings(tab?: string, search?: string) {
    const rawBookings = await this.prisma.booking.findMany({
      include: {
        farmhouse: {
          include: { owner: true },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = rawBookings.map((b: any) => {
      const totalAmount = Number(b.totalAmount || 0);
      const tokenPaid = Number(b.tokenPaid || 0);
      const isCancelled = b.status === 'CANCELLED';
      const commPct = Number(b.commissionPercentage ?? b.farmhouse?.defaultCommissionPercentage ?? 20.0);
      
      const staygridEarns = this.roundMoney((totalAmount * commPct) / 100);
      const ownerShare = this.roundMoney(totalAmount - staygridEarns);

      const isCashConfirmed = Boolean(b.cashPaymentConfirmedByOwner || b.cashPaymentConfirmedByUser);
      const ownerGot = isCashConfirmed ? Math.max(0, totalAmount - tokenPaid) : 0;
      const ownerRemaining = this.roundMoney(ownerShare - ownerGot);

      const policyRecommendedRefund = this.calculatePolicyRefund(b);
      const refundAmount = b.refundAmount !== null && b.refundAmount !== undefined ? Number(b.refundAmount) : policyRecommendedRefund;

      // Human Status Badge Determination
      let humanStatus = 'CLOSED';
      let guidedAction = 'VIEW_DETAILS';

      if (isCancelled) {
        if (b.refundStatus === 'PROCESSED' || refundAmount === 0) {
          humanStatus = 'CLOSED';
        } else {
          humanStatus = 'REFUND_NEEDED';
          guidedAction = 'REFUND_CUSTOMER';
        }
      } else if (!isCashConfirmed && totalAmount > tokenPaid) {
        humanStatus = 'WAITING_FOR_CASH';
        guidedAction = 'CONFIRM_CASH';
      } else if (b.ownerPayoutStatus === 'PAID') {
        humanStatus = 'CLOSED';
      } else if (ownerRemaining > 0) {
        humanStatus = 'READY_TO_PAY_OWNER';
        guidedAction = 'PAY_OWNER';
      } else if (ownerRemaining < 0) {
        humanStatus = 'OWNER_OWES_STAYGRID';
        guidedAction = 'RECORD_OWNER_PAYMENT';
      } else {
        humanStatus = 'CLOSED';
      }

      return {
        id: b.id,
        bookingRef: `#STAY-${b.id.substring(0, 8).toUpperCase()}`,
        status: b.status,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        totalAmount,
        staygridReceived: tokenPaid,
        isCashConfirmed,
        ownerGot: isCashConfirmed ? ownerGot : null,
        commissionPercentage: commPct,
        staygridEarns,
        ownerShare,
        ownerRemaining,
        ownerPayoutStatus: b.ownerPayoutStatus || 'PENDING',
        ownerPayoutTxnId: b.ownerPayoutTxnId,
        policyRecommendedRefund,
        refundAmount,
        isCustomRefundOverride: Boolean(b.isCustomRefundOverride),
        refundOverrideReason: b.refundOverrideReason,
        refundStatus: b.refundStatus || (isCancelled ? 'PENDING' : 'NONE'),
        refundTxnId: b.refundTxnId,
        humanStatus,
        guidedAction,
        user: {
          id: b.user?.id,
          name: b.user?.name || "Guest",
          phone: b.user?.phone || "No phone",
          email: b.user?.email,
        },
        farmhouse: {
          id: b.farmhouse?.id,
          title: b.farmhouse?.title || "StayGrid Farmhouse",
          city: b.farmhouse?.city || "Bhiwandi",
          owner: {
            id: b.farmhouse?.owner?.id,
            name: b.farmhouse?.owner?.name || "Host",
            phone: b.farmhouse?.owner?.phone || "No phone",
            email: b.farmhouse?.owner?.email,
          },
        },
      };
    });

    let result = mapped;

    if (tab === 'payouts') {
      result = result.filter((item) => item.humanStatus === 'READY_TO_PAY_OWNER' || item.humanStatus === 'OWNER_OWES_STAYGRID');
    } else if (tab === 'refunds') {
      result = result.filter((item) => item.status === 'CANCELLED');
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((item) => 
        item.bookingRef.toLowerCase().includes(q) ||
        item.farmhouse.title.toLowerCase().includes(q) ||
        item.farmhouse.owner.name.toLowerCase().includes(q) ||
        item.user.name.toLowerCase().includes(q) ||
        item.user.phone.toLowerCase().includes(q)
      );
    }

    return result;
  }

  // Booking Detail (Right-Side Drawer View)
  async getBookingDetail(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        farmhouse: { include: { owner: true } },
        user: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const transactions = await this.prisma.financialTransaction.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });

    const totalAmount = Number(booking.totalAmount || 0);
    const tokenPaid = Number(booking.tokenPaid || 0);
    const commPct = Number(booking.commissionPercentage ?? booking.farmhouse?.defaultCommissionPercentage ?? 20.0);
    const staygridEarns = this.roundMoney((totalAmount * commPct) / 100);
    const ownerShare = this.roundMoney(totalAmount - staygridEarns);

    const isCashConfirmed = Boolean(booking.cashPaymentConfirmedByOwner || booking.cashPaymentConfirmedByUser);
    const ownerGot = isCashConfirmed ? Math.max(0, totalAmount - tokenPaid) : 0;
    const ownerRemaining = this.roundMoney(ownerShare - ownerGot);

    return {
      booking: {
        id: booking.id,
        bookingRef: `#STAY-${booking.id.substring(0, 8).toUpperCase()}`,
        status: booking.status,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalAmount,
        tokenPaid,
        isCashConfirmed,
        ownerGot: isCashConfirmed ? ownerGot : null,
        commissionPercentage: commPct,
        staygridEarns,
        ownerShare,
        ownerRemaining,
        ownerPayoutStatus: booking.ownerPayoutStatus || 'PENDING',
        ownerPayoutTxnId: booking.ownerPayoutTxnId,
        user: booking.user,
        farmhouse: booking.farmhouse,
      },
      transactions,
    };
  }

  // Action 1: Confirm Cash Collection
  async confirmCash(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    // Idempotency check: Already confirmed
    if (booking.cashPaymentConfirmedByOwner) {
      return { message: 'Cash collection already confirmed', booking };
    }

    const total = Number(booking.totalAmount || 0);
    const token = Number(booking.tokenPaid || 0);
    const cashAmount = Math.max(0, total - token);

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        cashPaymentConfirmedByOwner: true,
        cashPaymentConfirmedByUser: true,
      },
    });

    // Log append-only audit trail
    await this.prisma.financialTransaction.create({
      data: {
        bookingId,
        type: 'OWNER_CASH_COLLECTION',
        amount: cashAmount,
        direction: 'INFLOW',
        fromEntity: 'CUSTOMER',
        toEntity: 'OWNER',
        notes: `Cash collection ₹${cashAmount} confirmed by Caretaker/Owner`,
      },
    });

    return updatedBooking;
  }

  // Action 2: Settle Owner Payout
  async settleOwnerPayout(bookingId: string, txnId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    // Idempotency check: Already paid
    if (booking.ownerPayoutStatus === 'PAID') {
      return { message: 'Owner payout already settled', booking };
    }

    const total = Number(booking.totalAmount || 0);
    const token = Number(booking.tokenPaid || 0);
    const commPct = Number(booking.commissionPercentage ?? 20.0);
    const staygridEarns = this.roundMoney((total * commPct) / 100);
    const ownerShare = this.roundMoney(total - staygridEarns);
    const isCashConfirmed = Boolean(booking.cashPaymentConfirmedByOwner || booking.cashPaymentConfirmedByUser);
    const ownerGot = isCashConfirmed ? Math.max(0, total - token) : 0;
    const ownerRemaining = this.roundMoney(ownerShare - ownerGot);

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        ownerPayoutStatus: 'PAID',
        ownerPayoutTxnId: txnId || `utr_${Date.now()}`,
        ownerPaidAt: new Date(),
        accountingStatus: 'BALANCED_CLOSED',
      },
    });

    await this.prisma.financialTransaction.create({
      data: {
        bookingId,
        type: 'OWNER_SETTLEMENT',
        amount: ownerRemaining,
        direction: 'OUTFLOW',
        fromEntity: 'STAYGRID',
        toEntity: 'OWNER',
        reference: txnId || `utr_${Date.now()}`,
        notes: `StayGrid settled owner payout ₹${ownerRemaining} via UTR ${txnId}`,
      },
    });

    return updatedBooking;
  }

  // Action 3: Record Owner Payment to StayGrid (When owner owes StayGrid)
  async recordOwnerPayment(bookingId: string, txnId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const total = Number(booking.totalAmount || 0);
    const commPct = Number(booking.commissionPercentage ?? 20.0);
    const staygridEarns = this.roundMoney((total * commPct) / 100);

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        ownerPayoutStatus: 'PAID',
        ownerPayoutTxnId: txnId || `pay_rec_${Date.now()}`,
        ownerPaidAt: new Date(),
        accountingStatus: 'BALANCED_CLOSED',
      },
    });

    await this.prisma.financialTransaction.create({
      data: {
        bookingId,
        type: 'OWNER_PAYMENT_RECEIVED',
        amount: staygridEarns,
        direction: 'INFLOW',
        fromEntity: 'OWNER',
        toEntity: 'STAYGRID',
        reference: txnId || `pay_rec_${Date.now()}`,
        notes: `Received owner commission payment ₹${staygridEarns} via Ref ${txnId}`,
      },
    });

    return updatedBooking;
  }

  // Action 4: Process Customer Refund
  async settleCustomerRefund(bookingId: string, refundAmount: number, isOverride: boolean, reason?: string, txnId?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    // Idempotency check: Already processed
    if (booking.refundStatus === 'PROCESSED') {
      return { message: 'Refund already processed', booking };
    }

    const amount = Number(refundAmount);

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        refundAmount: amount,
        isCustomRefundOverride: Boolean(isOverride),
        refundOverrideReason: reason || null,
        refundStatus: 'PROCESSED',
        refundTxnId: txnId || `rfnd_${Date.now()}`,
        accountingStatus: 'BALANCED_CLOSED',
      },
    });

    await this.prisma.financialTransaction.create({
      data: {
        bookingId,
        type: 'CUSTOMER_REFUND',
        amount,
        direction: 'OUTFLOW',
        fromEntity: 'STAYGRID',
        toEntity: 'CUSTOMER',
        reference: txnId || `rfnd_${Date.now()}`,
        reason: reason || 'Standard cancellation policy refund',
        notes: isOverride ? `Custom refund override ₹${amount}. Reason: ${reason}` : `Policy refund ₹${amount} processed`,
      },
    });

    return updatedBooking;
  }

  // Action 5: Change StayGrid Share / Commission
  async updateCommission(bookingId: string, commissionPercentage: number, reason?: string, notes?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const commPct = Number(commissionPercentage);
    if (isNaN(commPct) || commPct < 0 || commPct > 100) {
      throw new BadRequestException('Commission percentage must be between 0 and 100');
    }

    const totalAmount = Number(booking.totalAmount || 0);
    const oldCommPct = Number(booking.commissionPercentage ?? 20.0);
    const staygridNetCommission = this.roundMoney((totalAmount * commPct) / 100);
    const ownerShareAmount = this.roundMoney(totalAmount - staygridNetCommission);

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        commissionPercentage: commPct,
        staygridNetCommission,
        ownerShareAmount,
      },
    });

    // Write immutable audit trail
    await this.prisma.financialTransaction.create({
      data: {
        bookingId,
        type: 'COMMISSION_OVERRIDE',
        amount: staygridNetCommission,
        direction: 'ADJUSTMENT',
        fromEntity: 'STAYGRID',
        toEntity: 'STAYGRID',
        reason: reason || 'StayGrid share updated',
        notes: `StayGrid share changed from ${oldCommPct}% to ${commPct}%. Reason: ${reason || 'Agreement change'}. Notes: ${notes || 'N/A'}`,
      },
    });

    return updatedBooking;
  }

  // History Tab: Immutable Financial Audit Trail Logs
  async getHistory() {
    const logs = await this.prisma.financialTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return logs.map((log: any) => ({
      id: log.id,
      bookingId: log.bookingId,
      bookingRef: `#STAY-${log.bookingId.substring(0, 8).toUpperCase()}`,
      type: log.type,
      amount: Number(log.amount),
      direction: log.direction,
      fromEntity: log.fromEntity,
      toEntity: log.toEntity,
      reference: log.reference,
      reason: log.reason,
      notes: log.notes,
      createdAt: log.createdAt,
    }));
  }
}
