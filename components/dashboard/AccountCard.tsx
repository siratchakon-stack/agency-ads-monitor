"use client";

import { AdAccount } from "@/types";
import {
  getAccountStatus,
  getStatusBadgeClass,
  getStatusLabel,
  formatCurrency,
  timeAgo,
  cn,
} from "@/lib/utils/helpers";
import { Edit2, CheckCircle, AlertCircle } from "lucide-react";
import BalanceBar from "./BalanceBar";

interface AccountCardProps {
  account: AdAccount;
  onEdit: () => void;
  onTopupComplete: () => void;
}

export default function AccountCard({ account, onEdit, onTopupComplete }: AccountCardProps) {
  const status = getAccountStatus(account);

  const borderColor =
    status === "critical"
      ? "border-l-red-500"
      : status === "warning"
      ? "border-l-yellow-400"
      : status === "inactive"
      ? "border-l-gray-300"
      : "border-l-emerald-500";

  return (
    <div
      className={cn(
        "card p-4 border-l-4 transition-shadow hover:shadow-md",
        borderColor
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
            {account.client_name || (
              <span className="text-gray-400 font-normal italic">No client name</span>
            )}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{account.ad_account_name}</p>
          <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">
            ID: {account.account_id}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn("badge text-xs", getStatusBadgeClass(status))}>
            {getStatusLabel(status)}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
          <p className="text-[10px] text-gray-400 mb-0.5">Spend Today</p>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 tabular-nums">
            {formatCurrency(account.spend_today, account.currency)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
          <p className="text-[10px] text-gray-400 mb-0.5">Topup</p>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 tabular-nums">
            {account.topup_amount > 0
              ? formatCurrency(account.topup_amount, account.currency)
              : <span className="text-gray-400 font-normal">—</span>}
          </p>
        </div>
        <div
          className={cn(
            "rounded-lg p-2 text-center",
            status === "critical"
              ? "bg-red-50 dark:bg-red-950/30"
              : status === "warning"
              ? "bg-yellow-50 dark:bg-yellow-950/30"
              : "bg-gray-50 dark:bg-gray-800"
          )}
        >
          <p className="text-[10px] text-gray-400 mb-0.5">Remaining</p>
          <p
            className={cn(
              "text-xs font-bold tabular-nums",
              status === "critical"
                ? "text-red-600 dark:text-red-400"
                : status === "warning"
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-gray-800 dark:text-gray-200"
            )}
          >
            {account.topup_amount > 0
              ? formatCurrency(account.remaining_balance, account.currency)
              : <span className="text-gray-400 font-normal">—</span>}
          </p>
        </div>
      </div>

      {/* Balance bar */}
      {account.topup_amount > 0 && (
        <div className="mb-3">
          <BalanceBar
            topupAmount={account.topup_amount}
            totalSpend={account.total_spend}
            threshold={account.threshold}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          Updated {timeAgo(account.last_synced_at)}
        </span>
        <div className="flex items-center gap-1">
          {account.alert_sent && (
            <button
              onClick={onTopupComplete}
              className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors"
            >
              <CheckCircle size={11} />
              Topup Done
            </button>
          )}
          {status === "critical" && !account.alert_sent && (
            <span className="flex items-center gap-1 text-[11px] text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-lg">
              <AlertCircle size={11} />
              Alert pending
            </span>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-1"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
