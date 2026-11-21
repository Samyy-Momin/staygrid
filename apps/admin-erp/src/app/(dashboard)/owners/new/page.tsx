"use client";

import { useState, Suspense } from"react";
import { useRouter, useSearchParams } from"next/navigation";
import { api } from"@/lib/api";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { ArrowLeft } from"lucide-react";
import Link from"next/link";

function NewOwnerForm() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const redirectUrl = searchParams.get("redirect") ||"/owners";
 
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 
 const [formData, setFormData] = useState({
 firstName:"",
 lastName:"",
 email:"",
 password:"",
 phone:"",
 });

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError("");

 try {
 const payload = {
 name:`${formData.firstName} ${formData.lastName}`.trim(),
 email: formData.email,
 password: formData.password,
 phone:`+91${formData.phone}`,
 };
 await api.post("/users/owner", payload);
 router.push(redirectUrl);
 } catch (err: any) {
 setError(err.response?.data?.message ||"Failed to create owner");
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="max-w-2xl mx-auto space-y-6">
 <div className="flex items-center gap-4 mb-6">
 <Link href={redirectUrl}>
 <Button variant="outline" size="sm">
 <ArrowLeft className="w-4 h-4 mr-2" /> Back
 </Button>
 </Link>
 <h2 className="text-2xl font-bold tracking-tight text-primary">Add New Owner Admin</h2>
 </div>

 {error && (
 <div className="bg-danger/10 text-danger p-4 rounded text-sm border border-danger/20">
 {error}
 </div>
 )}

 <form onSubmit={handleSubmit} className="bg-surface p-6 rounded-md shadow-sm border border-border space-y-6">
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-primary mb-1">First Name</label>
 <Input name="firstName" required value={formData.firstName} onChange={handleChange} placeholder="John" />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Last Name</label>
 <Input name="lastName" required value={formData.lastName} onChange={handleChange} placeholder="Doe" />
 </div>
 </div>
 
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Email Address</label>
 <Input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="john@example.com" />
 </div>

 <div>
 <label className="block text-sm font-medium text-primary mb-1">Phone Number</label>
 <div className="flex">
 <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-surface text-muted text-sm">
 +91
 </span>
 <Input 
 name="phone" 
 required 
 value={formData.phone} 
 onChange={(e) => {
 let val = e.target.value.replace(/\D/g,"");
 if (val.length > 10) val = val.slice(0, 10);
 setFormData({ ...formData, phone: val });
 }} 
 placeholder="1234567890" 
 className="rounded-l-none"
 minLength={10}
 maxLength={10}
 />
 </div>
 <p className="text-xs text-muted mt-1">Write 10 digit phone number only</p>
 </div>

 <div>
 <label className="block text-sm font-medium text-primary mb-1">Temporary Password</label>
 <Input name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" minLength={6} />
 </div>
 </div>

 <div className="pt-4 flex justify-end">
 <Button type="submit" disabled={loading} className="w-full sm:w-auto">
 {loading ?"Creating..." :"Create Owner"}
 </Button>
 </div>
 </form>
 </div>
 );
}

export default function NewOwnerPage() {
 return (
 <Suspense fallback={<div>Loading...</div>}>
 <NewOwnerForm />
 </Suspense>
 );
}

