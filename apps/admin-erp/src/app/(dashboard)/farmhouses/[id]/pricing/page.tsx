"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar as CalendarIcon, Plus, Trash, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format, addMonths, subMonths } from "date-fns";

export default function FarmhousePricingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [farmhouse, setFarmhouse] = useState<any>(null);
  const [overrides, setOverrides] = useState<any[]>([]);

  // Bulk Weekend State
  const [weekend12H, setWeekend12H] = useState("");
  const [weekend24H, setWeekend24H] = useState("");
  const [savingWeekend, setSavingWeekend] = useState(false);

  // Single Date Override State
  const [singleDate, setSingleDate] = useState("");
  const [single12H, setSingle12H] = useState("");
  const [single24H, setSingle24H] = useState("");
  const [singleLabel, setSingleLabel] = useState("");
  const [singleType, setSingleType] = useState<"FESTIVAL" | "CUSTOM">("FESTIVAL");
  const [savingSingle, setSavingSingle] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    if (id) {
      api.get(`/farmhouses/${id}`)
        .then((res) => {
          setFarmhouse(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  const loadOverrides = () => {
    if (id) {
      api.get(`/pricing/${id}?month=${currentMonth}`)
        .then((res) => setOverrides(Array.isArray(res.data) ? res.data : []))
        .catch(console.error);
    }
  };

  useEffect(() => {
    loadOverrides();
  }, [id, currentMonth]);

  const handleApplyWeekendPricing = async () => {
    if (!weekend12H && !weekend24H) {
      alert("Please enter at least one weekend price");
      return;
    }
    setSavingWeekend(true);
    try {
      const today = new Date();
      const startDate = format(today, "yyyy-MM-dd");
      const endDate = format(addMonths(today, 6), "yyyy-MM-dd");

      await api.post("/pricing/weekend", {
        farmhouseId: id,
        startDate,
        endDate,
        price12Hours: weekend12H ? Number(weekend12H.replace(/,/g, "")) : undefined,
        price24Hours: weekend24H ? Number(weekend24H.replace(/,/g, "")) : undefined,
      });

      alert("Weekend pricing applied successfully for the next 6 months!");
      loadOverrides();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to set weekend pricing");
    } finally {
      setSavingWeekend(false);
    }
  };

  const handleAddSingleOverride = async () => {
    if (!singleDate) {
      alert("Please select a date");
      return;
    }
    setSavingSingle(true);
    try {
      await api.post("/pricing/override", {
        farmhouseId: id,
        date: singleDate,
        price12Hours: single12H ? Number(single12H.replace(/,/g, "")) : undefined,
        price24Hours: single24H ? Number(single24H.replace(/,/g, "")) : undefined,
        label: singleLabel.trim() || undefined,
        type: singleType,
      });

      setSingleDate("");
      setSingle12H("");
      setSingle24H("");
      setSingleLabel("");
      loadOverrides();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to set date pricing");
    } finally {
      setSavingSingle(false);
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    try {
      await api.delete(`/pricing/override/${overrideId}`);
      setOverrides(overrides.filter(o => o.id !== overrideId));
    } catch {
      alert("Failed to delete pricing override");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-muted">Loading pricing details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-2">
        <Link href={`/farmhouses/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Farmhouse
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Custom & Weekend Pricing</h2>
          <p className="text-xs text-muted">{farmhouse?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bulk Weekend Pricing */}
        <div className="bg-surface p-6 rounded-xl border border-border space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-primary border-b border-border pb-2">Saturday & Sunday Pricing</h3>
          <p className="text-xs text-muted">Set special pricing that automatically applies to all Saturdays and Sundays for the next 6 months.</p>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Weekend 12-Hour Price (₹)</label>
            <Input 
              value={weekend12H} 
              onChange={(e) => setWeekend12H(e.target.value.replace(/\D/g, ""))} 
              placeholder={`Default: ₹${farmhouse?.price12Hours?.toLocaleString("en-IN") || "0"}`} 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Weekend 24-Hour Price (₹)</label>
            <Input 
              value={weekend24H} 
              onChange={(e) => setWeekend24H(e.target.value.replace(/\D/g, ""))} 
              placeholder={`Default: ₹${farmhouse?.price24Hours?.toLocaleString("en-IN") || "0"}`} 
            />
          </div>

          <Button 
            className="w-full bg-accent-primary text-white font-bold" 
            onClick={handleApplyWeekendPricing} 
            disabled={savingWeekend}
          >
            {savingWeekend ? "Applying..." : "Apply Weekend Pricing"}
          </Button>
        </div>

        {/* Single Date / Festival Override */}
        <div className="bg-surface p-6 rounded-xl border border-border space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-primary border-b border-border pb-2">Festival & Custom Date Pricing</h3>
          <p className="text-xs text-muted">Set custom pricing for a specific date (e.g., Diwali, New Year's Eve).</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">Date</label>
              <Input type="date" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">Event Label</label>
              <Input value={singleLabel} onChange={(e) => setSingleLabel(e.target.value)} placeholder="e.g. Diwali Night" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">12-Hour Price (₹)</label>
              <Input value={single12H} onChange={(e) => setSingle12H(e.target.value.replace(/\D/g, ""))} placeholder="₹" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">24-Hour Price (₹)</label>
              <Input value={single24H} onChange={(e) => setSingle24H(e.target.value.replace(/\D/g, ""))} placeholder="₹" />
            </div>
          </div>

          <Button 
            className="w-full bg-success text-white font-bold" 
            onClick={handleAddSingleOverride} 
            disabled={savingSingle || !singleDate}
          >
            {savingSingle ? "Saving..." : "Save Date Pricing"}
          </Button>
        </div>
      </div>

      {/* Active Overrides List */}
      <div className="bg-surface p-6 rounded-xl border border-border space-y-4 shadow-sm mt-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-lg font-bold text-primary">Active Price Overrides ({overrides.length})</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted">Month:</span>
            <Input 
              type="month" 
              value={currentMonth} 
              onChange={(e) => setCurrentMonth(e.target.value)} 
              className="h-8 w-40 text-xs"
            />
          </div>
        </div>

        {overrides.length === 0 ? (
          <div className="p-8 text-center text-muted border-2 border-dashed border-border rounded-lg">
            No price overrides found for this month. Default pricing will be applied.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {overrides.map((ov) => (
              <div key={ov.id} className="p-3 border border-border rounded-lg bg-surface flex justify-between items-center shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-primary">{format(new Date(ov.date), "MMM d, yyyy")}</span>
                    {ov.label && (
                      <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded font-bold">{ov.label}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted mt-1 space-x-2">
                    {ov.price12Hours && <span>12H: ₹{ov.price12Hours.toLocaleString("en-IN")}</span>}
                    {ov.price24Hours && <span>24H: ₹{ov.price24Hours.toLocaleString("en-IN")}</span>}
                  </div>
                </div>

                <button 
                  onClick={() => handleDeleteOverride(ov.id)} 
                  className="text-danger hover:text-danger/80 p-1" 
                  title="Remove override"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
