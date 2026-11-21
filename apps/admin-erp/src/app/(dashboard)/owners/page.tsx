/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Phone, Trash, Key, RefreshCw, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

type Owner = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
};

const columns: ColumnDef<Owner>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium text-primary">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="text-muted font-mono text-xs">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-muted font-mono text-xs">
        <Phone className="w-3 h-3 text-accent-primary" /> {row.getValue("phone") || 'N/A'}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Joined Date",
    cell: ({ row }) => (
      <div className="text-muted text-xs">
        {new Date(row.getValue("createdAt") as string).toLocaleDateString("en-GB")}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const owner = row.original;
      const meta = table.options.meta as any;

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => meta?.handleOpenResetModal?.(owner)}
            className="h-8 w-8 text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
            title="Reset Owner Password"
          >
            <Key className="w-4 h-4" />
          </Button>

          <Button 
            variant="ghost"
            size="icon"
            onClick={() => meta?.handleDelete?.(owner.id)}
            className="h-8 w-8 text-muted hover:text-rose-600 hover:bg-rose-600/10 transition-colors" 
            title="Delete Owner"
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      );
    },
  },
];

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Reset Password Modal State
  const [resetTargetOwner, setResetTargetOwner] = useState<Owner | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");

  const fetchOwners = async () => {
    try {
      const res = await api.get("/users/owners");
      setOwners(res.data);
    } catch (error) {
      console.error("Failed to fetch owners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this owner? This will also delete all their farmhouses and bookings.")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchOwners();
    } catch (error) {
      console.error("Failed to delete owner:", error);
      alert("Failed to delete owner. Please try again.");
    }
  };

  const handleOpenResetModal = (owner: Owner) => {
    setResetTargetOwner(owner);
    setNewPassword("");
    setResetSuccess("");
    setResetError("");
  };

  const handleGenerateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
    let pass = "Staygrid@";
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetOwner || !newPassword) return;
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters long.");
      return;
    }

    setResetting(true);
    setResetError("");
    setResetSuccess("");

    try {
      const res = await api.post("/users/reset-owner-password", {
        ownerId: resetTargetOwner.id,
        newPassword,
      });

      setResetSuccess(res.data.message || `Password for ${resetTargetOwner.name} updated successfully!`);
    } catch (err: any) {
      setResetError(err.response?.data?.message || "Failed to reset owner password.");
    } finally {
      setResetting(false);
    }
  };

  const filteredOwners = owners.filter(owner => 
    owner.name?.toLowerCase().includes(search.toLowerCase()) || 
    owner.email?.toLowerCase().includes(search.toLowerCase()) ||
    owner.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2 text-primary font-extrabold tracking-tight">Owners</h2>
          <p className="text-body-sm text-muted mt-1">View and manage all registered farmhouse owners and reset passwords.</p>
        </div>
        <Link href="/owners/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Owner
          </Button>
        </Link>
      </div>

      <div className="bg-surface p-6 rounded-2xl shadow-card-rest border border-border space-y-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input 
            placeholder="Search name, email, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Loading owners...</div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredOwners} 
            meta={{ handleDelete, handleOpenResetModal }}
          />
        )}
      </div>

      {/* RESET OWNER PASSWORD MODAL */}
      {resetTargetOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-[Inter_800ExtraBold] text-primary flex items-center gap-2">
                🔑 Reset Owner Password
              </h3>
              <button onClick={() => setResetTargetOwner(null)} className="text-muted hover:text-primary p-1">✕</button>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1 text-sm">
              <div className="font-extrabold text-primary">{resetTargetOwner.name}</div>
              <div className="text-xs text-muted font-mono">{resetTargetOwner.email}</div>
            </div>

            {resetSuccess ? (
              <div className="space-y-4 py-2 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {resetSuccess}
                </p>
                <p className="text-xs text-muted">
                  An email notification has been dispatched to {resetTargetOwner.email}.
                </p>
                <Button className="w-full bg-accent-primary text-white font-bold" onClick={() => setResetTargetOwner(null)}>
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs font-bold">
                    {resetError}
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-muted uppercase">New Password</label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomPassword}
                      className="text-[11px] text-accent-primary hover:underline font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Auto Generate
                    </button>
                  </div>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Staygrid@123"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <span className="text-[11px] text-muted block mt-1">Minimum 6 characters required</span>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setResetTargetOwner(null)} className="text-xs font-bold">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={resetting}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
                  >
                    {resetting ? "Resetting..." : "Update Owner Password"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

