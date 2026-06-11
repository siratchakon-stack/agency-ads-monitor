"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, X, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

interface Step {
  id: string;
  title: string;
  desc: string;
  link?: { label: string; href: string };
  check: () => Promise<boolean>;
}

const STEPS: Step[] = [
  {
    id: "facebook",
    title: "Connect Facebook Account",
    desc: "Login with your agency Facebook account to fetch ad accounts",
    check: async () => {
      const r = await fetch("/api/settings");
      const d = await r.json();
      return !!d.data?.name;
    },
  },
  {
    id: "accounts",
    title: "Ad Accounts Loaded",
    desc: "At least one Facebook ad account is synced",
    check: async () => {
      const r = await fetch("/api/ad-accounts");
      const d = await r.json();
      return Array.isArray(d.data) && d.data.length > 0;
    },
  },
  {
    id: "topup",
    title: "Set First Topup Amount",
    desc: "Enter topup amount for at least one account to calculate remaining balance",
    check: async () => {
      const r = await fetch("/api/ad-accounts");
      const d = await r.json();
      return Array.isArray(d.data) && d.data.some((a: { topup_amount: number }) => a.topup_amount > 0);
    },
  },
  {
    id: "line",
    title: "Configure LINE Token",
    desc: "Add your LINE Channel Access Token to receive low balance alerts",
    link: { label: "LINE Developers Console →", href: "https://developers.line.biz/console/" },
    check: async () => {
      const r = await fetch("/api/settings");
      const d = await r.json();
      return !!d.data?.line_token;
    },
  },
  {
    id: "sync",
    title: "Run First Sync",
    desc: "Click Sync Now to fetch latest spend data from Meta API",
    check: async () => {
      const r = await fetch("/api/sync/history");
      const d = await r.json();
      return Array.isArray(d.data) && d.data.length > 0;
    },
  },
];

export default function OnboardingChecklist() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("onboarding_dismissed");
    if (saved === "true") { setDismissed(true); return; }

    Promise.all(
      STEPS.map(async (step) => {
        try {
          const done = await step.check();
          return [step.id, done] as [string, boolean];
        } catch {
          return [step.id, false] as [string, boolean];
        }
      })
    ).then((results) => {
      const map = Object.fromEntries(results);
      setChecks(map);
      // Auto-collapse if all done
      if (Object.values(map).every(Boolean)) setCollapsed(true);
    }).finally(() => setLoading(false));
  }, []);

  const dismiss = () => {
    localStorage.setItem("onboarding_dismissed", "true");
    setDismissed(true);
  };

  const doneCount = Object.values(checks).filter(Boolean).length;
  const allDone = doneCount === STEPS.length;

  if (dismissed || (loading && Object.keys(checks).length === 0)) return null;

  return (
    <div className={cn(
      "mx-6 mt-4 border rounded-xl overflow-hidden transition-all",
      allDone
        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
            allDone ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"
          )}>
            {allDone ? "✓" : `${doneCount}/${STEPS.length}`}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">
              {allDone ? "🎉 Setup complete!" : "Setup Checklist"}
            </p>
            <p className="text-xs text-gray-500">
              {allDone ? "Your agency dashboard is ready" : `${STEPS.length - doneCount} step${STEPS.length - doneCount > 1 ? "s" : ""} remaining`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/50">
          {STEPS.map((step) => {
            const done = checks[step.id];
            return (
              <div key={step.id} className="flex items-start gap-3 px-4 py-3">
                {done
                  ? <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  : <Circle size={18} className="text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    done ? "text-gray-400 line-through" : "text-gray-800 dark:text-gray-200"
                  )}>
                    {step.title}
                  </p>
                  {!done && (
                    <>
                      <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                      {step.link && (
                        <a
                          href={step.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                        >
                          {step.link.label} <ExternalLink size={10} />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
