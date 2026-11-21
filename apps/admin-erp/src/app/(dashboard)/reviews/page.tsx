"use client";

import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import { Trash } from"lucide-react";
import { api } from"@/lib/api";
import { Button } from"@/components/ui/button";
import { DataTable } from"@/components/ui/data-table";
import { ColumnDef } from"@tanstack/react-table";

type Review = {
 id: string;
 rating: number;
 comment: string;
 user: { name: string };
 farmhouse: { title: string };
 createdAt: string;
};

export default function ReviewsPage() {
 const queryClient = useQueryClient();

 const { data: reviews = [], isLoading } = useQuery({
 queryKey: ["reviews"],
 queryFn: async () => {
 const res = await api.get("/reviews");
 return res.data;
 }
 });

 const deleteMutation = useMutation({
 mutationFn: async (id: string) => {
 return api.delete(`/reviews/${id}`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["reviews"] });
 }
 });

 const columns: ColumnDef<Review>[] = [
 {
 accessorKey:"farmhouse.title",
 header:"Farmhouse"
 },
 {
 accessorKey:"user.name",
 header:"User"
 },
 {
 accessorKey:"rating",
 header:"Rating",
 cell: ({ row }) => <div className="font-medium text-warning">{row.original.rating} / 5</div>
 },
 {
 accessorKey:"comment",
 header:"Comment",
 cell: ({ row }) => <div className="max-w-md truncate">{row.original.comment}</div>
 },
 {
 id:"actions",
 header:"Actions",
 cell: ({ row }) => {
 const review = row.original;
 return (
 <div className="flex gap-1 justify-end">
 <Button
 className="h-8 w-8 p-1 bg-transparent border-0 shadow-none text-muted hover:text-danger hover:bg-danger"
 onClick={() => {
 if (window.confirm("Are you sure you want to delete this review?")) {
 deleteMutation.mutate(review.id);
 }
 }}
 title="Delete Review"
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
 <h2 className="text-2xl font-bold tracking-tight text-primary">Reviews</h2>
 <p className="text-muted">Manage farmhouse ratings and comments.</p>
 </div>
 </div>

 <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
 {isLoading ? (
 <div className="animate-pulse p-4">Loading reviews...</div>
 ) : (
 <DataTable columns={columns} data={reviews} />
 )}
 </div>
 </div>
 );
}

