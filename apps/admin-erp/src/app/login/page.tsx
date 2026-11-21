"use client";

import * as React from"react"
import { useState } from"react"
import { useRouter } from"next/navigation"
import { authClient } from"@/lib/auth-client"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Eye, EyeOff } from"lucide-react"
import Image from"next/image"

export default function LoginPage() {
 const router = useRouter();
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError("");

 try {
 const { data, error: authError } = await authClient.signIn.email({
 email,
 password,
 });

 if (authError) {
 setError(authError.message ||"Failed to login. Please check your credentials.");
 } else if (data?.user) {
 // Hard redirect to dashboard to clear caches
 window.location.href ="/";
 }
 } catch (err: unknown) {
 setError((err as Error)?.message ||"Something went wrong.");
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen flex items-center justify-center relative">
 {/* Background Image with Dark Overlay */}
 <div 
 className="absolute inset-0 z-0 bg-cover bg-center"
 style={{ backgroundImage:"url('/Future-of-Farmhouses-in-Delhi.jpeg')" }}
 />
 <div className="absolute inset-0 z-0 bg-black/60 dark:bg-black/80" />

 {/* Login Card */}
 <div className="relative z-10 max-w-md w-full mx-4 space-y-8 bg-surface/95 /95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 /50">
 <div className="text-center flex flex-col items-center">
 {/* StayGrid Logo */}
 <div className="flex items-center justify-center mb-6">
 <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border shrink-0 bg-black flex items-center justify-center shadow-md">
 <Image 
 src="/staygrid-logo.PNG" 
 alt="StayGrid Logo" 
 fill
 className="object-cover scale-150"
 priority
 />
 </div>
 </div>
 <h2 className="text-2xl font-[Inter_800ExtraBold] text-primary tracking-tight">
 Welcome to ERP
 </h2>
 </div>

 {error && (
 <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm text-center border border-danger/20">
 {error}
 </div>
 )}

 <form className="mt-8 space-y-6" onSubmit={handleLogin}>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-primary mb-1.5">
 Email Address
 </label>
 <Input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="admin@staygrid.com"
 className="w-full bg-surface"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1.5">
 Password
 </label>
 <div className="relative">
 <Input
 type={showPassword ?"text" :"password"}
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••"
 className="w-full pr-10 bg-surface"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-muted dark:hover:text-muted focus:outline-none"
 >
 {showPassword ? (
 <EyeOff className="h-5 w-5" aria-hidden="true" />
 ) : (
 <Eye className="h-5 w-5" aria-hidden="true" />
 )}
 </button>
 </div>
 </div>
 </div>

 <Button
 type="submit"
 disabled={loading}
 className="w-full h-11 text-base font-medium rounded-xl"
 >
 {loading ?"Signing in..." :"Sign in"}
 </Button>
 </form>
 </div>
 </div>
 );
}
