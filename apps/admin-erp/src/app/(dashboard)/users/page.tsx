"use client";

import { useQuery } from"@tanstack/react-query";
import { api } from"@/lib/api";
import { DataTable } from"@/components/ui/data-table";
import { ColumnDef } from"@tanstack/react-table";
import { Search, Trash } from"lucide-react";
import { Input } from"@/components/ui/input";
import { useState, useEffect } from"react";
import Link from"next/link";
import { Button } from"@/components/ui/button";

type User = {
 id: string;
 name: string;
 email: string;
 phone: string | null;
 gender: string | null;
 age: number | null;
 createdAt: string;
};

const columns: ColumnDef<User>[] = [
 {
 accessorKey:"name",
 header:"Name",
 cell: ({ row }) => <div className="font-medium text-primary">{row.getValue("name")}</div>,
 },
 {
 accessorKey:"email",
 header:"Email",
 },
 {
 accessorKey:"phone",
 header:"Phone",
 },
];

export default function UsersPage() {
 const [users, setUsers] = useState<User[]>([]);
 const [search, setSearch] = useState("");
 const [loading, setLoading] = useState(true);

 const fetchUsers = async () => {
 try {
 const res = await api.get("/users/customers");
 setUsers(res.data);
 } catch (error) {
 console.error("Failed to fetch users:", error);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchUsers();
 }, []);

 const handleDelete = async (id: string) => {
 if (!window.confirm("Are you sure you want to permanently delete this user? This will also delete all their bookings.")) return;
 try {
 await api.delete(`/users/${id}`);
 fetchUsers();
 } catch (error) {
 console.error("Failed to delete user:", error);
 alert("Failed to delete user. Please try again.");
 }
 };

 const filteredUsers = users.filter(user => 
 user.name.toLowerCase().includes(search.toLowerCase()) || 
 user.email.toLowerCase().includes(search.toLowerCase()) ||
 (user.phone && user.phone.includes(search))
 );

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
  <div>
  <h2 className="text-h2 text-primary">End Users</h2>
  <p className="text-body-sm text-muted mt-1">Manage mobile app customers.</p>
  </div>
 <Link href="/users/new">
 <Button>
 Add User
 </Button>
 </Link>
 </div>
  <div className="bg-surface p-6 rounded-lg shadow-card-rest border border-border space-y-6">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
 <Input 
 placeholder="Search name, email, or phone..." 
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="pl-9 bg-surface"
 />
 </div>

 <div className="overflow-x-auto">
  <table className="w-full text-left border-collapse">
  <thead className="bg-surface border-b border-border">
  <tr>
  <th className="px-6 py-4 text-caption font-semibold text-muted uppercase tracking-wider">Name</th>
  <th className="px-6 py-4 text-caption font-semibold text-muted uppercase tracking-wider">Email</th>
  <th className="px-6 py-4 text-caption font-semibold text-muted uppercase tracking-wider">Phone</th>
  <th className="px-6 py-4 text-caption font-semibold text-muted uppercase tracking-wider">Demographics</th>
  <th className="px-6 py-4 text-caption font-semibold text-muted uppercase tracking-wider">Joined Date</th>
  <th className="px-6 py-4 text-caption font-semibold text-muted uppercase tracking-wider">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-border">
 {loading ? (
 <tr>
 <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">Loading users...</td>
 </tr>
 ) : filteredUsers.length === 0 ? (
 <tr>
 <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">No results.</td>
 </tr>
 ) : (
  filteredUsers.map((user) => (
  <tr key={user.id} className="hover:bg-accent-primary/5 transition-colors group">
  <td className="px-6 py-4 whitespace-nowrap text-body-sm font-medium text-primary">{user.name}</td>
  <td className="px-6 py-4 whitespace-nowrap text-body-sm text-muted">{user.email}</td>
  <td className="px-6 py-4 whitespace-nowrap text-body-sm text-muted">{user.phone ||'N/A'}</td>
  <td className="px-6 py-4 whitespace-nowrap text-body-sm text-muted">
  {user.gender ||'N/A'} {user.age ?`• ${user.age} yrs` :''}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-body-sm text-muted">
  {new Date(user.createdAt).toLocaleDateString("en-GB")}
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-body-sm text-muted">
  <Button 
  variant="ghost"
  size="icon"
  onClick={() => handleDelete(user.id)}
  className="h-8 w-8 text-muted hover:text-danger hover:bg-danger/10 transition-colors" 
  title="Delete User"
  >
  <Trash className="w-4 h-4" />
  </Button>
  </td>
  </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}

