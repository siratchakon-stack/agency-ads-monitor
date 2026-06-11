"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

interface AutoRefreshProps {
  onRefresh: () => Promise<void> | void;
  intervalSeconds?: number;
}

export default function AutoRefresh({
  onRefresh,
  intervalSeconds = 300, // 5 minutes
}: AutoRefreshProps) {
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);
  const [running, setRunning] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setSecondsLeft(intervalSeconds);
    }
  }, [onRefresh, intervalSeconds]);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          doRefresh();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, doRefresh, intervalSeconds]);

  const togglePause = () => setRunning((r) => !r);

  const pct = ((intervalSeconds - secondsLeft) / intervalSeconds) * 100;

  const fmt = (s: number) => {
    if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${s}s`;
  };

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 select-none">
      {/* Ring progress */}
      <div className="relative w-7 h-7">
        <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
          <circle
            cx="14" cy="14" r="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="14" cy="14" r="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 11}`}
            strokeDashoffset={`${2 * Math.PI * 11 * (1 - pct / 100)}`}
            className={cn(
              "transition-all duration-1000",
              running ? "text-blue-500" : "text-gray-300"
            )}
            strokeLinecap="round"
          />
        </svg>
        <button
          onClick={togglePause}
          className="absolute inset-0 flex items-center justify-center hover:text-blue-600 transition-colors"
        >
          {running ? <Pause size={9} /> : <Play size={9} />}
        </button>
      </div>

      <span className={cn("font-medium tabular-nums", !running && "opacity-50")}>
        {refreshing ? (
          <span className="flex items-center gap-1 text-blue-500">
            <RefreshCw size={10} className="animate-spin" /> Syncing...
          </span>
        ) : (
          `Refresh in ${fmt(secondsLeft)}`
        )}
      </span>
    </div>
  );
}
