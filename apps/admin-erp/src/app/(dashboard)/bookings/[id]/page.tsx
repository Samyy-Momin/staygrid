"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, User, Phone, Mail, Calendar, DollarSign, Clock, ShieldAlert, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ["booking-detail", bookingId],
    queryFn: async () => {
      const res = await api.get(`/bookings/${bookingId}`);
      return res.data;
    },
  });

  const confirmCashMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/bookings/${bookingId}/confirm-cash-owner`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-detail", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  if (isLoading) {
    return <div className="min-h-[400px] flex items-center justify-center text-muted font-medium">Loading booking details...</div>;
  }

  if (isError || !booking) {
    return (
      <div className="p-8 text-center">
        <p className="text-danger font-semibold mb-4">Booking record not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const pendingAmount = Math.max(0, (booking.totalAmount || 0) - (booking.tokenPaid || 0));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Booking Details</h1>
            <p className="text-xs text-muted font-mono">ID: {booking.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            booking.status === 'CONFIRMED' ? 'bg-success/20 text-success' : 
            booking.status === 'CANCELLED' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
          }`}>
            {booking.status}
          </span>
        </div>
      </div>

      {/* Main Boarding Pass Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card-rest space-y-6">
        {/* Farmhouse Details Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">{booking.farmhouse?.title || "Farmhouse Stay"}</h2>
              <p className="text-xs text-muted">{booking.farmhouse?.city || "Bhiwandi"}, Maharashtra</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Booking Type</p>
            <p className="text-sm font-bold text-accent-primary">
              {booking.stayType || "24H Full Stay"}
            </p>
          </div>
        </div>

        {/* Guest & Contact Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface/50 p-4 rounded-xl border border-border/40">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Guest Information</p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <User className="w-4 h-4 text-accent-primary" />
              <span>{booking.user?.name || "StayGrid Guest"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <Phone className="w-4 h-4 text-accent-primary" />
              <a href={`tel:${booking.user?.phone}`} className="hover:underline text-accent-primary">{booking.user?.phone || "+91 99999 99999"}</a>
            </div>
            {booking.user?.email && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Mail className="w-4 h-4" />
                <span>{booking.user.email}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Stay Dates & Schedule</p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <Calendar className="w-4 h-4 text-accent-primary" />
              <span>Check-in: <b>{format(checkInDate, "dd MMM yyyy, hh:mm a")}</b></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <Clock className="w-4 h-4 text-accent-primary" />
              <span>Check-out: <b>{format(checkOutDate, "dd MMM yyyy, hh:mm a")}</b></span>
            </div>
            <p className="text-xs text-muted">Guests: {booking.adults || 1} Adults, {booking.children || 0} Children</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="border border-border/60 rounded-xl p-4 bg-surface space-y-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Payment Breakdown</p>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Total Reservation Amount:</span>
            <span className="font-bold text-primary text-base">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Token Paid Online:</span>
            <span className="font-bold text-success text-base">₹{booking.tokenPaid?.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center text-sm pt-2 border-t border-border/40">
            <span className="font-semibold text-primary">Pending Balance (Collect at Check-in):</span>
            <span className="font-extrabold text-danger text-lg">₹{pendingAmount.toLocaleString('en-IN')}</span>
          </div>

          {/* Cash Payment Confirmation Status */}
          <div className="mt-3 p-3 bg-accent-primary/5 rounded-lg border border-accent-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-accent-primary" />
              <span className="text-xs font-medium text-primary">
                Owner Cash Status: {booking.cashPaymentConfirmedByOwner ? "Confirmed Paid" : "Pending Confirmation"}
              </span>
            </div>
            {!booking.cashPaymentConfirmedByOwner && (
              <Button 
                size="sm" 
                className="bg-success hover:bg-success/90 text-white font-bold text-xs"
                onClick={() => confirmCashMutation.mutate()}
                disabled={confirmCashMutation.isPending}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {confirmCashMutation.isPending ? "Confirming..." : "Confirm Cash Received"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
