"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import {
  Settings,
  MessageCircle,
  Bell,
  Shield,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Send,
  RefreshCw,
  Clock,
  XCircle,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatDate } from "@/lib/utils/helpers";

interface UserSettings {
  name: string;
  email?: string;
  picture_url?: string;
  line_token?: string;
  alert_threshold: number;
  warning_threshold: number;
  created_at: string;
  token_expires_at?: string;
}

interface SyncLog {
  id: string;
  sync_type: "cron" | "manual";
  accounts_synced: number;
  alerts_sent: number;
  errors?: string;
  status: "completed" | "failed" | "running";
  started_at: string;
  completed_at?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [lineToken, setLineToken] = useState("");
  const [lineUserId, setLineUserId] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("1500");
  const [warningThreshold, setWarningThreshold] = useState("3000");

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/sync/history").then((r) => r.json()),
    ]).then(([settingsData, syncData]) => {
      if (settingsData.data) {
        setSettings(settingsData.data);
        setLineToken(settingsData.data.line_token || "");
        setAlertThreshold(String(settingsData.data.alert_threshold || 1500));
        setWarningThreshold(String(settingsData.data.warning_threshold || 3000));
      }
      if (syncData.data) setSyncLogs(syncData.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_token: lineToken || undefined,
          alert_threshold: parseInt(alertThreshold),
          warning_threshold: parseInt(warningThreshold),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Settings saved successfully");
        setSettings(data.data);
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestLine = async () => {
    if (!lineToken) {
      toast.error("Enter LINE token first");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/line/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_token: lineToken, line_user_id: lineUserId || lineToken }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Test message sent to LINE!");
      } else {
        toast.error(data.error || "Failed to send test");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setTesting(false);
    }
  };

  const tokenStatus = settings?.line_token ? "connected" : "not_connected";

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Settings" />
        <div className="p-6 space-y-4 max-w-2xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-5 w-32 rounded mb-4" />
              <div className="skeleton h-10 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Settings" subtitle="Configure monitoring preferences" />

      <div className="p-6 grid lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          {/* Profile Card */}
          <div className="card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <Shield size={16} className="text-blue-600" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white">Account</h2>
            </div>
            <div className="flex items-center gap-4">
              {settings?.picture_url ? (
                <img src={settings.picture_url} alt={settings.name}
                  className="w-14 h-14 rounded-full border-2 border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{settings?.name?.[0]?.toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{settings?.name}</p>
                {settings?.email && <p className="text-sm text-gray-500">{settings.email}</p>}
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle size={10} className="text-blue-500" />
                  Connected via Facebook
                </p>
              </div>
            </div>
          </div>

          {/* LINE Configuration */}
          <div className="card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                <MessageCircle size={16} className="text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">LINE Messaging API</h2>
                <p className="text-xs text-gray-500">Alert notifications via LINE</p>
              </div>
              <div className="ml-auto">
                {tokenStatus === "connected" ? (
                  <span className="badge bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle size={10} /> Connected
                  </span>
                ) : (
                  <span className="badge bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 flex items-center gap-1">
                    <AlertTriangle size={10} /> Not Set
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Channel Access Token</label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={lineToken}
                    onChange={(e) => setLineToken(e.target.value)}
                    placeholder="Paste your LINE Channel Access Token"
                    className="input pr-10 font-mono text-xs"
                  />
                  <button type="button" onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Get from{" "}
                  <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer"
                    className="text-blue-500 hover:underline">LINE Developers Console</a>
                </p>
              </div>

              <div>
                <label className="label">LINE User ID (to receive alerts)</label>
                <input
                  type="text"
                  value={lineUserId}
                  onChange={(e) => setLineUserId(e.target.value)}
                  placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="input font-mono text-xs"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Find in LINE Official Account Manager → Basic info
                </p>
              </div>

              {/* Test Button */}
              <button
                onClick={handleTestLine}
                disabled={testing || !lineToken}
                className="w-full flex items-center justify-center gap-2 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 font-medium py-2.5 rounded-xl transition-colors disabled:opacity-40 text-sm"
              >
                {testing ? (
                  <><RefreshCw size={14} className="animate-spin" /> Sending test...</>
                ) : (
                  <><Send size={14} /> Send Test Notification</>
                )}
              </button>
            </div>
          </div>

          {/* Alert Thresholds */}
          <div className="card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 flex items-center justify-center">
                <Bell size={16} className="text-yellow-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Alert Thresholds</h2>
                <p className="text-xs text-gray-500">Balance limits for notifications</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  Critical Threshold (THB) — triggers LINE alert
                </label>
                <input type="number" value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)} min="0" className="input" />
              </div>
              <div>
                <label className="label flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                  Warning Threshold (THB) — yellow on dashboard
                </label>
                <input type="number" value={warningThreshold}
                  onChange={(e) => setWarningThreshold(e.target.value)} min="0" className="input" />
              </div>

              {/* Visual thresholds */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-2">
                {[
                  { label: `≥ ${Number(warningThreshold).toLocaleString()} THB`, status: "Normal", dot: "bg-emerald-500" },
                  { label: `${Number(alertThreshold).toLocaleString()} – ${Number(warningThreshold).toLocaleString()} THB`, status: "Warning", dot: "bg-yellow-400" },
                  { label: `< ${Number(alertThreshold).toLocaleString()} THB`, status: "🔔 Alert via LINE", dot: "bg-red-500" },
                ].map((item) => (
                  <div key={item.status} className="flex items-center gap-2.5 text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.dot}`} />
                    <span className="text-gray-400 w-40">{item.label}</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold">
            <Settings size={15} />
            {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>

        {/* RIGHT COLUMN — Sync History */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
              <Activity size={16} className="text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">Sync History</h2>
              <p className="text-xs text-gray-500">Last 20 sync operations</p>
            </div>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {syncLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No sync history</div>
            ) : (
              syncLogs.map((log) => {
                const duration = log.completed_at
                  ? ((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000).toFixed(1)
                  : null;

                return (
                  <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                      log.status === "completed" ? "bg-emerald-50 dark:bg-emerald-950/30"
                        : log.status === "failed" ? "bg-red-50 dark:bg-red-950/30"
                        : "bg-blue-50 dark:bg-blue-950/30"
                    )}>
                      {log.status === "completed" ? <CheckCircle size={15} className="text-emerald-600" />
                        : log.status === "failed" ? <XCircle size={15} className="text-red-500" />
                        : <RefreshCw size={15} className="text-blue-500 animate-spin" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "badge text-[10px]",
                            log.sync_type === "cron"
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                          )}>
                            {log.sync_type === "cron" ? "⏱ Cron" : "👆 Manual"}
                          </span>
                          {log.alerts_sent > 0 && (
                            <span className="badge bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 text-[10px]">
                              🔔 {log.alerts_sent} alert{log.alerts_sent > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {formatDate(log.started_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <RefreshCw size={10} />
                          {log.accounts_synced} accounts
                        </span>
                        {duration && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {duration}s
                          </span>
                        )}
                      </div>

                      {log.errors && (
                        <p className="text-[10px] text-red-500 mt-1 truncate">{log.errors}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
