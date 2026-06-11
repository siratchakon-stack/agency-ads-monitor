"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AdAccount } from "@/types";

interface SpendChartProps {
  accounts: AdAccount[];
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl text-xs">
        <p className="font-semibold text-white mb-1 max-w-[140px] truncate">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-gray-300">
            {entry.name}:{" "}
            <span className="text-white font-medium">
              ฿{Number(entry.value).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SpendChart({ accounts }: SpendChartProps) {
  const top8 = [...accounts]
    .filter((a) => a.spend_today > 0)
    .sort((a, b) => b.spend_today - a.spend_today)
    .slice(0, 8)
    .map((a) => ({
      name: a.client_name || a.ad_account_name.split(" - ")[0],
      spend: Number(a.spend_today),
      remaining: Number(a.remaining_balance),
      isCritical: a.topup_amount > 0 && a.remaining_balance < a.threshold,
      isWarning: a.topup_amount > 0 && a.remaining_balance < 3000 && a.remaining_balance >= a.threshold,
    }));

  if (top8.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        No spend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={top8} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          interval={0}
          width={60}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            v >= 1000 ? `฿${(v / 1000).toFixed(0)}k` : `฿${v}`
          }
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="spend" name="Spend Today" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {top8.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.isCritical
                  ? "#ef4444"
                  : entry.isWarning
                  ? "#eab308"
                  : "#3b82f6"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
