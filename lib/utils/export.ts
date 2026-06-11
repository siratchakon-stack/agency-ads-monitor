import { AdAccount } from "@/types";
import { getAccountStatus, getStatusLabel } from "./helpers";

export function exportAccountsToCSV(accounts: AdAccount[]): void {
  const headers = [
    "Client Name",
    "Ad Account Name",
    "Account ID",
    "Platform",
    "Currency",
    "Spend Today",
    "Total Spend",
    "Topup Amount",
    "Remaining Balance",
    "Alert Threshold",
    "Status",
    "Alert Sent",
    "Last Synced",
  ];

  const rows = accounts.map((a) => {
    const status = getAccountStatus(a);
    return [
      a.client_name || "",
      a.ad_account_name,
      a.account_id,
      a.platform,
      a.currency,
      a.spend_today.toFixed(2),
      a.total_spend.toFixed(2),
      a.topup_amount.toFixed(2),
      a.remaining_balance.toFixed(2),
      a.threshold.toFixed(2),
      getStatusLabel(status),
      a.alert_sent ? "Yes" : "No",
      a.last_synced_at ? new Date(a.last_synced_at).toLocaleString("th-TH") : "Never",
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ad-accounts-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
