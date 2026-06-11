import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const DEMO_STATS = {
  totalAccounts: 12,
  activeAccounts: 10,
  criticalAccounts: 2,
  warningAccounts: 3,
  nearLimitAccounts: 5,
  totalSpendToday: 28450.75,
  lastSyncTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
};

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (userId === "demo-user-id") {
    return NextResponse.json({ data: DEMO_STATS });
  }

  const supabase = createServiceClient();

  // Get all accounts
  const { data: accounts, error } = await supabase
    .from("ad_accounts")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user settings for thresholds
  const { data: user } = await supabase
    .from("users")
    .select("alert_threshold, warning_threshold")
    .eq("id", userId)
    .single();

  const alertThreshold = user?.alert_threshold || 1500;
  const warningThreshold = user?.warning_threshold || 3000;

  // Calculate stats
  const totalAccounts = accounts?.length || 0;
  const activeAccounts = accounts?.filter((a) => a.account_status === 1).length || 0;
  const criticalAccounts = accounts?.filter(
    (a) => a.topup_amount > 0 && a.remaining_balance < alertThreshold
  ).length || 0;
  const warningAccounts = accounts?.filter(
    (a) =>
      a.topup_amount > 0 &&
      a.remaining_balance >= alertThreshold &&
      a.remaining_balance < warningThreshold
  ).length || 0;
  const totalSpendToday = accounts?.reduce(
    (sum, a) => sum + parseFloat(a.spend_today || 0),
    0
  ) || 0;

  // Last sync time
  const lastSyncTime = accounts
    ?.map((a) => a.last_synced_at)
    .filter(Boolean)
    .sort()
    .pop();

  return NextResponse.json({
    data: {
      totalAccounts,
      activeAccounts,
      criticalAccounts,
      warningAccounts,
      nearLimitAccounts: criticalAccounts + warningAccounts,
      totalSpendToday,
      lastSyncTime,
    },
  });
}
