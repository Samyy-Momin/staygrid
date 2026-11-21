"use client";

import { useState, useEffect } from"react";
import { useSearchParams } from"next/navigation";
import { api } from"@/lib/api";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { ArrowLeft, UserPlus, CheckCircle2, FileText, CalendarIcon, X } from"lucide-react";
import Link from"next/link";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from"@/components/ui/popover";
import { Calendar } from"@/components/ui/calendar";
import { TimePicker } from"@/components/ui/time-picker";
import { format } from"date-fns";
import { cn } from"@/lib/utils";

type User = {
 id: string;
 name: string;
 email: string;
};

export default function AdminBookingPage() {
 const searchParams = useSearchParams();
 const farmhouseId = searchParams.get("farmhouseId");

 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [success, setSuccess] = useState(false);
 const [bookingId, setBookingId] = useState("");
 
 const [customers, setCustomers] = useState<User[]>([]);
 const [selectedUserId, setSelectedUserId] = useState("");
 const [isCreatingUser, setIsCreatingUser] = useState(false);
 
 const [newUserData, setNewUserData] = useState({ 
 name:"", email:"", password:"", phone:"", gender:"", age:"" 
 });
 const [userCreated, setUserCreated] = useState(false);

 const [bookingData, setBookingData] = useState({
 adults:"2",
 children:"0",
 });

 const [checkIn, setCheckIn] = useState<Date>();
 const [checkInTime, setCheckInTime] = useState<string>("14:00");
 const [checkOut, setCheckOut] = useState<Date>();
 const [checkOutTime, setCheckOutTime] = useState<string>("11:00");

 useEffect(() => {
 api.get("/users/customers").then((res) => setCustomers(res.data)).catch(console.error);
 }, []);

 const handleCreateUser = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError("");
 try {
 const res = await api.post("/users/customer", {
 ...newUserData,
 age: newUserData.age ? Number(newUserData.age) : undefined,
 });
 setCustomers([...customers, res.data.customer]);
 setSelectedUserId(res.data.customer.id);
 setUserCreated(true);
 setIsCreatingUser(false);
 } catch (err: unknown) {
 setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ||"Failed to create user");
 } finally {
 setLoading(false);
 }
 };

 const buildDateTime = (date: Date, timeStr: string) => {
 const [hours, minutes] = timeStr.split(':').map(Number);
 const d = new Date(date);
 d.setHours(hours, minutes, 0, 0);
 return d.toISOString();
 };

 const handleSubmitBooking = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError("");

 if (!selectedUserId) {
 setError("Please select or create an End User.");
 setLoading(false);
 return;
 }
 if (!farmhouseId) {
 setError("No farmhouse selected. Please go back and select a farmhouse.");
 setLoading(false);
 return;
 }

 if (!checkIn || !checkOut) {
 setError("Please select both Check In and Check Out dates.");
 setLoading(false);
 return;
 }

 const formattedCheckIn = buildDateTime(checkIn, checkInTime);
 const formattedCheckOut = buildDateTime(checkOut, checkOutTime);

 try {
 const res = await api.post("/bookings/admin", {
 ...bookingData,
 checkIn: formattedCheckIn,
 checkOut: formattedCheckOut,
 adults: Number(bookingData.adults),
 children: Number(bookingData.children),
 farmhouseId,
 userId: selectedUserId,
 });
 
 setBookingId(res.data.id);
 setSuccess(true);
 } catch (err: unknown) {
 setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ||"Failed to create booking");
 } finally {
 setLoading(false);
 }
 };

 const downloadInvoice = async () => {
 try {
 const response = await api.get(`/bookings/${bookingId}/invoice`, { responseType:'blob' });
 const url = window.URL.createObjectURL(new Blob([response.data]));
 const link = document.createElement('a');
 link.href = url;
 link.setAttribute('download',`invoice-${bookingId}.pdf`);
 document.body.appendChild(link);
 link.click();
 link.parentNode?.removeChild(link);
 } catch (error) {
 console.error("Failed to download invoice", error);
 }
 };

 if (success) {
 return (
 <div className="max-w-2xl mx-auto mt-12 bg-surface p-8 rounded-md shadow border border-border text-center space-y-6">
 <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
 <h2 className="text-2xl font-bold text-primary">Booking Confirmed!</h2>
 <p className="text-muted">The booking has been successfully created on behalf of the user.</p>
 
 <div className="flex justify-center gap-4 pt-4">
 <Button onClick={downloadInvoice} className="bg-accent-primary hover:bg-accent-primary">
 <FileText className="w-4 h-4 mr-2" /> Download Invoice PDF
 </Button>
 <Link href="/farmhouses">
 <Button variant="outline">Return to Farmhouses</Button>
 </Link>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-3xl mx-auto space-y-6">
 <div className="flex items-center gap-4 mb-6">
 <Link href="/farmhouses">
 <Button variant="outline" size="sm">
 <ArrowLeft className="w-4 h-4 mr-2" /> Back
 </Button>
 </Link>
 <h2 className="text-2xl font-bold tracking-tight text-primary">Book on Behalf of User</h2>
 </div>

 {error && (
 <div className="bg-danger/10 text-danger p-4 rounded text-sm border border-danger/20">
 {error}
 </div>
 )}

 {/* STEP 1: USER SELECTION */}
 <div className="bg-surface p-6 rounded-md shadow-sm border border-border">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-semibold text-primary">Step 1: Assign End User</h3>
 {!isCreatingUser && !userCreated && (
 <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatingUser(true)}>
 <UserPlus className="w-4 h-4 mr-2" /> Create New User
 </Button>
 )}
 </div>
 
 {isCreatingUser ? (
 <div className="bg-surface p-4 rounded border border-border space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <Input placeholder="Full Name" value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} />
 <Input placeholder="Email Address" type="email" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} />
 <Input placeholder="Phone Number" value={newUserData.phone} onChange={e => setNewUserData({...newUserData, phone: e.target.value})} />
 <Input placeholder="Password" type="password" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} />
 <Input placeholder="Gender (e.g. Male, Female)" value={newUserData.gender} onChange={e => setNewUserData({...newUserData, gender: e.target.value})} />
 <Input placeholder="Age" type="number" value={newUserData.age} onChange={e => setNewUserData({...newUserData, age: e.target.value})} />
 </div>
 <div className="flex justify-end gap-2">
 <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatingUser(false)}>Cancel</Button>
 <Button type="button" size="sm" onClick={handleCreateUser} disabled={loading}>Save User</Button>
 </div>
 </div>
 ) : userCreated ? (
 <div className="flex items-center text-success dark:text-success bg-success/10 dark:bg-success/10 p-3 rounded border border-success/20 dark:border-success/20">
 <CheckCircle2 className="w-5 h-5 mr-2" />
 <span className="text-sm font-medium">New user created and assigned.</span>
 </div>
 ) : (
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Select Existing User</label>
 <select 
 className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
 value={selectedUserId}
 onChange={e => setSelectedUserId(e.target.value)}
 >
 <option value="">-- Choose a User --</option>
 {customers.map(c => (
 <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
 ))}
 </select>
 </div>
 )}
 </div>

 {/* STEP 2: BOOKING DETAILS */}
 <form onSubmit={handleSubmitBooking} className="bg-surface p-6 rounded-md shadow-sm border border-border space-y-6">
 <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
 Step 2: Booking Details
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Check In Date</label>
 <Popover>
 <PopoverTrigger asChild>
 <Button
 variant={"outline"}
 className={cn(
"w-full justify-start text-left font-normal border-border",
 !checkIn &&"text-muted"
 )}
 >
 <CalendarIcon className="mr-2 h-4 w-4" />
 {checkIn ? format(checkIn,"PPP") : <span>Pick a date</span>}
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-auto p-0" align="start" side="bottom">
 <Calendar
 mode="single"
 selected={checkIn}
 onSelect={setCheckIn}
 initialFocus
 />
 <div className="p-2 border-t border-border flex gap-2">
 <PopoverClose asChild>
 <Button variant="outline" className="w-10 px-0">
 <X className="w-4 h-4 text-muted" />
 </Button>
 </PopoverClose>
 <PopoverClose asChild>
 <Button className="flex-1 bg-success hover:bg-success text-white font-semibold">
 <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm
 </Button>
 </PopoverClose>
 </div>
 </PopoverContent>
 </Popover>
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Check In Time</label>
 <TimePicker value={checkInTime} onChange={setCheckInTime} />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Check Out Date</label>
 <Popover>
 <PopoverTrigger asChild>
 <Button
 variant={"outline"}
 className={cn(
"w-full justify-start text-left font-normal border-border",
 !checkOut &&"text-muted"
 )}
 >
 <CalendarIcon className="mr-2 h-4 w-4" />
 {checkOut ? format(checkOut,"PPP") : <span>Pick a date</span>}
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-auto p-0" align="start" side="bottom">
 <Calendar
 mode="single"
 selected={checkOut}
 onSelect={setCheckOut}
 initialFocus
 />
 <div className="p-2 border-t border-border flex gap-2">
 <PopoverClose asChild>
 <Button variant="outline" className="w-10 px-0">
 <X className="w-4 h-4 text-muted" />
 </Button>
 </PopoverClose>
 <PopoverClose asChild>
 <Button className="flex-1 bg-success hover:bg-success text-white font-semibold">
 <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm
 </Button>
 </PopoverClose>
 </div>
 </PopoverContent>
 </Popover>
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Check Out Time</label>
 <TimePicker value={checkOutTime} onChange={setCheckOutTime} />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Adults</label>
 <Input type="number" required min="1" value={bookingData.adults} onChange={e => setBookingData({...bookingData, adults: e.target.value})} />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Children</label>
 <Input type="number" required min="0" value={bookingData.children} onChange={e => setBookingData({...bookingData, children: e.target.value})} />
 </div>
 </div>

 <div className="pt-4 flex justify-end">
 <Button type="submit" disabled={loading} className="w-full sm:w-auto">
 {loading ?"Processing..." :"Confirm Booking & Generate Invoice"}
 </Button>
 </div>
 </form>
 </div>
 );
}

