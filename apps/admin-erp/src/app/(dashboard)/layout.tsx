"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, Users, UserCog, Home, CalendarCheck, LogOut, Sun, Moon, List, Image as ImageIcon,
  MessageSquare, DollarSign, Receipt, Film, BarChart3, Globe, Inbox, Bell, Menu, X, type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { identifyUser, resetMixpanel, trackEvent } from "@/lib/mixpanel";

type NavItem = { name: string; href: string; icon: LucideIcon };

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: loading } = authClient.useSession();
  const user = session?.user;
  const { resolvedTheme, setTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = String((user as any)?.role || "").toUpperCase();
  const isOwner = role === "OWNER";

  // Lightweight unread badge: one small request per minute, only while the tab is visible.
  const { data: notifications = [] } = useQuery<{ id: string; readAt: string | null }[]>({
    queryKey: ["my-notifications"],
    queryFn: async () => (await api.get("/notifications/me")).data,
    enabled: !!user,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
  const unread = notifications.filter((n) => !n.readAt).length;

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") router.push("/login");
  }, [loading, user, pathname, router]);

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (user?.id) {
      identifyUser({ id: user.id, name: user.name, email: user.email, role });
      trackEvent(isOwner ? "owner_session_started" : "admin_session_started", { user_id: user.id, role });
    }
  }, [user?.id, isOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    resetMixpanel();
    await authClient.signOut();
    window.location.href = "/login";
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted font-medium bg-surface">
        {loading ? "Loading..." : "Redirecting to login..."}
      </div>
    );
  }

  const ownerNav: NavItem[] = [
    { name: "Calendar", href: "/", icon: CalendarCheck },
    { name: "Bookings", href: "/bookings", icon: Receipt },
    { name: "Requests", href: "/enquiries", icon: Inbox },
    { name: "My Website", href: "/my-website", icon: Globe },
    { name: "My Farmhouses", href: "/farmhouses", icon: Home },
    { name: "Prices", href: "/pricing", icon: DollarSign },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];
  const adminNav: NavItem[] = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Bookings", href: "/bookings", icon: CalendarCheck },
    { name: "Money", href: "/finance", icon: Receipt },
    { name: "Farmhouses", href: "/farmhouses", icon: Home },
    { name: "Websites", href: "/websites", icon: Globe },
    { name: "Website Requests", href: "/enquiries", icon: Inbox },
    { name: "Owners", href: "/owners", icon: UserCog },
    { name: "Users", href: "/users", icon: Users },
    { name: "Pricing Rules", href: "/pricing", icon: DollarSign },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Explore Reels", href: "/explore", icon: Film },
    { name: "Categories", href: "/categories", icon: List },
    { name: "Hero Banners", href: "/hero-banners", icon: ImageIcon },
    { name: "Reviews", href: "/reviews", icon: MessageSquare },
  ];
  const navigation = isOwner ? ownerNav : adminNav;
  // Owners on phones get the 4 most-used actions as a big bottom bar.
  const bottomTabs = isOwner ? ownerNav.slice(0, 4) : [];
  const title = navigation.find((n) => isActivePath(pathname, n.href))?.name || "Dashboard";

  const navList = (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {navigation.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-3 lg:py-2 rounded-lg text-body lg:text-body-sm font-medium transition-colors ${
              active ? "text-accent-primary bg-accent-primary/10" : "text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Icon className="h-5 w-5 lg:h-4 lg:w-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
            <span className="flex-1">{item.name}</span>
            {item.href === "/notifications" && unread > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-danger text-white text-caption font-bold flex items-center justify-center">{unread}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center">
      <div className="relative w-8 h-8 rounded-md overflow-hidden border border-border shrink-0 bg-surface">
        <Image src="/staygrid-logo.PNG" alt="StayGrid" fill className="object-contain p-1" priority />
      </div>
      <span className="ml-3 font-extrabold text-lg tracking-tight text-primary">STAYGRID</span>
    </div>
  );

  const userBlock = (
    <div className="p-4 border-t border-border/50">
      <div className="flex items-center mb-3 px-2">
        <div className="h-9 w-9 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center font-bold text-sm">
          {user.name?.charAt(0) || "U"}
        </div>
        <div className="ml-3 min-w-0">
          <p className="font-medium text-body-sm text-primary truncate">{user.name}</p>
          <p className="text-caption text-muted uppercase tracking-widest">{isOwner ? "Owner" : "Admin"}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 px-3 py-2 text-body-sm font-medium text-muted hover:text-danger hover:bg-danger/10 transition-colors rounded-lg"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );

  return (
    <div className="flex h-dvh bg-surface font-sans text-primary">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-border flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border/50">{brand}</div>
        {navList}
        {userBlock}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-[82%] max-w-xs h-full bg-surface flex flex-col shadow-modal">
            <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
              {brand}
              <button aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="p-2 rounded-full hover:bg-black/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            {navList}
            {userBlock}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="h-14 lg:h-16 shrink-0 flex items-center gap-2 px-3 lg:px-8 border-b border-border/50">
          <button aria-label="Open menu" onClick={() => setDrawerOpen(true)} className="lg:hidden p-2 -ml-1 rounded-full hover:bg-black/5">
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="flex-1 text-h3 text-primary truncate">{title}</h2>
          <Link href="/notifications" aria-label="Notifications" className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </header>

        <div className={`flex-1 overflow-auto p-3 sm:p-4 lg:p-6 ${bottomTabs.length ? "pb-24 lg:pb-6" : ""}`}>
          <div className="w-full h-full">{children}</div>
        </div>

        {/* Owner bottom tab bar (phones) */}
        {bottomTabs.length > 0 && (
          <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
            {bottomTabs.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 text-caption font-semibold ${active ? "text-accent-primary" : "text-muted"}`}
                >
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        )}
      </main>
    </div>
  );
}
