"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import AccountsTable from "@/components/dashboard/AccountsTable";
import ImportModal from "@/components/dashboard/ImportModal";
import { AdAccount } from "@/types";
import { Filter, AlertTriangle, CheckCircle, XCircle, Activity, Upload } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils/helpers";

type FilterType = "all" | "critical" | "warning" | "normal";

export default function AdAccountsPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showImport, setShowImport] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ad-accounts");
      const data = await res.json();
      if (data.data) setAccounts(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Compute counts
  const critical = accounts.filter((a) => a.topup_amount > 0 && a.remaining_balance < 1500);
  const warning = accounts.filter((a) => a.topup_amount > 0 && a.remaining_balance >= 1500 && a.remaining_balance < 3000);
  const normal = accounts.filter((a) => a.topup_amount === 0 || a.remaining_balance >= 3000);
  const totalSpend = accounts.reduce((s, a) => s + Number(a.spend_today), 0);

  // Apply filter
  const filtered =
    filter === "critical" ? critical :
    filter === "warning" ? warning :
    filter === "normal" ? normal :
    accounts;

  const filterOptions = [
    {
      key: "all" as FilterType,
      label: "All",
      count: accounts.length,
      icon: Activity,
      color: "text-gray-600 dark:text-gray-400",
      activeBg: "bg-gray-900 dark:bg-white text-white dark:text-gray-900",
      passiveBg: "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400",
    },
    {
      key: "critical" as FilterType,
      label: "Critical",
      count: critical.length,
      icon: XCircle,
      color: "text-red-600",
      activeBg: "bg-red-600 text-white",
      passiveBg: "bg-white dark:bg-gray-900 text-red-600 border-red-200 dark:border-red-800/50",
    },
    {
      key: "warning" as FilterType,
      label: "Warning",
      count: warning.length,
      icon: AlertTriangle,
      color: "text-yellow-600",
      activeBg: "bg-yellow-500 text-white",
      passiveBg: "bg-white dark:bg-gray-900 text-yellow-600 border-yellow-200 dark:border-yellow-800/50",
    },
    {
      key: "normal" as FilterType,
      label: "Normal",
      count: normal.length,
      icon: CheckCircle,
      color: "text-emerald-600",
      activeBg: "bg-emerald-600 text-white",
      passiveBg: "bg-white dark:bg-gray-900 text-emerald-600 border-emerald-200 dark:border-emerald-800/50",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Ad Accounts"
        subtitle={`${accounts.length} accounts · ฿${totalSpend.toLocaleString("th-TH", { maximumFractionDigits: 0 })} spend today`}
        showSync
        onSyncComplete={fetchAccounts}
      />

      <div className="p-6 space-y-5">
        {/* Top bar: filters + import */}
        <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 flex items-center gap-1 mr-1">
            <Filter size={12} />
            Filter:
          </span>
          {filterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 shadow-sm",
                filter === f.key
                  ? f.activeBg + " border-transparent shadow-md"
                  : f.passiveBg + " hover:shadow"
              )}
            >
              <f.icon size={14} />
              {f.label}
              <span
                className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded-full",
                  filter === f.key
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                )}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

          {/* Import button */}
          <button
            onClick={() => setShowImport(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Upload size={14} />
            Import CSV
          </button>
        </div>

        {/* Table */}
        <AccountsTable
          accounts={filtered}
          loading={loading}
          onUpdate={fetchAccounts}
        />
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); fetchAccounts(); }}
        />
      )}
    </div>
  );
}
