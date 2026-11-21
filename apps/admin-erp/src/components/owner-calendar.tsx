import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, X, CalendarIcon, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type OwnerCalendarProps = {
  farmhouseId: string;
};

const INDIAN_FESTIVALS: Record<string, string> = {
  "2026-01-01": "New Year",
  "2026-01-14": "Makar Sankranti",
  "2026-01-26": "Republic Day",
  "2026-03-04": "Holi",
  "2026-03-20": "Gudi Padwa",
  "2026-03-31": "Eid-ul-Fitr",
  "2026-08-15": "Independence Day",
  "2026-08-28": "Raksha Bandhan",
  "2026-09-04": "Ganesh Chaturthi",
  "2026-10-20": "Dussehra",
  "2026-11-08": "Diwali",
  "2026-12-25": "Christmas",
};

export function OwnerCalendar({ farmhouseId }: OwnerCalendarProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOwner = String((user as any)?.role).toUpperCase() === "OWNER";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [paintMode, setPaintMode] = useState<"booked" | "vacant">("booked");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pastDateErrorModal, setPastDateErrorModal] = useState<string | null>(null);
  
  // Quick Slot & Form State
  const [stayPreset, setStayPreset] = useState<'12H' | '24H' | 'CUSTOM'>('12H');
  const [timeSlot, setTimeSlot] = useState<string>("10:00 AM");
  const [customCheckOutDate, setCustomCheckOutDate] = useState<Date | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [reasonCategory, setReasonCategory] = useState("Direct offline booking");
  const [customReason, setCustomReason] = useState("");
  const [blockError, setBlockError] = useState("");
  const [cancelBlockedItem, setCancelBlockedItem] = useState<any>(null);
  
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["owner-bookings", farmhouseId],
    queryFn: async () => {
      const res = await api.get("/bookings");
      return res.data.filter((b: any) => b.farmhouseId === farmhouseId);
    }
  });

  const { data: blockedDates = [], isLoading: blocksLoading } = useQuery({
    queryKey: ["blocked-dates", farmhouseId],
    queryFn: async () => {
      const res = await api.get(`/farmhouses/${farmhouseId}/blocked-dates`);
      return res.data;
    }
  });

  const blockMutation = useMutation({
    mutationFn: async ({ startDate, endDate, note }: { startDate: string; endDate: string; note: string }) => {
      await api.post(`/farmhouses/${farmhouseId}/blocked-dates`, {
        startDate,
        endDate,
        note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-dates", farmhouseId] });
      queryClient.invalidateQueries({ queryKey: ["owner-bookings", farmhouseId] });
      setSelectedDate(null);
      setGuestName("");
      setCustomReason("");
      setBlockError("");
    },
    onError: (err: any) => {
      setBlockError(err.response?.data?.message || "⚠️ This property is already booked for the selected dates.");
    }
  });

  const unblockMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/farmhouses/blocked-dates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-dates", farmhouseId] });
      queryClient.invalidateQueries({ queryKey: ["owner-bookings", farmhouseId] });
      setSelectedDate(null);
    }
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayEvents = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const events: { status: string; data: any }[] = [];

    bookings.forEach((b: any) => {
      const checkInStr = b.checkIn.substring(0, 10);
      const checkOutStr = b.checkOut.substring(0, 10);
      if (dayStr >= checkInStr && dayStr <= checkOutStr) {
        events.push({ status: b.status === "CANCELLED" ? "cancelled" : "booked", data: b });
      }
    });

    blockedDates.forEach((b: any) => {
      const startStr = b.startDate.substring(0, 10);
      const endStr = b.endDate.substring(0, 10);
      if (dayStr >= startStr && dayStr <= endStr) {
        events.push({ status: "blocked", data: b });
      }
    });

    return events;
  };

  const [unblockReason, setUnblockReason] = useState("");

  if (bookingsLoading || blocksLoading) {
    return <div className="animate-pulse bg-surface dark:bg-surface h-96 rounded-xl w-full"></div>;
  }

  const handleCellClick = (day: Date) => {
    const events = getDayEvents(day);
    const blockedEvent = events.find(e => e.status === "blocked");
    const bookedEvent = events.find(e => e.status === "booked");

    // Check if clicked date is in the past
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const cellStart = new Date(day);
    cellStart.setHours(0, 0, 0, 0);

    const isPastDate = cellStart < todayStart;

    // If date has an offline block, show offline booking details modal directly
    if (blockedEvent) {
      setCancelBlockedItem(blockedEvent.data);
      setUnblockReason("");
      return;
    }

    // If date has an online booking, navigate to booking details
    if (bookedEvent) {
      if (bookedEvent.data?.id) {
        router.push(`/bookings/${bookedEvent.data.id}`);
      }
      return;
    }

    // RESTRICTION: Owner Admins cannot block past dates (System Admin only)
    if (paintMode === "booked" && isPastDate && isOwner) {
      setPastDateErrorModal("Owner Admin accounts cannot mark booked or block dates in the past. Only System Admins can modify past dates.");
      return;
    }

    // Only open "Mark Date as Booked" creation modal if date is currently vacant
    if (paintMode === "booked") {
      setSelectedDate(day);
      setCustomCheckOutDate(addDays(day, 1));
      setGuestName("");
      setCustomReason("");
      setBlockError("");
    }
  };

  const handleBlockConfirm = () => {
    if (!selectedDate || !guestName.trim()) return;

    let inDate = new Date(selectedDate);
    let outDate = new Date(selectedDate);

    const isNightSlot = timeSlot === "10:00 PM";
    const startHour = isNightSlot ? 22 : 10;

    inDate.setHours(startHour, 0, 0, 0);

    if (stayPreset === '12H') {
      outDate = new Date(inDate.getTime() + 11 * 60 * 60 * 1000);
    } else if (stayPreset === '24H') {
      outDate = new Date(inDate.getTime() + 23 * 60 * 60 * 1000);
    } else {
      if (customCheckOutDate) {
        outDate = new Date(customCheckOutDate);
        outDate.setHours(10, 0, 0, 0);
      } else {
        outDate = new Date(inDate.getTime() + 23 * 60 * 60 * 1000);
      }
    }

    const creatorName = user?.name || "Host";
    const selectedReason = reasonCategory === "Other" && customReason.trim() ? customReason.trim() : reasonCategory;
    const structuredNote = `Guest: ${guestName.trim()} | Reason: ${selectedReason} | CreatedBy: ${creatorName}`;

    blockMutation.mutate({
      startDate: inDate.toISOString(),
      endDate: outDate.toISOString(),
      note: structuredNote,
    });
  };

  // Helper parser for stored structured note
  const parseBlockedNote = (noteStr: string = "") => {
    const guestMatch = noteStr.match(/Guest:\s*([^|]+)/i);
    const reasonMatch = noteStr.match(/Reason:\s*([^|]+)/i);
    const createdByMatch = noteStr.match(/CreatedBy:\s*([^|]+)/i);

    return {
      guestName: guestMatch ? guestMatch[1].trim() : (noteStr || "Offline Guest"),
      reason: reasonMatch ? reasonMatch[1].trim() : "Direct offline booking",
      createdBy: createdByMatch ? createdByMatch[1].trim() : (user?.name || "Owner Admin"),
    };
  };

  return (
    <>
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-card-rest">
        {/* Color-Coded Legend Bar */}
        <div className="px-4 py-3 bg-surface border-b border-border flex flex-wrap items-center gap-4 text-xs font-semibold text-muted">
          <span className="font-bold text-primary mr-1">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block shadow-sm"></span>
            <span>Offline Booking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500 inline-block shadow-sm"></span>
            <span>App Booking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm"></span>
            <span>Holiday / Festival</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-700 dark:bg-slate-300 inline-block shadow-sm"></span>
            <span>Blocked / Maintenance</span>
          </div>
        </div>

        <div className="p-4 border-b border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-primary">
            {format(currentDate, "MMMM yyyy")}
          </h3>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-surface p-1 rounded-lg border border-border">
              <button
                onClick={() => setPaintMode("booked")}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  paintMode === "booked" 
                    ? "bg-rose-600 text-white shadow-sm" 
                    : "text-muted hover:text-primary"
                }`}
              >
                Mark Booked
              </button>
              <button
                onClick={() => setPaintMode("vacant")}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  paintMode === "vacant" 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : "text-muted hover:text-primary"
                }`}
              >
                Mark Vacant
              </button>
            </div>

            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-0 sm:p-2">
          <div className="grid grid-cols-7 border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center py-2 text-xs font-bold text-muted uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-l border-t border-border">
            {days.map((day: Date, idx: number) => {
              const events = getDayEvents(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const hasBookedOrBlocked = events.length > 0;
              const dateStr = format(day, "yyyy-MM-dd");
              const festival = INDIAN_FESTIVALS[dateStr];
              
              let bgClass = !hasBookedOrBlocked 
                ? "bg-emerald-500/5 hover:bg-emerald-500/15" 
                : "bg-surface hover:bg-accent-primary/5";
              
              if (!isCurrentMonth) bgClass += " opacity-40";

              return (
                <div
                  key={idx}
                  onClick={() => handleCellClick(day)}
                  className={`min-h-[110px] border-r border-b border-border p-2 transition-colors relative flex flex-col justify-between cursor-pointer ${bgClass} ${(blockMutation.isPending || unblockMutation.isPending) ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className={`text-xl font-bold ${isSameDay(day, new Date()) ? 'text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full ring-2 ring-accent-primary/30' : 'text-primary'}`}>
                        {format(day, "d")}
                      </span>
                    </div>

                    {/* Events list with High-Contrast Badges */}
                    <div className="space-y-1 mt-1.5">
                      {events.map((event, eventIdx) => {
                        const { status, data } = event;
                        const isCheckOutDay = status === "booked" && data.checkOut.substring(0, 10) === dateStr;
                        
                        if (status === "booked") {
                          return (
                            <div 
                              key={eventIdx} 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (data?.id) router.push(`/bookings/${data.id}`);
                              }}
                              className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] p-1.5 rounded-md font-bold leading-tight truncate cursor-pointer shadow-sm border border-sky-700 flex items-center gap-1"
                              title="App Booking - Click to view details"
                            >
                              <span>📱</span> {isCheckOutDay ? `Out: ${format(new Date(data.checkOut), "hh:mm a")}` : `In: ${format(new Date(data.checkIn), "hh:mm a")}`} - {data.user?.name || "Customer"}
                            </div>
                          );
                        }
                        if (status === "cancelled") {
                          return (
                            <div key={eventIdx} className="bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] p-1 rounded font-semibold leading-tight truncate line-through border border-amber-500/30">
                              Cancelled
                            </div>
                          );
                        }
                        if (status === "blocked") {
                          const parsed = parseBlockedNote(data?.note);
                          return (
                            <div 
                              key={eventIdx} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancelBlockedItem(data);
                                setUnblockReason("");
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] p-1.5 rounded-md font-bold leading-tight truncate cursor-pointer shadow-sm border border-rose-700 flex items-center gap-1"
                              title="Offline Booking - Click to view details & mark vacant"
                            >
                              <span>🔒</span> {parsed.guestName}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* Full-width Festival Badge at bottom */}
                    {festival && (
                      <div className="mt-2">
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded block text-center truncate border border-amber-500/30" title={festival}>
                          🎉 {festival}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Offline Booking / Block Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md border border-border overflow-hidden space-y-4">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
              <div>
                <h3 className="text-lg font-extrabold text-primary">Mark Date as Booked / Blocked</h3>
                <p className="text-xs text-muted font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="text-muted hover:text-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {blockError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{blockError}</span>
                </div>
              )}

              {/* Step 1: Select Stay Type */}
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">1. Booking Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStayPreset('12H')}
                    className={`py-2.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      stayPreset === '12H' ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border text-primary hover:bg-surface hover:border-accent-primary'
                    }`}
                  >
                    12 Hours Stay
                  </button>
                  <button
                    type="button"
                    onClick={() => setStayPreset('24H')}
                    className={`py-2.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      stayPreset === '24H' ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border text-primary hover:bg-surface hover:border-accent-primary'
                    }`}
                  >
                    24 Hours Stay
                  </button>
                  <button
                    type="button"
                    onClick={() => setStayPreset('CUSTOM')}
                    className={`py-2.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      stayPreset === 'CUSTOM' ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border text-primary hover:bg-surface hover:border-accent-primary'
                    }`}
                  >
                    Custom Dates
                  </button>
                </div>
              </div>

              {/* Step 2: Select Check-In Time Slot */}
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">2. Check-In Time Slot</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTimeSlot("10:00 AM")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      timeSlot === "10:00 AM" ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border text-primary hover:border-accent-primary'
                    }`}
                  >
                    <span>Morning Slot</span>
                    <span className="font-bold">10:00 AM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeSlot("10:00 PM")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      timeSlot === "10:00 PM" ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border text-primary hover:border-accent-primary'
                    }`}
                  >
                    <span>Night Slot</span>
                    <span className="font-bold">10:00 PM</span>
                  </button>
                </div>
              </div>

              {/* Custom Date Picker with Auto-Close Popover */}
              {stayPreset === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Check-out Date</label>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-semibold">
                        <CalendarIcon className="mr-2 h-4 w-4 text-accent-primary" />
                        {customCheckOutDate ? format(customCheckOutDate, "PPP") : "Pick Check-out Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[60]" align="start">
                      <Calendar
                        mode="single"
                        selected={customCheckOutDate || undefined}
                        onSelect={(d) => {
                          setCustomCheckOutDate(d || null);
                          setPopoverOpen(false); // Auto-close popover calendar upon date pick
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Step 3: Structured Guest Name & Reason */}
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Guest Name (Required)
                </label>
                <Input 
                  placeholder="Enter guest name (e.g. Rahul Sharma)" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="font-medium text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Booking Reason
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Direct offline booking">Direct offline booking</option>
                  <option value="Personal / Host use">Personal / Host use</option>
                  <option value="Property Maintenance">Property Maintenance</option>
                  <option value="Cash Booking">Cash Booking</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {reasonCategory === "Other" && (
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Custom Reason Detail
                  </label>
                  <Input
                    placeholder="Describe custom reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="font-medium text-xs"
                  />
                </div>
              )}

              <Button 
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 text-xs rounded-xl shadow-md mt-2"
                onClick={handleBlockConfirm}
                disabled={blockMutation.isPending || !guestName.trim()}
              >
                {blockMutation.isPending ? "Saving..." : "Confirm & Block Date"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Booking Details & Cancellation Reason Modal */}
      {cancelBlockedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md border border-border p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-[Inter_800ExtraBold] text-primary flex items-center gap-2">
                🔒 Offline Booking Details
              </h3>
              <button onClick={() => setCancelBlockedItem(null)} className="p-1 rounded-full hover:bg-border/40">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {/* Offline Booking Info Card */}
            {(() => {
              const parsed = parseBlockedNote(cancelBlockedItem.note);
              const bookingIdShort = `#BLK-${cancelBlockedItem.id?.substring(0, 8).toUpperCase()}`;

              return (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{bookingIdShort}</span>
                    <span className="bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                      🔒 Offline / Owner Created
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-primary font-medium">
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-bold">Guest Name</span>
                      <span className="font-extrabold text-sm">{parsed.guestName}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-bold">Created By</span>
                      <span className="font-bold">{parsed.createdBy}</span>
                    </div>
                  </div>

                  <div className="text-primary font-medium">
                    <span className="text-muted block text-[10px] uppercase font-bold">Reason</span>
                    <span className="font-semibold">{parsed.reason}</span>
                  </div>

                  <div className="text-muted space-y-0.5 pt-1 border-t border-rose-500/20">
                    <div>• <strong>Check-In:</strong> {new Date(cancelBlockedItem.startDate).toLocaleString('en-GB')}</div>
                    <div>• <strong>Check-Out:</strong> {new Date(cancelBlockedItem.endDate).toLocaleString('en-GB')}</div>
                  </div>
                </div>
              );
            })()}

            {/* Stronger Warning & Cancellation Prompt */}
            <div className="space-y-2">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-semibold text-amber-800 dark:text-amber-300">
                ⚠️ <strong>Cancel Offline Booking?</strong> This will make the selected dates available for new bookings on the mobile app instantly.
              </div>

              <label className="block text-xs font-bold text-muted uppercase tracking-wider pt-1">
                Cancellation Reason / Comment (Required to Mark Vacant)
              </label>
              <Input
                placeholder="e.g. Guest requested cancellation of cash booking"
                value={unblockReason}
                onChange={(e) => setUnblockReason(e.target.value)}
                className="font-medium text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setCancelBlockedItem(null)} className="font-bold text-xs">
                Keep Booked
              </Button>
              <Button
                variant="destructive"
                disabled={!unblockReason.trim() || unblockMutation.isPending}
                className="font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md"
                onClick={() => {
                  if (cancelBlockedItem.id) {
                    unblockMutation.mutate(cancelBlockedItem.id);
                    setCancelBlockedItem(null);
                    setUnblockReason("");
                  }
                }}
              >
                {unblockMutation.isPending ? "Cancelling..." : "Cancel Booking & Make Available"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Past Date Restriction Warning Modal for Owner Admins */}
      {pastDateErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md border border-border p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-primary">
              Past Date Booking Restricted
            </h3>
            <p className="text-xs text-muted font-medium leading-relaxed">
              {pastDateErrorModal}
            </p>
            <Button
              className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white font-bold text-xs shadow-md"
              onClick={() => setPastDateErrorModal(null)}
            >
              Understood
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
