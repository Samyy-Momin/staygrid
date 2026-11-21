"use client";

import { useState, useEffect } from"react";
import { useParams } from"next/navigation";
import { api } from"@/lib/api";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { ArrowLeft, Trash, Plus } from"lucide-react";
import Link from"next/link";

type Offer = {
 id: string;
 title: string;
 description: string;
 price: number;
};

export default function OffersManagementPage() {
 const { id: farmhouseId } = useParams();
 const [offers, setOffers] = useState<Offer[]>([]);
 const [loading, setLoading] = useState(true);
 const [creating, setCreating] = useState(false);
 
 const [formData, setFormData] = useState({
 title:"",
 description:"",
 price:"",
 });

 useEffect(() => {
 const fetchOffers = async () => {
 try {
 const res = await api.get(`/farmhouses/${farmhouseId}/offers`);
 setOffers(res.data);
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };
 if (farmhouseId) fetchOffers();
 }, [farmhouseId]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setCreating(true);
 try {
 await api.post(`/farmhouses/${farmhouseId}/offers`, {
 title: formData.title,
 description: formData.description,
 price: Number(formData.price),
 });
 setFormData({ title:"", description:"", price:"" });
 if (farmhouseId) {
 api.get(`/farmhouses/${farmhouseId}/offers`).then(res => setOffers(res.data)).catch(console.error);
 }
 } catch (err: unknown) {
 alert((err as { response?: { data?: { message?: string } } }).response?.data?.message ||"Failed to create offer");
 } finally {
 setCreating(false);
 }
 };

 const handleDelete = async (offerId: string) => {
 if (!confirm("Are you sure you want to delete this offer?")) return;
 try {
 await api.delete(`/farmhouses/${farmhouseId}/offers/${offerId}`);
 setOffers(offers.filter(o => o.id !== offerId));
 } catch {
 alert("Failed to delete offer");
 }
 };

 return (
 <div className="max-w-4xl mx-auto space-y-6">
 <div className="flex items-center gap-4 mb-6">
 <Link href={`/farmhouses/${farmhouseId}`}>
 <Button variant="outline" size="sm">
 <ArrowLeft className="w-4 h-4 mr-2" /> Back to Farmhouse
 </Button>
 </Link>
 <h2 className="text-2xl font-bold tracking-tight text-primary">
 Manage Negotiation Packages
 </h2>
 </div>

 <div className="bg-surface p-6 rounded-md shadow-sm border border-border">
 <h3 className="text-lg font-semibold text-primary mb-4">Create New Package</h3>
 <form onSubmit={handleSubmit} className="flex gap-4 items-end">
 <div className="flex-1">
 <label className="block text-xs font-medium text-muted mb-1">Title (e.g. Half Day)</label>
 <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
 </div>
 <div className="flex-2 w-1/3">
 <label className="block text-xs font-medium text-muted mb-1">Description (e.g. 5AM - 5PM)</label>
 <Input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
 </div>
 <div className="w-32">
 <label className="block text-xs font-medium text-muted mb-1">Price (₹)</label>
 <Input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
 </div>
 <Button type="submit" disabled={creating}>
 <Plus className="w-4 h-4 mr-2" /> {creating ?"Saving..." :"Add"}
 </Button>
 </form>
 </div>

 <div className="bg-surface p-6 rounded-md shadow-sm border border-border">
 <h3 className="text-lg font-semibold text-primary mb-4">Active Packages</h3>
 {loading ? (
 <div className="text-muted">Loading packages...</div>
 ) : offers.length === 0 ? (
 <div className="text-muted py-4 text-center border-2 border-dashed rounded border-border">
 No packages created yet. End-users will just see the base price.
 </div>
 ) : (
 <div className="space-y-3">
 {offers.map(offer => (
 <div key={offer.id} className="flex items-center justify-between p-4 border border-border rounded-md bg-surface dark:bg-surface/50">
 <div>
 <h4 className="font-semibold text-primary">{offer.title}</h4>
 <p className="text-sm text-muted">{offer.description}</p>
 </div>
 <div className="flex items-center gap-4">
 <span className="font-bold text-primary">₹{offer.price}</span>
 <Button variant="ghost" size="sm" onClick={() => handleDelete(offer.id)} className="text-danger hover:text-danger hover:bg-danger dark:hover:bg-danger/20">
 <Trash className="w-4 h-4" />
 </Button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}
