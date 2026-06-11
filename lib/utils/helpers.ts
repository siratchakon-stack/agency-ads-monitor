import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AdAccount, AccountStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// Account Status Logic
// ============================================

export function getAccountStatus(
  account: AdAccount,
  warningThreshold = 3000
): AccountStatus {
  if (account.account_status !== 1) return "inactive";
  if (account.topup_amount === 0) return "normal";

  const remaining = account.remaining_balance;

  if (remaining < account.threshold) return "critical";
  if (remaining < warningThreshold) return "warning";
  return "normal";
}

export function getStatusColor(status: AccountStatus): string {
  switch (status) {
    case "critical":
      return "text-red-500";
    case "warning":
      return "text-yellow-500";
    case "inactive":
      return "text-gray-400";
    default:
      return "text-green-500";
  }
}

export function getStatusBadgeClass(status: AccountStatus): string {
  switch (status) {
    case "critical":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "warning":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "inactive":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    default:
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  }
}

export function getStatusLabel(status: AccountStatus): string {
  switch (status) {
    case "critical":
      return "Critical";
    case "warning":
      return "Warning";
    case "inactive":
      return "Inactive";
    default:
      return "Normal";
  }
}

// ============================================
// Number Formatting
// ============================================

export function formatCurrency(
  amount: number,
  currency = "THB",
  locale = "th-TH"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("th-TH").format(num);
}

// ============================================
// Date Formatting
// ============================================

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ============================================
// Account ID normalization
// ============================================

export function normalizeAccountId(accountId: string): string {
  return accountId.replace(/^act_/, "");
}
