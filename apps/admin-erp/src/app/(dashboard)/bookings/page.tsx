"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Search, XCircle, Calendar as CalendarIcon, List, Eye, CalendarDays, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

type Booking = {
  id: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  totalAmount: number;
  tokenPaid: number;
  notes?: string;
  status: string;
  cashPaymentConfirmedByOwner?: boolean;
  cashPaymentConfirmedByUser?: boolean;
  paymentMethod?: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  farmhouse: {
    title: string;
    owner?: {
      name: string;
    };
  };
  createdAt: string;
};

const CustomCalendarToolbar = (toolbar: any) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToCurrent = () => toolbar.onNavigate('TODAY');

  const viewNames = [
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
    { key: 'day', label: 'Day' },
    { key: 'agenda', label: 'Agenda' },
  ];

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 bg-surface p-3 rounded-2xl border border-border shadow-sm">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={goToCurrent} className="text-xs font-bold bg-surface">
          Today
        </Button>
        <Button variant="ghost" size="sm" onClick={goToBack} className="text-xs font-medium">
          ← Prev
        </Button>
        <Button variant="ghost" size="sm" onClick={goToNext} className="text-xs font-medium">
          Next →
        </Button>
      </div>

      <span className="text-base font-extrabold text-primary tracking-tight">
        {toolbar.label}
      </span>

      <div className="flex items-center bg-surface p-1 rounded-xl border border-border">
        {viewNames.map((v) => (
          <Button
            key={v.key}
            variant={toolbar.view === v.key ? "default" : "ghost"}
            size="sm"
            onClick={() => toolbar.onView(v.key)}
            className={`text-xs capitalize font-bold px-3 py-1 ${toolbar.view === v.key ? "bg-accent-primary text-white shadow-sm" : "text-muted"}`}
          >
            {v.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [confirmingCashId, setConfirmingCashId] = useState<string | null>(null);

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [cancelTargetBooking, setCancelTargetBooking] = useState<Booking | null>(null);
  const [confirmCashTargetBooking, setConfirmCashTargetBooking] = useState<Booking | null>(null);

  const [rearrangeBooking, setRearrangeBooking] = useState<Booking | null>(null);
  const [newCheckIn, setNewCheckIn] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");
  const [rearrangeError, setRearrangeError] = useState("");

  const fetchBookings = () => {
    setLoading(true);
    api.get("/bookings")
      .then(res => setBookings(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/bookings/${id}/cancel`);
    },
    onSuccess: () => {
      fetchBookings();
    }
  });

  const handleConfirmCash = async (bookingId: string) => {
    setConfirmingCashId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/confirm-cash`);
      fetchBookings();
    } catch {
      alert("Failed to confirm cash payment");
    } finally {
      setConfirmingCashId(null);
    }
  };

  const handleRearrangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rearrangeBooking || !newCheckIn || !newCheckOut) return;
    setRearrangeError("");
    try {
      await api.patch(`/bookings/${rearrangeBooking.id}/rearrange`, {
        checkIn: new Date(newCheckIn).toISOString(),
        checkOut: new Date(newCheckOut).toISOString(),
      });
      setRearrangeBooking(null);
      fetchBookings();
    } catch (err: any) {
      console.error(err);
      setRearrangeError(err.response?.data?.message || "Failed to rearrange dates");
    }
  };

  const getBookingTypeLabel = (checkInStr: string, checkOutStr: string) => {
    const inDate = new Date(checkInStr);
    const outDate = new Date(checkOutStr);
    const diffMs = outDate.getTime() - inDate.getTime();
    const diffHours = diffMs / (1000 * 3600);
    if (diffHours <= 14) return "12H Day Stay";
    if (diffHours <= 26) return "24H Full Stay";
    return `${Math.round(diffHours / 24)} Nights Custom`;
  };

  const filteredBookings = bookings.filter(b => 
    (b.user?.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (b.user?.phone || "").toLowerCase().includes(search.toLowerCase()) || 
    (b.farmhouse?.title || "").toLowerCase().includes(search.toLowerCase()) ||
    b.id.toLowerCase().includes(search.toLowerCase())
  );

  const calendarEvents = filteredBookings.map(b => ({
    id: b.id,
    title: `${b.farmhouse?.title || "Farmhouse"} • ${b.user?.name || "Customer"} (${b.status})`,
    start: new Date(b.checkIn),
    end: new Date(b.checkOut),
    resource: b,
  }));

  const eventPropGetter = (event: any) => {
    const booking = event.resource as Booking;
    let backgroundColor = "#10b981"; // Emerald
    if (booking?.status === "PENDING_PAYMENT" || booking?.status === "SAVED") {
      backgroundColor = "#f59e0b"; // Amber
    } else if (booking?.status === "CANCELLED") {
      backgroundColor = "#ef4444"; // Rose
    }
    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        opacity: booking?.status === "CANCELLED" ? 0.6 : 1,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "11px",
        fontWeight: "700",
        padding: "3px 8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Bookings</h2>
          <p className="text-sm text-muted mt-1">Manage all customer bookings, notes, and token transactions.</p>
        </div>
        <div className="flex items-center bg-surface dark:bg-surface p-1 rounded-md">
          <Button 
            variant={viewMode === 'table' ? "outline" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? "bg-surface dark:bg-surface shadow-sm" : ""}
          >
            <List className="w-4 h-4 mr-2" /> Table
          </Button>
          <Button 
            variant={viewMode === 'calendar' ? "outline" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode('calendar')}
            className={viewMode === 'calendar' ? "bg-surface dark:bg-surface shadow-sm" : ""}
          >
            <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
          </Button>
        </div>
      </div>
      
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input 
            placeholder="Search customer, phone, farmhouse, or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface"
          />
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="px-4 py-4 text-xs font-bold text-muted uppercase tracking-wider">ID</th>
                  <th className="px-4 py-4 text-xs font-bold text-muted uppercase tracking-wider">Customer Name</th>
                  <th className="px-4 py-4 text-xs font-bold text-muted uppercase tracking-wider">Phone Number</th>
                  <th className="px-4 py-4 text-xs font-bold text-muted uppercase tracking-wider">Booking Type</th>
                  <th className="px-4 py-4 text-xs font-bold text-muted uppercase tracking-wider">Farmhouse & Owner</th>
                  <th className="px-4 py-4 text-xs font-bold text-muted uppercase tracking-wider">Dates (In / Out)</th>
                  <th className="px-4 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Amounts (₹)</th>
                  <th className="px-4 py-4 text-xs font-bold text-muted uppercase tracking-wider">Status / Cash</th>
                  <th className="px-4 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted">Loading bookings...</td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted">No bookings found.</td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => {
                    const pendingAmount = Math.max(0, b.totalAmount - (b.tokenPaid || 0));
                    return (
                      <tr key={b.id} className="hover:bg-accent-primary/5 transition-colors group">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-muted">{b.id.substring(0, 8).toUpperCase()}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-primary">{b.user?.name || "Customer"}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-muted font-mono">{b.user?.phone || "N/A"}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-primary/10 text-accent-primary">
                            {getBookingTypeLabel(b.checkIn, b.checkOut)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="font-medium text-primary">{b.farmhouse?.title || "Farmhouse"}</div>
                          <div className="text-muted text-xs">Owner: {b.farmhouse?.owner?.name || "Property Host"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-muted">
                          <div>In: {new Date(b.checkIn).toLocaleDateString("en-GB")} {new Date(b.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div>Out: {new Date(b.checkOut).toLocaleDateString("en-GB")} {new Date(b.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                          <div className="text-primary font-medium">Total: ₹{b.totalAmount?.toLocaleString('en-IN')}</div>
                          <div className="text-success text-xs font-medium">Token Paid: ₹{b.tokenPaid?.toLocaleString('en-IN')}</div>
                          <div className="text-danger text-xs font-medium">Pending: ₹{pendingAmount.toLocaleString('en-IN')}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm space-y-1">
                          <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded text-white ${
                            b.status === 'CONFIRMED' ? 'bg-success' : 
                            b.status === 'CANCELLED' ? 'bg-danger' :
                            b.status === 'SAVED' ? 'bg-accent-primary' : 'bg-warning'
                          }`}>
                            {b.status}
                          </span>
                          
                          {/* Cash Payment Confirmation Badge / Button */}
                          {b.status === 'CONFIRMED' && pendingAmount > 0 && (
                            <div>
                              {b.cashPaymentConfirmedByOwner ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded border border-success/30">
                                  <CheckCircle className="w-3 h-3" /> Cash Verified
                                </span>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-6 text-[10px] px-2 text-warning border-warning/40 hover:bg-warning/10"
                                  disabled={confirmingCashId === b.id}
                                  onClick={() => setConfirmCashTargetBooking(b)}
                                >
                                  {confirmingCashId === b.id ? "Confirming..." : "Confirm Cash Recd"}
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Details Button */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted hover:text-accent-primary hover:bg-accent-primary/10 h-8 w-8"
                              onClick={() => {
                                setSelectedBooking(b);
                                setShowDetailModal(true);
                              }}
                              title="View Full Booking Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* Rearrange Date Button */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted hover:text-accent-primary hover:bg-accent-primary/10 h-8 w-8"
                              onClick={() => {
                                setRearrangeBooking(b);
                                setNewCheckIn(b.checkIn.substring(0, 16));
                                setNewCheckOut(b.checkOut.substring(0, 16));
                              }}
                              title="Rearrange Booking Dates"
                            >
                              <CalendarDays className="w-4 h-4" />
                            </Button>

                            {/* Cancel Button */}
                            {b.status !== 'CANCELLED' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-muted hover:text-danger hover:bg-danger/10 h-8 w-8"
                                onClick={() => setCancelTargetBooking(b)}
                                disabled={cancelMutation.isPending}
                                title="Cancel Booking"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-[600px] text-sm">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
            />
          </div>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-surface rounded-xl p-6 max-w-lg w-full shadow-2xl border border-border space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-bold text-primary">Booking Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>✕</Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Booking ID:</span>
                <span className="font-mono font-bold text-primary">{selectedBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Customer Name:</span>
                <span className="font-bold text-primary">{selectedBooking.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Customer Phone:</span>
                <span className="font-mono text-primary">{selectedBooking.user?.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Customer Email:</span>
                <span className="text-primary">{selectedBooking.user?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted">Farmhouse Stay:</span>
                <span className="font-bold text-primary">{selectedBooking.farmhouse?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Guests Breakdown:</span>
                <span className="font-bold text-primary">{selectedBooking.adults || 1} Adults, {selectedBooking.children || 0} Children</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Check-in:</span>
                <span className="font-bold text-primary">{new Date(selectedBooking.checkIn).toLocaleString("en-GB")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Check-out:</span>
                <span className="font-bold text-primary">{new Date(selectedBooking.checkOut).toLocaleString("en-GB")}</span>
              </div>

              {/* Cash Payment Status */}
              <div className="bg-surface p-3 rounded-lg border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-muted uppercase block">Cash Payment Verification</span>
                  <span className="text-xs text-primary font-medium">
                    Owner: {selectedBooking.cashPaymentConfirmedByOwner ? "Confirmed" : "Pending"} | User: {selectedBooking.cashPaymentConfirmedByUser ? "Confirmed" : "Pending"}
                  </span>
                </div>
                {!selectedBooking.cashPaymentConfirmedByOwner && (
                  <Button 
                    size="sm" 
                    className="bg-success text-white text-xs"
                    disabled={confirmingCashId === selectedBooking.id}
                    onClick={() => handleConfirmCash(selectedBooking.id)}
                  >
                    Confirm Recd
                  </Button>
                )}
              </div>

              {/* Host / Admin Notes */}
              <div className="bg-accent-primary/5 p-3 rounded-lg border border-accent-primary/20 mt-2">
                <div className="text-xs font-bold text-accent-primary uppercase mb-1">Additional Note for Host / Admin</div>
                <div className="text-sm text-primary italic">
                  {selectedBooking.notes ? `"${selectedBooking.notes}"` : "No special notes provided by customer."}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-surface p-3 rounded-lg border border-border space-y-1">
                <div className="flex justify-between font-bold text-primary">
                  <span>Total Amount:</span>
                  <span>₹{selectedBooking.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-success font-bold text-xs">
                  <span>Token Paid:</span>
                  <span>₹{selectedBooking.tokenPaid?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold text-xs pt-1 border-t border-border">
                  <span>Pending Balance:</span>
                  <span>₹{Math.max(0, selectedBooking.totalAmount - (selectedBooking.tokenPaid || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button onClick={() => setShowDetailModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* REARRANGE DATES MODAL */}
      {rearrangeBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleRearrangeSubmit} className="bg-surface rounded-xl p-6 max-w-md w-full shadow-2xl border border-border space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-bold text-primary">Rearrange Booking Dates</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRearrangeBooking(null)}>✕</Button>
            </div>

            {rearrangeError && (
              <div className="text-sm font-bold text-danger bg-danger/10 p-3 rounded-md">{rearrangeError}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted uppercase block mb-1">New Check-in Date & Time</label>
                <Input 
                  type="datetime-local" 
                  value={newCheckIn} 
                  onChange={(e) => setNewCheckIn(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase block mb-1">New Check-out Date & Time</label>
                <Input 
                  type="datetime-local" 
                  value={newCheckOut} 
                  onChange={(e) => setNewCheckOut(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setRearrangeBooking(null)}>Cancel</Button>
              <Button type="submit" className="bg-accent-primary">Save New Dates</Button>
            </div>
          </form>
        </div>
      )}

      {/* CANCEL BOOKING CONFIRMATION MODAL */}
      {cancelTargetBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-[Inter_800ExtraBold] text-rose-600 flex items-center gap-2">
                🛑 Confirm Booking Cancellation
              </h3>
              <button onClick={() => setCancelTargetBooking(null)} className="text-muted hover:text-primary p-1">✕</button>
            </div>

            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2 text-sm">
              <p className="font-bold text-primary">
                Are you sure you want to cancel booking <span className="font-mono text-rose-600">#{cancelTargetBooking.id.substring(0, 8).toUpperCase()}</span>?
              </p>
              <div className="text-xs text-muted space-y-1">
                <div>• <strong>Customer:</strong> {cancelTargetBooking.user?.name} ({cancelTargetBooking.user?.phone})</div>
                <div>• <strong>Farmhouse:</strong> {cancelTargetBooking.farmhouse?.title}</div>
                <div>• <strong>Dates:</strong> {new Date(cancelTargetBooking.checkIn).toLocaleDateString()} — {new Date(cancelTargetBooking.checkOut).toLocaleDateString()}</div>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed font-medium">
              Cancelling will update status to <strong className="text-rose-600">CANCELLED</strong> and immediately free up these dates on the mobile availability calendar.
            </p>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setCancelTargetBooking(null)} className="text-xs font-bold">
                Keep Booking
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  cancelMutation.mutate(cancelTargetBooking.id);
                  setCancelTargetBooking(null);
                }}
                disabled={cancelMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel Booking"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CASH PAYMENT MODAL */}
      {confirmCashTargetBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-[Inter_800ExtraBold] text-emerald-600 flex items-center gap-2">
                💵 Confirm Cash Received
              </h3>
              <button onClick={() => setConfirmCashTargetBooking(null)} className="text-muted hover:text-primary p-1">✕</button>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2 text-sm">
              <p className="font-bold text-primary">
                Confirm receipt of cash payment for <span className="font-mono text-emerald-600">#{confirmCashTargetBooking.id.substring(0, 8).toUpperCase()}</span>?
              </p>
              <div className="text-xs text-muted space-y-1">
                <div>• <strong>Customer:</strong> {confirmCashTargetBooking.user?.name}</div>
                <div>• <strong>Pending Cash:</strong> <strong className="text-emerald-600 text-sm">₹{Math.max(0, confirmCashTargetBooking.totalAmount - (confirmCashTargetBooking.tokenPaid || 0)).toLocaleString('en-IN')}</strong></div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setConfirmCashTargetBooking(null)} className="text-xs font-bold">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  handleConfirmCash(confirmCashTargetBooking.id);
                  setConfirmCashTargetBooking(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                Yes, Confirm Payment Received
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
