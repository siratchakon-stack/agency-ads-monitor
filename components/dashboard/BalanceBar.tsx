"use client";

import { cn } from "@/lib/utils/helpers";

interface BalanceBarProps {
  topupAmount: number;
  totalSpend: number;
  threshold: number;
  warningThreshold?: number;
}

export default function BalanceBar({
  topupAmount,
  totalSpend,
  threshold,
  warningThreshold = 3000,
}: BalanceBarProps) {
  if (topupAmount <= 0) return null;

  const remaining = topupAmount - totalSpend;
  const pct = Math.max(0, Math.min(100, (remaining / topupAmount) * 100));

  const color =
    remaining < threshold
      ? "bg-red-500"
      : remaining < warningThreshold
      ? "bg-yellow-400"
      : "bg-green-500";

  return (
    <div className="w-full">
      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
