"use client";

import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import { api } from"@/lib/api";
import { DataTable } from"@/components/ui/data-table";
import { ColumnDef } from"@tanstack/react-table";
import { Button } from"@/components/ui/button";
import { Plus, Eye, Edit, Power, PowerOff, CalendarDays, Search, Trash, Star, StarOff, ShieldAlert, DollarSign } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type Farmhouse = {
 id: string;
 title: string;
 city?: string;
 streetAddress?: string;
 price12Hours: number;
 capacity: number;
 isActive: boolean;
 isFeatured?: boolean;
 isBestMatch?: boolean;
 isTrusted?: boolean;
 owner?: { name: string };
};

export default function FarmhousesPage() {
 const queryClient = useQueryClient();
 const [search, setSearch] = useState("");
 const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);
 const [statusFilter, setStatusFilter] = useState("ALL");
 const [deleteTargetFarmhouse, setDeleteTargetFarmhouse] = useState<Farmhouse | null>(null);
 const [activeBookingsForDelete, setActiveBookingsForDelete] = useState<number | null>(null);
 const [checkingBookings, setCheckingBookings] = useState(false);

 const openDeleteModal = async (farmhouse: Farmhouse) => {
   setDeleteTargetFarmhouse(farmhouse);
   setCheckingBookings(true);
   setActiveBookingsForDelete(null);
   try {
     const res = await api.get("/bookings");
     const list = Array.isArray(res.data) ? res.data : [];
     const now = new Date();
     const count = list.filter((b: any) => {
       if (b.farmhouseId !== farmhouse.id) return false;
       if (b.status === "CANCELLED") return false;
       const checkOut = new Date(b.checkOut);
       return checkOut >= now;
     }).length;
     setActiveBookingsForDelete(count);
   } catch {
     setActiveBookingsForDelete(0);
   } finally {
     setCheckingBookings(false);
   }
 };

 const { data: session } = authClient.useSession();
 const isOwner = String((session?.user as any)?.role).toUpperCase() ==="OWNER";

 const { data: farmhouses, isLoading } = useQuery({
 queryKey: ["farmhouses"],
 queryFn: async () => {
 const response = await api.get("/farmhouses?limit=1000");
 return Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
 }
 });

 const toggleStatusMutation = useMutation({
 mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
 return api.patch(`/farmhouses/${id}/status`, { isActive });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["farmhouses"] });
 }
 });

 const toggleFeaturedMutation = useMutation({
 mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
 return api.patch(`/farmhouses/${id}`, { isFeatured });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["farmhouses"] });
 }
 });

 const toggleBestMatchMutation = useMutation({
 mutationFn: async ({ id, isBestMatch }: { id: string; isBestMatch: boolean }) => {
 return api.patch(`/farmhouses/${id}`, { isBestMatch });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["farmhouses"] });
 }
 });

 const toggleTrustedMutation = useMutation({
 mutationFn: async ({ id, isTrusted }: { id: string; isTrusted: boolean }) => {
 return api.patch(`/farmhouses/${id}`, { isTrusted });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["farmhouses"] });
 }
 });

 const deleteMutation = useMutation({
 mutationFn: async (id: string) => {
 return api.delete(`/farmhouses/${id}`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["farmhouses"] });
 }
 });

 const filteredFarmhouses = farmhouses?.filter((f: Farmhouse) => {
 const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase()) || 
 f.capacity.toString().includes(search);
 const matchesStatus = statusFilter ==="ALL" 
 ? true 
 : statusFilter ==="ACTIVE" 
 ? f.isActive 
 : !f.isActive;
 return matchesSearch && matchesStatus;
 }) || [];

 const columns: ColumnDef<Farmhouse>[] = [
 {
 accessorKey:"title",
 header:"Title",
 cell: ({ row }) => <div className="font-medium text-primary">{row.getValue("title")}</div>,
 },
 {
 id:"ownerName",
 header:"Owner",
 cell: ({ row }) => <div className="text-muted">{row.original.owner?.name ||"N/A"}</div>,
 },
 {
 id:"location",
 header:"Location",
 cell: ({ row }) => (
 <div className="text-muted text-sm">
 {row.original.city ||"Unknown Location"}
 </div>
 )
 },
 {
 accessorKey:"price12Hours",
 header:"Price/12Hr",
 cell: ({ row }) =>`₹${new Intl.NumberFormat('en-IN').format(Number(row.getValue("price12Hours")))}`,
 },
 {
 accessorKey:"capacity",
 header:"Capacity",
 cell: ({ row }) =>`${row.getValue("capacity")} Guests`,
 },
 {
 accessorKey:"isActive",
 header:"Status",
 cell: ({ row }) => (
 row.original.isActive ? (
 <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-caption font-medium bg-success text-surface">
 Active
 </span>
 ) : (
 <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-caption font-medium bg-danger text-surface">
 Inactive
 </span>
 )
 ),
 },
 {
 accessorKey:"isFeatured",
 header:"Featured",
 cell: ({ row }) => (
 row.original.isFeatured ? (
 <span className="inline-flex items-center text-accent-premium font-medium text-caption">
 <Star className="w-4 h-4 mr-1 fill-accent-premium" /> Yes
 </span>
 ) : (
 <span className="text-muted text-caption">No</span>
 )
 ),
 },
 {
 id:"actions",
 header:"Actions",
 cell: ({ row }) => {
 const farmhouse = row.original;
 return (
 <div className="flex items-center gap-2">
 <Link href={`/farmhouses/${farmhouse.id}`}>
 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors">
 <Eye className="w-4 h-4" />
 </Button>
 </Link>
        {isOwner ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
            onClick={() => setIsRestrictionModalOpen(true)}
            title="Edit Farmhouse"
          >
            <Edit className="w-4 h-4" />
          </Button>
        ) : (
          <Link href={`/farmhouses/${farmhouse.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
        )}
 {!isOwner && (
 <>
 <Button 
 variant="ghost" size="icon"
 className={`h-8 w-8 transition-colors ${farmhouse.isActive ?'text-muted hover:text-danger hover:bg-danger/10' :'text-muted hover:text-success hover:bg-success/10'}`}
 onClick={() => toggleStatusMutation.mutate({ id: farmhouse.id, isActive: !farmhouse.isActive })}
 title={farmhouse.isActive ?"Deactivate" :"Activate"}
 >
 {farmhouse.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
 </Button>
 <Button
  variant="ghost" size="icon"
  className="h-8 w-8 transition-colors text-muted hover:text-danger hover:bg-danger/10"
  onClick={() => openDeleteModal(farmhouse)}
  title="Delete Farmhouse"
  >
  <Trash className="w-4 h-4" />
  </Button>
 <Button
 variant="ghost" size="icon"
 className={`h-8 w-8 transition-colors ${farmhouse.isFeatured ?'text-accent-premium hover:text-accent-premium/80 hover:bg-accent-premium/10' :'text-muted hover:text-accent-premium hover:bg-accent-premium/10'}`}
 onClick={() => toggleFeaturedMutation.mutate({ id: farmhouse.id, isFeatured: !farmhouse.isFeatured })}
 title={farmhouse.isFeatured ?"Remove from Featured" :"Mark as Featured"}
 >
 {farmhouse.isFeatured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
 </Button>
 <Button
 variant="ghost" size="icon"
 className={`h-8 w-8 transition-colors ${farmhouse.isBestMatch ?'text-accent-premium hover:text-accent-premium hover:bg-accent-premium/10' :'text-muted hover:text-accent-premium hover:bg-accent-premium/10'}`}
 onClick={() => toggleBestMatchMutation.mutate({ id: farmhouse.id, isBestMatch: !farmhouse.isBestMatch })}
 title={farmhouse.isBestMatch ?"Remove Best Match" :"Mark as Best Match"}
 >
 {farmhouse.isBestMatch ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
 </Button>
 <Button
 variant="ghost" size="icon"
 className={`h-8 w-8 transition-colors ${farmhouse.isTrusted ?'text-accent-primary hover:text-accent-primary/80 hover:bg-accent-primary/10' :'text-muted hover:text-accent-primary hover:bg-accent-primary/10'}`}
 onClick={() => toggleTrustedMutation.mutate({ id: farmhouse.id, isTrusted: !farmhouse.isTrusted })}
 title={farmhouse.isTrusted ?"Remove Trusted" :"Mark as Trusted"}
 >
 {farmhouse.isTrusted ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
 </Button>
 </>
 )}
  <Link href={`/farmhouses/${farmhouse.id}/pricing`}>
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
      title="Weekend & Custom Pricing"
    >
      <DollarSign className="w-4 h-4 text-accent-primary" />
    </Button>
  </Link>
 <Link href={`/bookings/new?farmhouseId=${farmhouse.id}`}>
 <Button variant="outline" size="sm" className="h-8 border-border text-primary hover:bg-accent-primary/5 hover:text-accent-primary ml-2 shadow-card-rest transition-colors">
 <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> Book
 </Button>
 </Link>
 </div>
 );
 }
 }
 ];

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-h2 text-primary">Farmhouses</h2>
 <p className="text-body-sm text-muted mt-1">Manage property listings, pricing, and availability.</p>
 </div>
 <div className="flex gap-2">
  <Link href="/pricing">
    <Button variant="outline" className="font-bold">
      <DollarSign className="w-4 h-4 mr-2 text-accent-primary" /> Pricing Rules
    </Button>
  </Link>
 {!isOwner && (
 <Link href="/farmhouses/new">
 <Button>
 <Plus className="mr-2 h-4 w-4" /> Add Farmhouse
 </Button>
 </Link>
 )}
 </div>
 </div>

 <div className="bg-surface p-6 rounded-lg shadow-card-rest border border-border space-y-6">
 <div className="flex items-center gap-4">
 <div className="relative w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
 <Input 
 placeholder="Search title or capacity..." 
 className="pl-9"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 </div>
 <select 
 className="h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 >
 <option value="ALL">All Status</option>
 <option value="ACTIVE">Active Only</option>
 <option value="INACTIVE">Inactive Only</option>
 </select>
 </div>

 {isLoading ? (
 <div className="animate-pulse p-4">Loading farmhouses...</div>
 ) : (
 <DataTable columns={columns} data={filteredFarmhouses} />
 )}
 </div>

  {/* Delete & Archive Safeguard Modal */}
  {deleteTargetFarmhouse && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-lg font-[Inter_800ExtraBold] text-primary flex items-center gap-2">
            ⚠️ Delete / Archive Safeguard
          </h3>
          <button onClick={() => setDeleteTargetFarmhouse(null)} className="text-muted hover:text-primary p-1">✕</button>
        </div>

        {checkingBookings ? (
          <div className="py-8 text-center text-xs font-bold text-muted">
            Checking active bookings for "{deleteTargetFarmhouse.title}"...
          </div>
        ) : activeBookingsForDelete && activeBookingsForDelete > 0 ? (
          <div className="space-y-4">
            {/* Red Alert Banner */}
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Deletion Blocked — Active Bookings Found
              </div>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300 leading-relaxed">
                This farmhouse has <strong>{activeBookingsForDelete} upcoming booking(s)</strong>.
              </p>
              <p className="text-xs text-rose-600/90 font-medium">
                You cannot delete it until these bookings are resolved.
              </p>
            </div>

            {/* Archiving Option Notice */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                💡 Archiving Alternative:
              </span>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Archiving will prevent new bookings, but existing {activeBookingsForDelete} booking(s) will remain active.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setDeleteTargetFarmhouse(null)} className="text-xs font-bold">
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  toggleStatusMutation.mutate({ id: deleteTargetFarmhouse.id, isActive: false });
                  setDeleteTargetFarmhouse(null);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                Archive (Deactivate Stays)
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-primary">
              Are you sure you want to permanently delete <strong>"{deleteTargetFarmhouse.title}"</strong>?
            </p>
            <p className="text-xs text-muted font-medium">
              This farmhouse has no active upcoming bookings. This action is deliberate and permanent.
            </p>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setDeleteTargetFarmhouse(null)} className="text-xs font-bold">
                Keep Farmhouse
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  deleteMutation.mutate(deleteTargetFarmhouse.id);
                  setDeleteTargetFarmhouse(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Yes, Delete Farmhouse
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )}

  {/* Owner Edit Restriction Modal */}
  {isRestrictionModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-warning/20 text-warning flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-extrabold text-primary">Farmhouse Edit Restricted</h3>
        <p className="text-xs text-muted leading-relaxed">
          Please contact the System Admin to update details or photos for this farmhouse listing. Self-editing is disabled for owner accounts to maintain data integrity and optimize server performance.
        </p>
        <Button className="w-full bg-accent-primary text-white font-bold py-2.5" onClick={() => setIsRestrictionModalOpen(false)}>
          Got it, thanks
        </Button>
      </div>
    </div>
  )}
  </div>
  );
}
