"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, CreditCard, BarChart3, Bell, Settings, TrendingUp, AlertTriangle } from "lucide-react";
import { AdAccount } from "@/types";
import { getAccountStatus, formatCurrency, cn } from "@/lib/utils/helpers";

interface SearchResult {
  type: "account" | "page";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ReactNode;
  badge?: { label: string; color: string };
}

const PAGES: SearchResult[] = [
  { type: "page", id: "dashboard", title: "Dashboard", subtitle: "Overview & stats", href: "/dashboard", icon: <BarChart3 size={15} className="text-blue-500" /> },
  { type: "page", id: "ad-accounts", title: "Ad Accounts", subtitle: "All accounts", href: "/ad-accounts", icon: <CreditCard size={15} className="text-violet-500" /> },
  { type: "page", id: "notifications", title: "Notifications", subtitle: "Alert history", href: "/notifications", icon: <Bell size={15} className="text-amber-500" /> },
  { type: "page", id: "settings", title: "Settings", subtitle: "LINE token & thresholds", href: "/settings", icon: <Settings size={15} className="text-gray-500" /> },
];

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Prefetch accounts for search
  useEffect(() => {
    fetch("/api/ad-accounts")
      .then((r) => r.json())
      .then((d) => { if (d.data) setAccounts(d.data); })
      .catch(() => {});
  }, []);

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Build results
  const results: SearchResult[] = [];
  const q = query.toLowerCase().trim();

  if (!q) {
    results.push(...PAGES);
  } else {
    // Pages
    PAGES.forEach((p) => {
      if (p.title.toLowerCase().includes(q) || (p.subtitle || "").toLowerCase().includes(q)) {
        results.push(p);
      }
    });
    // Accounts
    accounts
      .filter(
        (a) =>
          a.ad_account_name.toLowerCase().includes(q) ||
          (a.client_name || "").toLowerCase().includes(q) ||
          a.account_id.includes(q)
      )
      .slice(0, 8)
      .forEach((a) => {
        const status = getAccountStatus(a);
        results.push({
          type: "account",
          id: a.id,
          title: a.client_name || a.ad_account_name,
          subtitle: `${a.ad_account_name} · ${a.account_id}`,
          href: `/ad-accounts`,
          icon: <CreditCard size={15} className="text-gray-400" />,
          badge:
            status === "critical"
              ? { label: "Critical", color: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400" }
              : status === "warning"
              ? { label: "Warning", color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400" }
              : undefined,
        });
      });
  }

  // Arrow keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && results[idx]) {
        router.push(results[idx].href);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, idx, router]);

  useEffect(() => setIdx(0), [query]);

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
    >
      <Search size={13} />
      <span>Search...</span>
      <kbd className="text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5 text-gray-400 ml-2">⌘K</kbd>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Search box */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <Search size={17} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts, pages..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-sm"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
          <kbd className="text-[10px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-gray-400">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              No results for "<span className="font-medium">{query}</span>"
            </div>
          ) : (
            <div className="p-2">
              {!q && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1.5">
                  Quick Navigation
                </p>
              )}
              {q && results.some((r) => r.type === "page") && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1.5">Pages</p>
              )}
              {results.map((result, i) => (
                <>
                  {q && i > 0 && results[i - 1].type === "page" && result.type === "account" && (
                    <p key={`sep-${i}`} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1.5 mt-1">
                      Accounts
                    </p>
                  )}
                  <button
                    key={result.id}
                    onClick={() => { router.push(result.href); setOpen(false); }}
                    onMouseEnter={() => setIdx(i)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                      i === idx ? "bg-blue-50 dark:bg-blue-950/40" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                      i === idx ? "bg-blue-100 dark:bg-blue-900/50" : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      {result.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    {result.badge && (
                      <span className={cn("badge text-[10px] flex-shrink-0", result.badge.color)}>
                        {result.badge.label}
                      </span>
                    )}
                  </button>
                </>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
