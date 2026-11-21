"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { DollarSign, Calendar as CalendarIcon, Save, Plus, Trash2, Tag, Percent, Sparkles, AlertTriangle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { validateFarmhousePrices, parsePrice } from "@/lib/price-validator";

export default function PricingRulesPage() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const isOwner = String((session?.user as any)?.role).toUpperCase() === "OWNER";

  const [selectedFarmhouseId, setSelectedFarmhouseId] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [price12H, setPrice12H] = useState<string>("");
  const [price24H, setPrice24H] = useState<string>("");
  const [label, setLabel] = useState<string>("");
  const [ruleType, setRuleType] = useState<string>("CUSTOM");

  // Weekend Pricing State
  const [weekendPrice12H, setWeekendPrice12H] = useState<string>("");
  const [weekendPrice24H, setWeekendPrice24H] = useState<string>("");
  const [savingWeekend, setSavingWeekend] = useState(false);

  // Fetch farmhouses
  const { data: farmhouses = [] } = useQuery({
    queryKey: ["pricing-farmhouses"],
    queryFn: async () => {
      const res = await api.get("/farmhouses?limit=100");
      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      if (data.length > 0 && !selectedFarmhouseId) {
        setSelectedFarmhouseId(data[0].id);
      }
      return data;
    },
  });

  const activeFarmhouse = farmhouses.find((f: any) => f.id === selectedFarmhouseId);

  // Fetch pricing overrides for selected farmhouse
  const { data: pricingOverrides = [], isLoading: loadingOverrides } = useQuery({
    queryKey: ["pricing-overrides", selectedFarmhouseId],
    queryFn: async () => {
      if (!selectedFarmhouseId) return [];
      const res = await api.get(`/farmhouses/${selectedFarmhouseId}/pricing-overrides`);
      return res.data;
    },
    enabled: !!selectedFarmhouseId,
  });

  // Fetch cancelled bookings for discount pricing opportunities
  const { data: cancelledBookings = [] } = useQuery({
    queryKey: ["cancelled-bookings-pricing", selectedFarmhouseId],
    queryFn: async () => {
      if (!selectedFarmhouseId) return [];
      const res = await api.get("/bookings");
      return res.data.filter((b: any) => b.farmhouseId === selectedFarmhouseId && b.status === "CANCELLED");
    },
    enabled: !!selectedFarmhouseId,
  });

  // Mutation for saving price override
  const saveOverrideMutation = useMutation({
    mutationFn: async () => {
      const check12H = price12H ? price12H : activeFarmhouse?.price12Hours;
      const check24H = price24H ? price24H : activeFarmhouse?.price24Hours;

      const priceCheck = validateFarmhousePrices(check12H, check24H);
      if (!priceCheck.isValid) {
        alert(priceCheck.error);
        throw new Error(priceCheck.error);
      }

      await api.post(`/farmhouses/${selectedFarmhouseId}/pricing-overrides`, {
        date: targetDate,
        price12Hours: price12H ? priceCheck.price12Hours : undefined,
        price24Hours: price24H ? priceCheck.price24Hours : undefined,
        label: label || (ruleType === "DISCOUNT" ? "Cancellation Discount" : "Special Rate"),
        type: ruleType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-overrides", selectedFarmhouseId] });
      setPrice12H("");
      setPrice24H("");
      setLabel("");
    },
    onError: (err: any) => {
      if (err?.message) alert(err.message);
    }
  });

  // Mutation for deleting price override
  const deleteOverrideMutation = useMutation({
    mutationFn: async (overrideId: string) => {
      await api.delete(`/farmhouses/pricing-overrides/${overrideId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-overrides", selectedFarmhouseId] });
    },
  });

  const handleSaveWeekendRates = async () => {
    if (!selectedFarmhouseId) return;

    const check12H = weekendPrice12H ? weekendPrice12H : activeFarmhouse?.price12Hours;
    const check24H = weekendPrice24H ? weekendPrice24H : activeFarmhouse?.price24Hours;

    const priceCheck = validateFarmhousePrices(check12H, check24H);
    if (!priceCheck.isValid) {
      alert(priceCheck.error);
      return;
    }

    setSavingWeekend(true);
    try {
      await api.patch(`/farmhouses/${selectedFarmhouseId}`, {
        weekendPrice12Hours: weekendPrice12H ? priceCheck.price12Hours : undefined,
        weekendPrice24Hours: weekendPrice24H ? priceCheck.price24Hours : undefined,
      });
      alert("Weekend rates saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["pricing-farmhouses"] });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save weekend rates");
    } finally {
      setSavingWeekend(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-accent-primary" />
            Weekend & Dynamic Pricing Rules
          </h1>
          <p className="text-xs text-muted mt-1">Configure default weekend rates, festival pricing, and cancelled date discounts.</p>
        </div>
        
        {farmhouses.length > 0 && (
          <select 
            value={selectedFarmhouseId}
            onChange={(e) => setSelectedFarmhouseId(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-surface text-primary font-bold text-sm"
          >
            {farmhouses.map((f: any) => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))}
          </select>
        )}
      </div>

      {activeFarmhouse && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-accent-primary/10 p-5 rounded-2xl border border-accent-primary/20">
          <div>
            <span className="text-xs font-bold text-muted uppercase">Base Weekday 12H Price</span>
            <p className="text-xl font-extrabold text-accent-primary">₹{activeFarmhouse.price12Hours?.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-muted uppercase">Base Weekday 24H Price</span>
            <p className="text-xl font-extrabold text-accent-primary">₹{activeFarmhouse.price24Hours?.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* DEDICATED WEEKEND PRICING CARD */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card-rest space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-bold text-primary">Default Weekend Pricing (Sat & Sun)</h2>
          </div>
          <span className="text-xs text-muted font-medium bg-accent-primary/10 text-accent-primary px-3 py-1 rounded-full">Global Weekend Rule</span>
        </div>
        <p className="text-xs text-muted">Set standard weekend rates for Saturdays and Sundays across all weeks. This applies automatically unless a specific date override is configured.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Weekend 12H Price (₹)</label>
            <Input 
              type="number" 
              placeholder={`Current: ₹${activeFarmhouse?.weekendPrice12Hours || activeFarmhouse?.price12Hours || 0}`}
              value={weekendPrice12H} 
              onChange={(e) => setWeekendPrice12H(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Weekend 24H Price (₹)</label>
            <Input 
              type="number" 
              placeholder={`Current: ₹${activeFarmhouse?.weekendPrice24Hours || activeFarmhouse?.price24Hours || 0}`}
              value={weekendPrice24H} 
              onChange={(e) => setWeekendPrice24H(e.target.value)} 
            />
          </div>
        </div>

        <Button 
          onClick={handleSaveWeekendRates} 
          disabled={savingWeekend || !selectedFarmhouseId}
          className="bg-accent-primary text-white font-bold px-6"
        >
          <Save className="w-4 h-4 mr-2" />
          {savingWeekend ? "Saving..." : "Save Weekend Rates"}
        </Button>
      </div>

      {/* SPECIAL DATE OVERRIDE INPUT CARD (SHADCN CALENDAR) */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card-rest space-y-5">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <Tag className="w-5 h-5 text-accent-primary" />
          Set Specific Date Price Override (Festival / Discount / Surge)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Target Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-semibold border-border bg-surface text-primary">
                  <CalendarIcon className="mr-2 h-4 w-4 text-accent-primary" />
                  {targetDate ? format(new Date(targetDate), "dd MMM yyyy") : "Pick Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-surface border border-border" align="start">
                <Calendar
                  mode="single"
                  selected={targetDate ? new Date(targetDate) : undefined}
                  onSelect={(d) => d && setTargetDate(format(d, "yyyy-MM-dd"))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Rule Type</label>
            <select 
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-primary text-sm font-medium cursor-pointer"
            >
              <option value="FESTIVAL">Festival Special</option>
              <option value="DISCOUNT">Cancelled Date Discount</option>
              <option value="CUSTOM">Custom Surge / Rate</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">12H Override Price (₹)</label>
            <Input 
              type="number" 
              placeholder="e.g. 8000" 
              value={price12H} 
              onChange={(e) => setPrice12H(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">24H Override Price (₹)</label>
            <Input 
              type="number" 
              placeholder="e.g. 15000" 
              value={price24H} 
              onChange={(e) => setPrice24H(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Input 
            placeholder="Label / Reason (e.g. Independence Day Special / Holiday Surge)" 
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 font-medium"
          />
          <Button 
            onClick={() => saveOverrideMutation.mutate()} 
            disabled={saveOverrideMutation.isPending || !selectedFarmhouseId}
            className="bg-accent-primary text-white font-bold px-6"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveOverrideMutation.isPending ? "Saving..." : "Save Date Rule"}
          </Button>
        </div>
      </div>

      {/* Cancelled Bookings Discount Opportunities */}
      {cancelledBookings.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="text-base font-bold text-primary">Cancelled Date Discount Opportunities</h3>
          </div>
          <p className="text-xs text-muted">Set special discounted prices for dates with cancelled bookings to fill vacancies quickly with strikethrough prices on the mobile app.</p>
          
          <div className="space-y-2">
            {cancelledBookings.map((b: any) => {
              const checkInStr = b.checkIn.substring(0, 10);
              return (
                <div key={b.id} className="flex items-center justify-between bg-surface p-3 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-bold text-primary">Cancelled Date: {format(new Date(b.checkIn), "dd MMM yyyy")}</p>
                    <p className="text-xs text-muted">Original Booking Token: ₹{b.tokenPaid?.toLocaleString('en-IN')}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-warning text-warning hover:bg-warning/10 font-bold"
                    onClick={() => {
                      setTargetDate(checkInStr);
                      setRuleType("DISCOUNT");
                      setLabel("Last-Minute Cancellation Discount");
                    }}
                  >
                    Apply Discount Rate
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Overrides Table */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card-rest space-y-4">
        <h3 className="text-lg font-bold text-primary">Active Specific Date Overrides ({pricingOverrides.length})</h3>
        
        {loadingOverrides ? (
          <p className="text-xs text-muted">Loading pricing overrides...</p>
        ) : pricingOverrides.length === 0 ? (
          <p className="text-xs text-muted">No custom date pricing overrides configured for this farmhouse.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Label</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">12H Price</th>
                  <th className="py-2 px-3">24H Price</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {pricingOverrides.map((ov: any) => (
                  <tr key={ov.id} className="hover:bg-surface/50">
                    <td className="py-3 px-3 font-bold text-primary">{format(new Date(ov.date), "dd MMM yyyy")}</td>
                    <td className="py-3 px-3 text-muted">{ov.label || "-"}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ov.type === 'DISCOUNT' ? 'bg-success/20 text-success' : 'bg-accent-primary/20 text-accent-primary'
                      }`}>
                        {ov.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-accent-primary">₹{ov.price12Hours?.toLocaleString('en-IN') || "-"}</td>
                    <td className="py-3 px-3 font-bold text-accent-primary">₹{ov.price24Hours?.toLocaleString('en-IN') || "-"}</td>
                    <td className="py-3 px-3 text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-danger hover:bg-danger/10"
                        onClick={() => deleteOverrideMutation.mutate(ov.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
