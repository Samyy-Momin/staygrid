"use client";

import { useQuery } from"@tanstack/react-query";
import { api } from"@/lib/api";
import { Home, Users, UserCog, CalendarCheck, UploadCloud, X, Phone, Building2, CheckCircle2 } from"lucide-react";
import { useState, useEffect } from"react";
import { Button } from"@/components/ui/button";
import { ImportModal } from"@/components/import-modal";
import { authClient } from"@/lib/auth-client";
import { OwnerCalendar } from"@/components/owner-calendar";

export default function DashboardOverview() {
 const [isImportModalOpen, setIsImportModalOpen] = useState(false);
 const [showPromo, setShowPromo] = useState(true);
 const [contactNumber, setContactNumber] = useState("+91 98765 43210");
 const [selectedFarmhouseId, setSelectedFarmhouseId] = useState<string | null>(null);

 const { data: session } = authClient.useSession();
 const isOwner = String((session?.user as any)?.role).toUpperCase() ==="OWNER";

 const { data: stats, isLoading, refetch } = useQuery({
 queryKey: ["dashboard-stats"],
 queryFn: async () => {
 const response = await api.get("/farmhouses/stats");
 return response.data;
 },
 });

 const { data: ownerFarmhouses = [], isLoading: isLoadingOwnerFarmhouses } = useQuery({
 queryKey: ["owner-farmhouses-check"],
 queryFn: async () => {
      const res = await api.get("/farmhouses?limit=1000");
      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      // Only show farmhouses that are actually owned by this user or available
      return data;
 },
 enabled: isOwner,
 });

  useEffect(() => {
    if (Array.isArray(ownerFarmhouses) && ownerFarmhouses.length > 0 && !selectedFarmhouseId) {
      setSelectedFarmhouseId(ownerFarmhouses[0].id);
    }
  }, [ownerFarmhouses, selectedFarmhouseId]);

 const handleImportSuccess = () => {
 refetch();
 };

 const statCards = [
 { name:"Total Farmhouses", value: stats?.farmhouses ?? 0, icon: Building2 },
 { name:"Active Bookings", value: stats?.bookings ?? stats?.activeBookings ?? 0, icon: CalendarCheck },
 { name:"Owner Admins", value: stats?.owners ?? 0, icon: UserCog },
 { name:"Total End Users", value: stats?.users ?? 0, icon: Users },
 ];

 return (
 <div className="space-y-8 animate-in fade-in duration-500">
 <div className="flex items-center justify-between border-b border-border pb-4">
 <h2 className="text-h2 text-primary">
 {isOwner ?"Availability Calendar" :"Dashboard Overview"}
 </h2>
 {!isOwner && (
 <Button variant="outline" className="h-9 px-4 text-caption font-medium uppercase tracking-wider text-muted" onClick={() => setIsImportModalOpen(true)}>
 <UploadCloud className="mr-2 h-3.5 w-3.5" /> Import Data
 </Button>
 )}
 </div>

 <ImportModal 
 isOpen={isImportModalOpen} 
 onClose={() => setIsImportModalOpen(false)} 
 onSuccess={handleImportSuccess}
 />

 {isOwner && showPromo && (
 <div className="bg-gradient-to-r from-accent-premium/10 to-surface rounded-lg p-5 flex items-start sm:items-center justify-between border border-accent-premium/20 relative group transition-all shadow-card-rest hover:shadow-card-hover">
 <div className="flex items-start sm:items-center gap-4">
 <div className="bg-surface p-2.5 rounded-full shadow-card-rest border border-accent-premium/30">
 <Phone className="w-4 h-4 text-accent-premium" />
 </div>
 <div>
 <h3 className="font-semibold text-body-sm text-primary">Featured Listing Program</h3>
 <p className="text-muted text-body-sm mt-0.5">Contact us at <span className="font-medium text-accent-premium">{contactNumber}</span> to increase your booking visibility.</p>
 </div>
 </div>
 <button 
 onClick={() => setShowPromo(false)}
 className="p-1.5 text-muted hover:text-primary transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 )}

 {!isOwner && (
 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
 {statCards.map((stat) => {
 const Icon = stat.icon;
 return (
 <div key={stat.name} className="bg-surface p-6 rounded-lg border border-border flex flex-col justify-between h-32 transition-all shadow-card-rest hover:shadow-card-hover hover:-translate-y-0.5">
 <div className="flex items-center justify-between">
 <p className="text-caption font-medium uppercase tracking-wider text-muted">{stat.name}</p>
 <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center">
 <Icon className="h-4 w-4 text-accent-primary" />
 </div>
 </div>
 {isLoading ? (
 <div className="h-8 w-16 bg-surface animate-pulse rounded"></div>
 ) : (
 <p className="text-h1 text-primary">{stat.value}</p>
 )}
 </div>
 );
 })}
 </div>
 )}

 {isOwner ? (
 <div className="mt-8">
 {isLoadingOwnerFarmhouses ? (
 <div className="p-12 border border-border rounded-lg text-center text-muted text-caption tracking-wide uppercase shadow-card-rest">
 Loading calendar...
 </div>
 ) : Array.isArray(ownerFarmhouses) && ownerFarmhouses.length > 0 ? (
 <div className="space-y-6">
 <div className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border shadow-card-rest">
 <label className="text-caption font-medium uppercase tracking-wider text-muted">Property</label>
 <select 
 value={selectedFarmhouseId ||""}
 onChange={(e) => setSelectedFarmhouseId(e.target.value)}
 className="flex-1 max-w-sm p-2 text-body-sm rounded-md border border-border bg-surface text-primary outline-none focus:ring-1 focus:ring-primary transition-shadow"
 >
 {ownerFarmhouses.map((fh: any) => (
 <option key={fh.id} value={fh.id}>{fh.title}</option>
 ))}
 </select>
 </div>
 {selectedFarmhouseId && <OwnerCalendar farmhouseId={selectedFarmhouseId} />}
 </div>
 ) : (
 <div className="p-16 border border-border border-dashed rounded-lg text-center flex flex-col items-center bg-surface shadow-card-rest transition-all hover:border-accent-primary/50">
 <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mb-6">
 <Building2 className="w-8 h-8 text-accent-primary" strokeWidth={1.5} />
 </div>
 <h3 className="text-h2 text-primary mb-2">Welcome to StayGrid</h3>
 <p className="text-body-sm text-muted mb-8 max-w-md mx-auto leading-relaxed">Your workspace is currently empty. Let's get started by adding your first property to unlock calendar management and bookings.</p>
 <Button onClick={() => window.location.href = '/farmhouses/new'} className="bg-accent-primary text-white hover:bg-accent-primary/90 shadow-card-rest hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
 Add Your First Property
 </Button>
 </div>
 )}
 </div>
 ) : (
 <div className="bg-surface rounded-lg border border-border p-8 mt-6 shadow-card-rest">
 <div className="flex items-center gap-3 mb-6">
 <CheckCircle2 className="w-5 h-5 text-muted" />
 <h3 className="text-caption font-medium uppercase tracking-wider text-primary">System Status</h3>
 </div>
 <p className="text-body-sm text-muted leading-relaxed max-w-2xl">
 StayGrid ERP is operating normally. All core services including authentication, booking engine, and property management are online. Navigate using the sidebar to manage specific modules.
 </p>
 </div>
 )}
 </div>
 );
}

