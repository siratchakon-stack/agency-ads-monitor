"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/helpers";
import toast from "react-hot-toast";

const navItems = [
  { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { href: "/ad-accounts", icon: CreditCard, label: "Ad Accounts" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [dark, setDark] = useState(false);
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Fetch critical count for badge
  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.criticalAccounts) setCriticalCount(d.data.criticalAccounts);
      })
      .catch(() => {});
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="text-white" size={17} />
            </div>
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-white leading-tight">
                Agency Ads
              </p>
              <p className="text-[10px] text-gray-500">Balance Monitor</p>
            </div>
          </div>
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {dark ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} className="text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const showBadge = item.href === "/ad-accounts" && criticalCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "sidebar-link",
                isActive ? "sidebar-link-active" : "sidebar-link-inactive"
              )}
            >
              <item.icon size={17} />
              <span className="flex-1 text-sm">{item.label}</span>
              {showBadge && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {criticalCount > 9 ? "9+" : criticalCount}
                </span>
              )}
              {isActive && !showBadge && (
                <ChevronRight size={13} className="text-blue-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
        {/* Demo Badge */}
        <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
          <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">🎯 Demo Mode</p>
          <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70">Using mock data</p>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="sidebar-link sidebar-link-inactive w-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm"
        >
          <LogOut size={16} />
          <span>{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
