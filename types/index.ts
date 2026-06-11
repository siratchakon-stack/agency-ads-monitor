// ============================================
// Agency Ads Balance Monitor - Types
// ============================================

export interface User {
  id: string;
  facebook_id: string;
  name: string;
  email?: string;
  picture_url?: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  line_token?: string;
  alert_threshold: number;
  warning_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface AdAccount {
  id: string;
  user_id: string;
  account_id: string;
  client_name: string;
  ad_account_name: string;
  platform: string;
  currency: string;
  account_status: number;
  spend_today: number;
  total_spend: number;
  topup_amount: number;
  remaining_balance: number;
  threshold: number;
  alert_sent: boolean;
  is_active: boolean;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  ad_account_id: string;
  user_id: string;
  message: string;
  remaining_balance?: number;
  notification_type: string;
  sent_at: string;
  status: "sent" | "failed" | "pending";
  created_at: string;
  ad_accounts?: AdAccount;
}

export interface SyncLog {
  id: string;
  user_id?: string;
  sync_type: "cron" | "manual";
  accounts_synced: number;
  alerts_sent: number;
  errors?: string;
  started_at: string;
  completed_at?: string;
  status: "running" | "completed" | "failed";
}

export type AccountStatus = "normal" | "warning" | "critical" | "inactive";

export interface DashboardStats {
  totalAccounts: number;
  activeAccounts: number;
  nearLimitAccounts: number;
  criticalAccounts: number;
  warningAccounts: number;
  totalSpendToday: number;
  lastSyncTime?: string;
}

export interface FacebookAdAccount {
  id: string;
  name: string;
  currency: string;
  account_status: number;
  spend_cap?: string;
}

export interface MetaInsight {
  spend: string;
  date_start: string;
  date_stop: string;
}

export interface SyncResult {
  success: boolean;
  accountsSynced: number;
  alertsSent: number;
  error?: string;
}

export interface LineNotificationPayload {
  clientName: string;
  adAccountName: string;
  remainingBalance: number;
  currency: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface UpdateTopupPayload {
  topup_amount: number;
  client_name?: string;
  threshold?: number;
}

export interface Settings {
  line_token: string;
  alert_threshold: number;
  warning_threshold: number;
}
