"use client";

import { useState } from"react";
import { useRouter } from"next/navigation";
import { api } from"@/lib/api";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { ArrowLeft } from"lucide-react";
import Link from"next/link";

export default function NewCustomerPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 
 const [formData, setFormData] = useState({
 name:"",
 email:"",
 password:"",
 phone:"",
 gender:"",
 age:"",
 });

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError("");

 try {
 await api.post("/users/customer", {
 ...formData,
 age: formData.age ? Number(formData.age) : undefined,
 });
 router.refresh();
 router.push("/users");
 } catch (err: any) {
 setError(err.response?.data?.message ||"Failed to create user");
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="max-w-2xl mx-auto space-y-6">
 <div className="flex items-center gap-4 mb-6">
 <Link href="/users">
 <Button variant="outline" size="sm">
 <ArrowLeft className="w-4 h-4 mr-2" /> Back
 </Button>
 </Link>
 <h2 className="text-2xl font-bold tracking-tight text-primary">Add New End User</h2>
 </div>

 {error && (
 <div className="bg-danger/10 text-danger p-4 rounded text-sm border border-danger/20">
 {error}
 </div>
 )}

 <form onSubmit={handleSubmit} className="bg-surface p-6 rounded-md shadow-sm border border-border space-y-6">
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Full Name</label>
 <Input name="name" required value={formData.name} onChange={handleChange} placeholder="John Doe" />
 </div>
 
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Email Address</label>
 <Input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="john@example.com" />
 </div>

 <div>
 <label className="block text-sm font-medium text-primary mb-1">Phone Number</label>
 <Input name="phone" required value={formData.phone} onChange={handleChange} placeholder="+1234567890" />
 </div>

 <div>
 <label className="block text-sm font-medium text-primary mb-1">Temporary Password</label>
 <Input name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" minLength={6} />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Gender (Optional)</label>
 <Input name="gender" value={formData.gender} onChange={handleChange} placeholder="e.g. Male, Female" />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Age (Optional)</label>
 <Input name="age" type="number" value={formData.age} onChange={handleChange} placeholder="30" />
 </div>
 </div>
 </div>

 <div className="pt-4 flex justify-end">
 <Button type="submit" disabled={loading} className="w-full sm:w-auto">
 {loading ?"Creating..." :"Create User"}
 </Button>
 </div>
 </form>
 </div>
 );
}

