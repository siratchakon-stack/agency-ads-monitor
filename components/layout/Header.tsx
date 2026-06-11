"use client";

import { RefreshCw, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showSync?: boolean;
  onSyncComplete?: () => void;
}

export default function Header({
  title,
  subtitle,
  showSync = false,
  onSyncComplete,
}: HeaderProps) {
  const [syncing, setSyncing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(!darkMode);
  };

  const handleSync = async () => {
    setSyncing(true);
    const toastId = toast.loading("Syncing all accounts...");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Synced ${data.accountsSynced} accounts · ${data.alertsSent} alerts sent`,
          { id: toastId }
        );
        onSyncComplete?.();
      } else {
        toast.error(data.error || "Sync failed", { id: toastId });
      }
    } catch {
      toast.error("Sync failed", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? (
              <Sun size={18} className="text-gray-500" />
            ) : (
              <Moon size={18} className="text-gray-500" />
            )}
          </button>

          {/* Sync Button */}
          {showSync && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <RefreshCw
                size={15}
                className={syncing ? "animate-spin" : ""}
              />
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
