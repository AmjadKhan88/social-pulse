// src/components/layout/MainLayout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, Bell, Search, User, Settings, LogOut, Zap, Menu, X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/notification.store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/feed",          icon: Home,     label: "Home" },
  { href: "/friends",       icon: Users,    label: "Friends" },
  { href: "/notifications", icon: Bell,     label: "Notifications" },
  { href: "/search",        icon: Search,   label: "Search" },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const { user, clearAuth }  = useAuthStore();
  const { reset: resetNotif } = useNotificationStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      clearAuth();
      resetNotif();
      router.push("/login");
      router.refresh();
      toast.success("Logged out");
    }
  }

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Navbar ───────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 hidden sm:block">SocialSphere</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <NotificationBell />

            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
              <span className="hidden sm:block text-sm font-medium text-slate-700">
                {user.displayName.split(" ")[0]}
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/settings/privacy"
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                title="Settings"
              >
                <Settings size={18} />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Nav Drawer ─────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl p-6 animate-slide-down">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200">
              <Avatar src={user.avatarUrl} alt={user.displayName} size="md" />
              <div>
                <p className="font-semibold text-slate-900">{user.displayName}</p>
                <p className="text-xs text-slate-500">@{user.username}</p>
              </div>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    pathname.startsWith(href)
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
              <Link
                href={`/profile/${user.id}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User size={18} />
                My Profile
              </Link>
              <Link
                href="/settings/privacy"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings size={18} />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                Log out
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* ── Mobile Bottom Nav ─────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 md:hidden bg-white/90 backdrop-blur-md border-t border-slate-200 z-30">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors",
                  active ? "text-brand-600" : "text-slate-500"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
          <Link
            href={`/profile/${user.id}`}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors",
              pathname.startsWith("/profile") ? "text-brand-600" : "text-slate-500"
            )}
          >
            <User size={20} />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
