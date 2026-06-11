"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import StatsCard from "@/components/dashboard/StatsCard";
import AccountsTable from "@/components/dashboard/AccountsTable";
import SpendChart from "@/components/dashboard/SpendChart";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import TokenWarning from "@/components/dashboard/TokenWarning";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Clock,
  Activity,
  Wifi,
} from "lucide-react";
import { AdAccount, DashboardStats } from "@/types";
import { formatCurrency, timeAgo } from "@/lib/utils/helpers";
import { Send } from "lucide-react";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, accountsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/ad-accounts"),
      ]);
      const statsData = await statsRes.json();
      const accountsData = await accountsRes.json();
      if (statsData.data) setStats(statsData.data);
      if (accountsData.data) setAccounts(accountsData.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sendWeeklyReport = async () => {
    const tid = toast.loading("Sending weekly report via LINE...");
    try {
      const res = await fetch("/api/reports/weekly", { method: "POST" });
      const data = await res.json();
      if (res.ok) toast.success(data.message || "Weekly report sent!", { id: tid });
      else toast.error(data.error || "Failed", { id: tid });
    } catch {
      toast.error("Network error", { id: tid });
    }
  };

  const criticalAccounts = accounts.filter(
    (a) => a.topup_amount > 0 && a.remaining_balance < 1500
  );
  const warningAccounts = accounts.filter(
    (a) =>
      a.topup_amount > 0 &&
      a.remaining_balance >= 1500 &&
      a.remaining_balance < 3000
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Dashboard"
        subtitle={`Last synced: ${timeAgo(stats?.lastSyncTime)}`}
        showSync
        onSyncComplete={fetchData}
      />

      <TokenWarning />
      <OnboardingChecklist />

      <div className="p-6 space-y-5 flex-1">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Accounts"
            value={stats?.totalAccounts ?? 0}
            subtitle={`${stats?.activeAccounts ?? 0} active`}
            icon={BarChart3}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-950/30"
            loading={loading}
          />
          <StatsCard
            title="Need Attention"
            value={(stats?.nearLimitAccounts ?? 0)}
            subtitle={`${stats?.criticalAccounts ?? 0} critical · ${stats?.warningAccounts ?? 0} warning`}
            icon={AlertTriangle}
            iconColor="text-amber-600"
            iconBg="bg-amber-50 dark:bg-amber-950/30"
            loading={loading}
          />
          <StatsCard
            title="Spend Today"
            value={stats ? formatCurrency(stats.totalSpendToday, "THB") : "—"}
            subtitle="All accounts combined"
            icon={TrendingUp}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-950/30"
            loading={loading}
          />
          <StatsCard
            title="Last Sync"
            value={timeAgo(stats?.lastSyncTime)}
            subtitle="Auto-sync every 2h"
            icon={Clock}
            iconColor="text-violet-600"
            iconBg="bg-violet-50 dark:bg-violet-950/30"
            loading={loading}
          />
        </div>

        {/* Alert Banners */}
        {!loading && criticalAccounts.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-red-500" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-700 dark:text-red-400 text-sm">
                🔴 {criticalAccounts.length} account{criticalAccounts.length > 1 ? "s" : ""} critically low — LINE alert sent
              </p>
              <p className="text-xs text-red-500 dark:text-red-500/80 mt-0.5 truncate">
                {criticalAccounts.map((a) => a.client_name || a.ad_account_name).join("  ·  ")}
              </p>
            </div>
          </div>
        )}

        {!loading && warningAccounts.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-yellow-600" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-yellow-700 dark:text-yellow-400 text-sm">
                🟡 {warningAccounts.length} account{warningAccounts.length > 1 ? "s" : ""} below warning threshold
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500/80 mt-0.5 truncate">
                {warningAccounts.map((a) => a.client_name || a.ad_account_name).join("  ·  ")}
              </p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Chart */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  Spend Today by Account
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Top 8 accounts by daily spend</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                  Normal
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" />
                  Warning
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
                  Critical
                </span>
              </div>
            </div>
            {loading ? (
              <div className="h-48 skeleton rounded-xl" />
            ) : (
              <SpendChart accounts={accounts} />
            )}
          </div>

          {/* Status Summary */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">
              Account Status
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-14 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  {
                    label: "Normal",
                    count: (stats?.activeAccounts ?? 0) - (stats?.nearLimitAccounts ?? 0),
                    color: "bg-emerald-500",
                    bg: "bg-emerald-50 dark:bg-emerald-950/30",
                    text: "text-emerald-700 dark:text-emerald-400",
                  },
                  {
                    label: "Warning",
                    count: stats?.warningAccounts ?? 0,
                    color: "bg-yellow-400",
                    bg: "bg-yellow-50 dark:bg-yellow-950/30",
                    text: "text-yellow-700 dark:text-yellow-400",
                  },
                  {
                    label: "Critical",
                    count: stats?.criticalAccounts ?? 0,
                    color: "bg-red-500",
                    bg: "bg-red-50 dark:bg-red-950/30",
                    text: "text-red-700 dark:text-red-400",
                  },
                  {
                    label: "Inactive",
                    count: (stats?.totalAccounts ?? 0) - (stats?.activeAccounts ?? 0),
                    color: "bg-gray-300",
                    bg: "bg-gray-50 dark:bg-gray-800/50",
                    text: "text-gray-500 dark:text-gray-400",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between p-3 rounded-xl ${item.bg}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className={`text-sm font-medium ${item.text}`}>{item.label}</span>
                    </div>
                    <span className={`text-lg font-bold ${item.text}`}>{item.count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Live indicator */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs text-gray-400">
              <Wifi size={12} className="text-emerald-500" />
              <span>Auto-sync every 2 hours via cron</span>
            </div>
          </div>
        </div>

        {/* Activity bar */}
        {!loading && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Activity size={12} className="text-emerald-500" />
              <span>Live monitoring · Cron runs every 2 hours</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={sendWeeklyReport}
                className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium border border-violet-200 dark:border-violet-800/50 px-3 py-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
              >
                <Send size={11} />
                Send Weekly Report
              </button>
              <AutoRefresh onRefresh={fetchData} intervalSeconds={300} />
            </div>
          </div>
        )}

        {/* Accounts Table */}
        <AccountsTable
          accounts={accounts}
          loading={loading}
          onUpdate={fetchData}
        />
      </div>
    </div>
  );
}
