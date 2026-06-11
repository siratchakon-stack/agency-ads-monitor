"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import { Notification } from "@/types";
import { Bell, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { cn, formatDate, formatCurrency } from "@/lib/utils/helpers";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?limit=${LIMIT}&offset=${page * LIMIT}`);
      const data = await res.json();
      if (data.data) setNotifications(data.data);
      if (data.total !== undefined) setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const sent = notifications.filter((n) => n.status === "sent").length;
  const failed = notifications.filter((n) => n.status === "failed").length;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Notifications" subtitle="LINE alert history" />

      <div className="p-6 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Alerts", value: total, icon: Bell, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
            { label: "Sent", value: loading ? "—" : sent, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
            { label: "Failed", value: loading ? "—" : failed, icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
          ].map((s) => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Alerts are sent via <strong>LINE Messaging API</strong> when account balance drops below threshold.
            After topping up, click <strong>"Topup Done"</strong> on the account to re-enable future alerts.
          </p>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4 flex gap-3">
                <div className="skeleton w-9 h-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-48 rounded" />
                  <div className="skeleton h-3 w-64 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Alerts will appear here when account balances drop below threshold
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const acct = n.ad_accounts as unknown as { client_name?: string; ad_account_name: string } | undefined;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "card p-4 flex items-start gap-3 transition-all",
                    n.status === "failed" && "border-red-200 dark:border-red-900/50"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    n.status === "sent" ? "bg-emerald-50 dark:bg-emerald-950/30"
                      : n.status === "failed" ? "bg-red-50 dark:bg-red-950/30"
                      : "bg-yellow-50 dark:bg-yellow-950/30"
                  )}>
                    <Bell size={16} className={
                      n.status === "sent" ? "text-emerald-600"
                        : n.status === "failed" ? "text-red-500"
                        : "text-yellow-600"
                    } />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                          {acct?.client_name || acct?.ad_account_name || "Unknown Account"}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5 text-xs">{n.message}</p>
                      </div>
                      <span className={cn(
                        "badge text-xs flex-shrink-0 flex items-center gap-1",
                        n.status === "sent" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : n.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                          : "bg-yellow-100 text-yellow-700"
                      )}>
                        {n.status === "sent" && <CheckCircle size={10} />}
                        {n.status === "failed" && <XCircle size={10} />}
                        {n.status === "pending" && <Clock size={10} />}
                        {n.status}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-3 mt-2">
                      {n.remaining_balance != null && (
                        <span className="text-xs flex items-center gap-1 text-gray-400">
                          <TrendingUp size={10} />
                          Balance:{" "}
                          <span className="font-semibold text-red-500">
                            {formatCurrency(n.remaining_balance, "THB")}
                          </span>
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {formatDate(n.sent_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex justify-center gap-2 pt-4">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-secondary text-sm px-4">
                  ← Previous
                </button>
                <span className="flex items-center text-sm text-gray-500 px-4">
                  {page + 1} / {Math.ceil(total / LIMIT)}
                </span>
                <button onClick={() => setPage(page + 1)} disabled={(page + 1) * LIMIT >= total} className="btn-secondary text-sm px-4">
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
