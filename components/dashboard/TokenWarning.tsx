"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X, ExternalLink } from "lucide-react";

export default function TokenWarning() {
  const [show, setShow] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const expiresAt = d.data?.token_expires_at;
        if (!expiresAt) return;
        const diff = new Date(expiresAt).getTime() - Date.now();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days <= 7) { setDaysLeft(days); setShow(true); }
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div className="mx-6 mt-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 rounded-xl p-3 flex items-center gap-3">
      <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
      <div className="flex-1 text-sm">
        <span className="font-semibold text-amber-800 dark:text-amber-300">
          Facebook token expires in {daysLeft <= 0 ? "less than 1 day" : `${daysLeft} day${daysLeft > 1 ? "s" : ""}`}
        </span>
        <span className="text-amber-600 dark:text-amber-400 ml-2">
          — Re-login to refresh your access token
        </span>
      </div>
      <a
        href="/login"
        className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline flex-shrink-0"
      >
        Re-login <ExternalLink size={11} />
      </a>
      <button
        onClick={() => setShow(false)}
        className="p-1 text-amber-400 hover:text-amber-600 flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
