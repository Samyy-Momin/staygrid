"use client";

import { useState } from"react";
import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import { Plus, Edit, Trash, Power, PowerOff } from"lucide-react";
import { api } from"@/lib/api";
import { ImageUpload } from"@/components/ui/image-upload";
import { X } from"lucide-react";
import { Button } from"@/components/ui/button";
import { DataTable } from"@/components/ui/data-table";
import { ColumnDef } from"@tanstack/react-table";

type HeroBanner = {
 id: string;
 heading: string;
 subheading?: string;
 buttonText?: string;
 imageUrl: string;
 isActive: boolean;
 order: number;
};

export default function HeroBannersPage() {
 const queryClient = useQueryClient();
 const [isAddingBanner, setIsAddingBanner] = useState(false);
 const [newBanner, setNewBanner] = useState<Partial<HeroBanner>>({
 heading:"",
 subheading:"",
 buttonText:"",
 imageUrl:"",
 order: 0,
 isActive: true
 });

 const { data: heroBanners = [], isLoading } = useQuery({
 queryKey: ["hero-banners"],
 queryFn: async () => {
 const res = await api.get("/hero-banners");
 return res.data;
 }
 });

 const createMutation = useMutation({
 mutationFn: async (data: Partial<HeroBanner>) => {
 return api.post("/hero-banners", data);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["hero-banners"] });
 setIsAddingBanner(false);
 setNewBanner({ heading:"", subheading:"", buttonText:"", imageUrl:"", order: 0, isActive: true });
 }
 });

 const toggleStatusMutation = useMutation({
 mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
 return api.patch(`/hero-banners/${id}`, { isActive });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["hero-banners"] });
 }
 });

 const deleteMutation = useMutation({
 mutationFn: async (id: string) => {
 return api.delete(`/hero-banners/${id}`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["hero-banners"] });
 }
 });

 const columns: ColumnDef<HeroBanner>[] = [
 {
 accessorKey:"imageUrl",
 header:"Image",
 cell: ({ row }) => (
 <div className="w-24 aspect-video rounded-md overflow-hidden bg-surface flex items-center justify-center border border-border shadow-card-rest">
 {row.original.imageUrl ? (
 <img src={row.original.imageUrl} alt={row.original.heading} className="w-full h-full object-cover" />
 ) : (
 <span className="text-[10px] text-muted font-medium">None</span>
 )}
 </div>
 )
 },
 {
 accessorKey:"heading",
 header:"Heading",
 cell: ({ row }) => <div className="font-medium">{row.original.heading}</div>
 },
 {
 accessorKey:"subheading",
 header:"Subheading"
 },
 {
 accessorKey:"isActive",
 header:"Status",
 cell: ({ row }) => (
 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
 row.original.isActive ? 'bg-success/10 text-success' : 'bg-surface border border-border text-muted'
 }`}>
 {row.original.isActive ? 'Active' : 'Inactive'}
 </span>
 )
 },
 {
 id:"actions",
 header:"Actions",
 cell: ({ row }) => {
 const banner = row.original;
 return (
 <div className="flex gap-1 justify-end transition-opacity">
 <Button 
 className={`h-8 w-8 p-1 bg-transparent border-0 shadow-none transition-colors ${banner.isActive ? 'text-muted hover:text-danger hover:bg-danger/10' : 'text-muted hover:text-success hover:bg-success/10'}`}
 onClick={() => toggleStatusMutation.mutate({ id: banner.id, isActive: !banner.isActive })}
 title={banner.isActive ? "Deactivate" : "Activate"}
 >
 {banner.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
 </Button>
 <Button
 className="h-8 w-8 p-1 bg-transparent border-0 shadow-none text-muted hover:text-danger hover:bg-danger/10 transition-colors"
 onClick={() => {
 if (window.confirm("Are you sure you want to delete this hero banner?")) {
 deleteMutation.mutate(banner.id);
 }
 }}
 title="Delete Hero Banner"
 >
 <Trash className="w-4 h-4" />
 </Button>
 </div>
 );
 }
 }
 ];

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-2xl font-bold tracking-tight text-primary">Hero Banners</h2>
 <p className="text-muted">Manage hero banners for the mobile app home screen.</p>
 </div>
 <div className="flex gap-2">
 <Button onClick={() => setIsAddingBanner(true)}>
 <Plus className="mr-2 h-4 w-4" /> Add Hero Banner
 </Button>
 </div>
 </div>

 <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
 {isLoading ? (
 <div className="animate-pulse p-4">Loading hero banners...</div>
 ) : (
 <DataTable columns={columns} data={heroBanners} />
 )}
 </div>

 {isAddingBanner && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-surface w-full max-w-lg rounded-2xl shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-200">
 <div className="flex items-center justify-between p-5 border-b border-border">
 <h3 className="text-lg font-semibold text-primary">Add Hero Banner</h3>
 <button onClick={() => setIsAddingBanner(false)} className="text-muted hover:text-primary transition-colors bg-transparent p-1.5 rounded-full">
 <X className="w-5 h-5" />
 </button>
 </div>
 <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Heading *</label>
 <input 
 type="text" 
 className="w-full px-3 py-2 border border-border rounded-md bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
 value={newBanner.heading} 
 onChange={(e) => setNewBanner({...newBanner, heading: e.target.value})} 
 placeholder="e.g. Find Your Perfect Escape"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Subheading</label>
 <input 
 type="text" 
 className="w-full px-3 py-2 border border-border rounded-md bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
 value={newBanner.subheading ||""} 
 onChange={(e) => setNewBanner({...newBanner, subheading: e.target.value})}
 placeholder="e.g. Premium Getaways"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Description / Button Text</label>
 <input 
 type="text" 
 className="w-full px-3 py-2 border border-border rounded-md bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
 value={newBanner.buttonText ||""} 
 onChange={(e) => setNewBanner({...newBanner, buttonText: e.target.value})}
 placeholder="e.g. Discover luxury farmhouses..."
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Background Image *</label>
 <ImageUpload
 value={newBanner.imageUrl}
 onChange={(url) => setNewBanner({ ...newBanner, imageUrl: url })}
 />
 </div>
 </div>
 <div className="p-5 bg-surface border-t border-border flex justify-end gap-2">
 <Button variant="outline" onClick={() => setIsAddingBanner(false)}>Cancel</Button>
 <Button 
 onClick={() => createMutation.mutate(newBanner)}
 disabled={createMutation.isPending || !newBanner.heading || !newBanner.imageUrl}
 >
 {createMutation.isPending ?"Saving..." :"Create Banner"}
 </Button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

