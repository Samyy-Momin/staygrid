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

type Category = {
 id: string;
 name: string;
 iconName?: string;
 imageUrl?: string;
 filterKey: string;
 isActive: boolean;
 order: number;
};

export default function CategoriesPage() {
 const queryClient = useQueryClient();

 const [editingCategory, setEditingCategory] = useState<Category | null>(null);

 const { data: categories = [], isLoading } = useQuery({
 queryKey: ["categories"],
 queryFn: async () => {
 const res = await api.get("/categories");
 return res.data;
 }
 });

 const updateCategoryMutation = useMutation({
 mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
 return api.patch(`/categories/${id}`, data);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["categories"] });
 setEditingCategory(null);
 }
 });

 const toggleStatusMutation = useMutation({
 mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
 return api.patch(`/categories/${id}`, { isActive });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["categories"] });
 }
 });

 const deleteMutation = useMutation({
 mutationFn: async (id: string) => {
 return api.delete(`/categories/${id}`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["categories"] });
 }
 });

 const columns: ColumnDef<Category>[] = [
 {
 accessorKey:"imageUrl",
 header:"Image",
 cell: ({ row }) => (
 <div className="w-12 h-12 aspect-square rounded-md overflow-hidden bg-surface flex items-center justify-center border border-border shadow-card-rest">
 {row.original.imageUrl ? (
 <img src={row.original.imageUrl} alt={row.original.name} className="w-full h-full object-cover" />
 ) : (
 <span className="text-[10px] text-muted font-medium">None</span>
 )}
 </div>
 )
 },
 {
 accessorKey:"name",
 header:"Name",
 cell: ({ row }) => <div className="font-medium">{row.original.name}</div>
 },
 {
 accessorKey:"filterKey",
 header:"Filter Key"
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
 const category = row.original;
 return (
 <div className="flex gap-1 justify-end transition-opacity">
 <Button 
 variant="outline"
 size="icon"
 className="h-8 w-8 text-muted hover:text-primary transition-colors"
 onClick={() => setEditingCategory(category)}
 title="Edit Image"
 >
 <Edit className="w-4 h-4" />
 </Button>
 <Button 
 variant="outline"
 size="icon"
 className={`h-8 w-8 transition-colors ${category.isActive ? 'text-muted hover:text-danger hover:bg-danger/10' : 'text-muted hover:text-success hover:bg-success/10'}`}
 onClick={() => toggleStatusMutation.mutate({ id: category.id, isActive: !category.isActive })}
 title={category.isActive ? "Deactivate" : "Activate"}
 >
 {category.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
 </Button>
 <Button
 variant="outline"
 size="icon"
 className="h-8 w-8 text-muted hover:text-danger hover:bg-danger/10 transition-colors"
 onClick={() => {
 if (window.confirm("Are you sure you want to delete this category?")) {
 deleteMutation.mutate(category.id);
 }
 }}
 title="Delete Category"
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
 <h2 className="text-2xl font-bold tracking-tight text-primary">Categories</h2>
 <p className="text-muted">Attach images to existing categories for the mobile app.</p>
 </div>
 </div>

 <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
 {isLoading ? (
 <div className="animate-pulse p-4">Loading categories...</div>
 ) : (
 <DataTable columns={columns} data={categories} />
 )}
 </div>

 {editingCategory && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-surface w-full max-w-md rounded-2xl shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-200">
 <div className="flex items-center justify-between p-5 border-b border-border">
 <h3 className="text-lg font-semibold text-primary">Edit Category Image</h3>
 <button onClick={() => setEditingCategory(null)} className="text-muted hover:text-primary transition-colors bg-transparent p-1.5 rounded-full">
 <X className="w-5 h-5" />
 </button>
 </div>
 <div className="p-5">
 <p className="text-sm text-muted mb-4">
 Update the image for <strong>{editingCategory.name}</strong>.
 </p>
 <ImageUpload
 value={editingCategory.imageUrl}
 onChange={(url) => setEditingCategory({ ...editingCategory, imageUrl: url })}
 />
 </div>
 <div className="p-5 bg-surface border-t border-border flex justify-end gap-2">
 <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
 <Button 
 onClick={() => updateCategoryMutation.mutate({ id: editingCategory.id, data: { imageUrl: editingCategory.imageUrl } })}
 disabled={updateCategoryMutation.isPending}
 >
 {updateCategoryMutation.isPending ?"Saving..." :"Save Image"}
 </Button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

