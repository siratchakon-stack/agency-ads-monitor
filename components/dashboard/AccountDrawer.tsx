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
  X,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Bell,
  BellOff,
  Calendar,
  RefreshCw,
  Edit2,
  FileText,
  Save,
  Pencil,
  Power,
} from "lucide-react";
import BalanceBar from "./BalanceBar";
import InlineTopup from "./InlineTopup";
import toast from "react-hot-toast";

interface AccountDrawerProps {
  account: AdAccount;
  onClose: () => void;
  onEdit: () => void;
  onTopupComplete: () => void;
}

export default function AccountDrawer({
  account,
  onClose,
  onEdit,
  onTopupComplete,
}: AccountDrawerProps) {
  const status = getAccountStatus(account);
  const [editingTopup, setEditingTopup] = useState(false);
  const [currentTopup, setCurrentTopup] = useState(account.topup_amount);
  const [notes, setNotes] = useState((account as AdAccount & { notes?: string }).notes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isActive, setIsActive] = useState(account.is_active);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/ad-accounts/${account.id}/sync`, { method: "POST" });
      const data = await res.json();
      if (res.ok) toast.success("Account synced successfully");
      else toast.error(data.error || "Sync failed");
    } catch {
      toast.error("Network error");
    } finally {
      setSyncing(false);
    }
  };

  const handleToggle = async () => {
    try {
      const res = await fetch(`/api/ad-accounts/${account.id}/toggle`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsActive(data.is_active);
        toast.success(data.is_active ? "Account activated" : "Account deactivated");
      }
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await fetch(`/api/ad-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      toast.success("Notes saved");
      setEditingNotes(false);
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const statusBorderMap: Record<string, string> = {
    critical: "border-t-4 border-t-red-500",
    warning: "border-t-4 border-t-yellow-400",
    inactive: "border-t-4 border-t-gray-300",
    normal: "border-t-4 border-t-emerald-500",
  };

  const spentPct =
    account.topup_amount > 0
      ? Math.min(100, (account.total_spend / account.topup_amount) * 100)
      : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col overflow-y-auto",
          statusBorderMap[status]
        )}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("badge text-xs", getStatusBadgeClass(status))}>
                  {getStatusLabel(status)}
                </span>
                {account.alert_sent && (
                  <span className="badge bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 text-xs flex items-center gap-1">
                    <Bell size={10} />
                    Alert Sent
                  </span>
                )}
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                {account.client_name || "No Client Name"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5 truncate">
                {account.ad_account_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Balance Section */}
        <div className="p-5 space-y-4">
          {/* Big balance number */}
          <div
            className={cn(
              "rounded-2xl p-5 text-center",
              status === "critical"
                ? "bg-red-50 dark:bg-red-950/30"
                : status === "warning"
                ? "bg-yellow-50 dark:bg-yellow-950/20"
                : "bg-emerald-50 dark:bg-emerald-950/20"
            )}
          >
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">
              Estimated Remaining
            </p>
            <p
              className={cn(
                "text-4xl font-black tabular-nums",
                status === "critical"
                  ? "text-red-600 dark:text-red-400"
                  : status === "warning"
                  ? "text-yellow-600 dark:text-yellow-500"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {account.topup_amount > 0
                ? formatCurrency(account.remaining_balance, account.currency)
                : "—"}
            </p>
            {account.topup_amount > 0 && (
              <div className="mt-4 space-y-1.5">
                <BalanceBar
                  topupAmount={account.topup_amount}
                  totalSpend={account.total_spend}
                  threshold={account.threshold}
                />
                <p className="text-xs text-gray-400">
                  {(100 - spentPct).toFixed(1)}% remaining of topup
                </p>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Spend Today",
                value: formatCurrency(account.spend_today, account.currency),
                icon: TrendingUp,
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-950/30",
              },
              {
                label: "Total Spend",
                value: formatCurrency(account.total_spend, account.currency),
                icon: CreditCard,
                color: "text-violet-600",
                bg: "bg-violet-50 dark:bg-violet-950/30",
              },
              {
                label: "Topup Amount",
                value:
                  account.topup_amount > 0
                    ? formatCurrency(account.topup_amount, account.currency)
                    : "Not set",
                icon: CheckCircle,
                color: "text-emerald-600",
                bg: "bg-emerald-50 dark:bg-emerald-950/30",
              },
              {
                label: "Alert Threshold",
                value: formatCurrency(account.threshold, account.currency),
                icon: AlertTriangle,
                color: "text-amber-600",
                bg: "bg-amber-50 dark:bg-amber-950/30",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-1.5"
              >
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", s.bg)}>
                  <s.icon size={14} className={s.color} />
                </div>
                <p className="text-[11px] text-gray-400">{s.label}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Topup */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Topup Amount
              </span>
              {!editingTopup && (
                <button
                  onClick={() => setEditingTopup(true)}
                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                >
                  <Pencil size={11} /> Edit
                </button>
              )}
            </div>
            {editingTopup ? (
              <InlineTopup
                accountId={account.id}
                currentValue={currentTopup}
                currency={account.currency}
                onSave={(v) => { setCurrentTopup(v); setEditingTopup(false); }}
                onCancel={() => setEditingTopup(false)}
              />
            ) : (
              <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                {currentTopup > 0
                  ? formatCurrency(currentTopup, account.currency)
                  : <span className="text-gray-400 font-normal text-sm">Not set — click Edit to add</span>}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={11} /> Notes
              </span>
              {!editingNotes ? (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                >
                  <Pencil size={11} /> {notes ? "Edit" : "Add note"}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={saveNotes}
                    disabled={savingNotes}
                    className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                  >
                    <Save size={11} /> Save
                  </button>
                  <button
                    onClick={() => setEditingNotes(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {editingNotes ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this account..."
                rows={3}
                className="w-full text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200 placeholder-gray-400 resize-none"
              />
            ) : (
              <p className={cn(
                "text-sm",
                notes ? "text-gray-700 dark:text-gray-300" : "text-gray-400 italic"
              )}>
                {notes || "No notes"}
              </p>
            )}
          </div>

          {/* Meta info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5">
                <CreditCard size={13} /> Account ID
              </span>
              <span className="font-mono text-xs text-gray-600 dark:text-gray-300">
                {account.account_id}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5">
                <TrendingUp size={13} /> Currency
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {account.currency}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Bell size={13} /> Alert Status
              </span>
              {account.alert_sent ? (
                <span className="text-orange-500 font-medium flex items-center gap-1">
                  <Bell size={12} /> Sent — awaiting topup
                </span>
              ) : (
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <BellOff size={12} /> Ready to alert
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5">
                <RefreshCw size={13} /> Last Synced
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                {formatDate(account.last_synced_at)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Calendar size={13} /> Added
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                {formatDate(account.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 space-y-2 mt-auto">
          {account.alert_sent && (
            <button
              onClick={() => { onTopupComplete(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              <CheckCircle size={16} />
              Topup Completed — Re-enable Alerts
            </button>
          )}

          {/* Sync + Toggle row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center justify-center gap-2 btn-secondary py-2.5 text-sm font-medium"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
            <button
              onClick={handleToggle}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl border transition-colors",
                isActive
                  ? "border-red-200 dark:border-red-800/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  : "border-emerald-200 dark:border-emerald-800/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              )}
            >
              <Power size={14} />
              {isActive ? "Deactivate" : "Activate"}
            </button>
          </div>

          <button
            onClick={() => { onEdit(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 btn-secondary py-3 text-sm font-semibold"
          >
            <Edit2 size={15} />
            Edit All Settings
          </button>
        </div>
      </div>
    </>
  );
}
