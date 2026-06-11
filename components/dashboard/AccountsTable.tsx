"use client";

import { useState } from "react";
import { AdAccount } from "@/types";
import {
  getAccountStatus,
  getStatusBadgeClass,
  getStatusLabel,
  formatCurrency,
  formatDate,
  cn,
} from "@/lib/utils/helpers";
import {
  Edit2,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Search,
  Download,
  LayoutGrid,
  LayoutList,
  RotateCcw,
  Square,
  CheckSquare,
} from "lucide-react";
import TopupModal from "./TopupModal";
import BalanceBar from "./BalanceBar";
import AccountCard from "./AccountCard";
import AccountDrawer from "./AccountDrawer";
import { exportAccountsToCSV } from "@/lib/utils/export";
import toast from "react-hot-toast";

interface AccountsTableProps {
  accounts: AdAccount[];
  loading?: boolean;
  onUpdate?: () => void;
  warningThreshold?: number;
}

type SortField = "remaining_balance" | "spend_today" | "total_spend" | "ad_account_name";
type SortDir = "asc" | "desc";
type ViewMode = "table" | "grid";

export default function AccountsTable({
  accounts,
  loading,
  onUpdate,
  warningThreshold = 3000,
}: AccountsTableProps) {
  const [editingAccount, setEditingAccount] = useState<AdAccount | null>(null);
  const [drawerAccount, setDrawerAccount] = useState<AdAccount | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("remaining_balance");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleTopupComplete = async (id: string) => {
    await fetch(`/api/ad-accounts/${id}`, { method: "POST" });
    toast.success("Topup marked as completed — alerts re-enabled");
    onUpdate?.();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((a) => a.id)));
  };

  const handleBulkResetAlerts = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/ad-accounts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action: "reset_alerts" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Reset alerts for ${selected.size} accounts`);
        setSelected(new Set());
        onUpdate?.();
      } else {
        toast.error(data.error || "Bulk action failed");
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const filtered = accounts
    .filter((a) => {
      const q = search.toLowerCase();
      return (
        a.ad_account_name.toLowerCase().includes(q) ||
        (a.client_name || "").toLowerCase().includes(q) ||
        a.account_id.includes(q)
      );
    })
    .sort((a, b) => {
      const valA = a[sortField] as number | string;
      const valB = b[sortField] as number | string;
      const dir = sortDir === "asc" ? 1 : -1;
      if (typeof valA === "number" && typeof valB === "number") return (valA - valB) * dir;
      return String(valA).localeCompare(String(valB)) * dir;
    });

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 inline-flex flex-col opacity-50">
      <ChevronUp size={9} className={sortField === field && sortDir === "asc" ? "opacity-100 text-blue-500" : ""} />
      <ChevronDown size={9} className={sortField === field && sortDir === "desc" ? "opacity-100 text-blue-500" : ""} />
    </span>
  );

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="skeleton h-9 w-64 rounded-lg" />
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        {/* Bulk Action Bar */}
        {selected.size > 0 && (
          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800/50 flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              {selected.size} selected
            </span>
            <button
              onClick={handleBulkResetAlerts}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <RotateCcw size={13} className={bulkLoading ? "animate-spin" : ""} />
              {bulkLoading ? "Resetting..." : "Reset Alerts"}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search client, account name, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-8 py-2 text-sm h-9"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Count */}
            <span className="text-sm text-gray-400 hidden sm:block">
              {filtered.length} / {accounts.length}
            </span>

            {/* View toggle */}
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "table"
                    ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                <LayoutList size={15} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                <LayoutGrid size={15} />
              </button>
            </div>

            {/* Export */}
            <button
              onClick={() => {
                exportAccountsToCSV(filtered);
                toast.success(`Exported ${filtered.length} accounts to CSV`);
              }}
              className="btn-secondary flex items-center gap-1.5 text-sm h-9 px-3"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* GRID VIEW (mobile-friendly) */}
        {viewMode === "grid" ? (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                No accounts found
              </div>
            ) : (
              filtered.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => setEditingAccount(account)}
                  onTopupComplete={() => handleTopupComplete(account.id)}
                />
              ))
            )}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 w-8">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                      {selected.size === filtered.length && filtered.length > 0
                        ? <CheckSquare size={15} className="text-blue-600" />
                        : <Square size={15} />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-white select-none"
                    onClick={() => handleSort("ad_account_name")}
                  >
                    Ad Account <SortIcon field="ad_account_name" />
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-white select-none"
                    onClick={() => handleSort("spend_today")}
                  >
                    Today <SortIcon field="spend_today" />
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-white select-none hidden lg:table-cell"
                    onClick={() => handleSort("total_spend")}
                  >
                    Total Spend <SortIcon field="total_spend" />
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Topup
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-white select-none"
                    onClick={() => handleSort("remaining_balance")}
                  >
                    Remaining <SortIcon field="remaining_balance" />
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                    Synced
                  </th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-gray-400">
                      No accounts found
                    </td>
                  </tr>
                ) : (
                  filtered.map((account) => {
                    const status = getAccountStatus(account, warningThreshold);
                    const isSelected = selected.has(account.id);
                    return (
                      <tr
                        key={account.id}
                        className={cn(
                          "hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer",
                          isSelected && "bg-blue-50/60 dark:bg-blue-950/20"
                        )}
                      >
                        <td className="px-4 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleSelect(account.id)}
                            className="text-gray-300 hover:text-blue-600 transition-colors"
                          >
                            {isSelected
                              ? <CheckSquare size={15} className="text-blue-600" />
                              : <Square size={15} />}
                          </button>
                        </td>
                        <td
                          className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap"
                          onClick={() => setDrawerAccount(account)}
                        >
                          {account.client_name || (
                            <span className="text-gray-300 dark:text-gray-600 italic text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={() => setDrawerAccount(account)}>
                          <p className="font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            {account.ad_account_name}
                          </p>
                          <p className="text-[11px] text-gray-400">{account.account_id}</p>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium" onClick={() => setDrawerAccount(account)}>
                          {formatCurrency(account.spend_today, account.currency)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-500 dark:text-gray-400 whitespace-nowrap hidden lg:table-cell" onClick={() => setDrawerAccount(account)}>
                          {formatCurrency(account.total_spend, account.currency)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:table-cell" onClick={() => setDrawerAccount(account)}>
                          {account.topup_amount > 0
                            ? formatCurrency(account.topup_amount, account.currency)
                            : <span className="text-gray-300 dark:text-gray-700">—</span>}
                        </td>
                        <td className="px-4 py-3 min-w-[130px]">
                          <div className="space-y-1.5">
                            <p
                              className={cn(
                                "text-right font-bold tabular-nums whitespace-nowrap",
                                status === "critical" ? "text-red-600 dark:text-red-400"
                                  : status === "warning" ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-gray-900 dark:text-white"
                              )}
                            >
                              {account.topup_amount > 0
                                ? formatCurrency(account.remaining_balance, account.currency)
                                : <span className="text-gray-300 dark:text-gray-700 font-normal">—</span>}
                            </p>
                            <BalanceBar
                              topupAmount={account.topup_amount}
                              totalSpend={account.total_spend}
                              threshold={account.threshold}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={cn("badge text-xs", getStatusBadgeClass(status))}>
                            {getStatusLabel(status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-400 whitespace-nowrap hidden xl:table-cell">
                          {formatDate(account.last_synced_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            {account.alert_sent && (
                              <button
                                onClick={() => handleTopupComplete(account.id)}
                                title="Mark topup as completed"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                              >
                                <CheckCircle size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => setEditingAccount(account)}
                              title="Edit account"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 text-xs text-gray-400">
            <span>
              Total spend today:{" "}
              <strong className="text-gray-700 dark:text-gray-300">
                {formatCurrency(
                  filtered.reduce((s, a) => s + Number(a.spend_today), 0),
                  "THB"
                )}
              </strong>
            </span>
            <span>
              Total topup:{" "}
              <strong className="text-gray-700 dark:text-gray-300">
                {formatCurrency(
                  filtered.reduce((s, a) => s + Number(a.topup_amount), 0),
                  "THB"
                )}
              </strong>
            </span>
            <span>
              Total remaining:{" "}
              <strong className="text-gray-700 dark:text-gray-300">
                {formatCurrency(
                  filtered.reduce((s, a) => s + Number(a.remaining_balance), 0),
                  "THB"
                )}
              </strong>
            </span>
          </div>
        )}
      </div>

      {editingAccount && (
        <TopupModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSave={() => { setEditingAccount(null); onUpdate?.(); }}
        />
      )}

      {drawerAccount && (
        <AccountDrawer
          account={drawerAccount}
          onClose={() => setDrawerAccount(null)}
          onEdit={() => { setEditingAccount(drawerAccount); setDrawerAccount(null); }}
          onTopupComplete={() => { handleTopupComplete(drawerAccount.id); setDrawerAccount(null); }}
        />
      )}
    </>
  );
}
