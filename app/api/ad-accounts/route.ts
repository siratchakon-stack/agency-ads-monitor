import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const now = new Date().toISOString();
const DEMO_ACCOUNTS = [
  { id: "1", user_id: "demo-user-id", account_id: "act_111111111", client_name: "บริษัท ABC จำกัด", ad_account_name: "ABC - Main Campaign", platform: "facebook", currency: "THB", account_status: 1, spend_today: 3200.50, total_spend: 47800.00, topup_amount: 50000, remaining_balance: 2200.00, threshold: 1500, alert_sent: false, is_active: true, last_synced_at: now, created_at: now, updated_at: now },
  { id: "2", user_id: "demo-user-id", account_id: "act_222222222", client_name: "ร้าน XYZ", ad_account_name: "XYZ Shop - Retargeting", platform: "facebook", currency: "THB", account_status: 1, spend_today: 1850.00, total_spend: 29200.00, topup_amount: 30000, remaining_balance: 800.00, threshold: 1500, alert_sent: true, is_active: true, last_synced_at: now, created_at: now, updated_at: now },
  { id: "3", user_id: "demo-user-id", account_id: "act_333333333", client_name: "The Brand Co.", ad_account_name: "TheBrand - Awareness", platform: "facebook", currency: "THB", account_status: 1, spend_today: 5100.25, total_spend: 18900.00, topup_amount: 20000, remaining_balance: 1100.00, threshold: 1500, alert_sent: true, is_active: true, last_synced_at: now, created_at: now, updated_at: now },
  { id: "4", user_id: "demo-user-id", account_id: "act_444444444", client_name: "Startup DEF", ad_account_name: "DEF - Lead Gen", platform: "facebook", currency: "THB", account_status: 1, spend_today: 4200.00, total_spend: 72100.00, topup_amount: 80000, remaining_balance: 7900.00, threshold: 1500, alert_sent: false, is_active: true, last_synced_at: now, created_at: now, updated_at: now },
  { id: "5", user_id: "demo-user-id", account_id: "act_555555555", client_name: "Fashion GHI", ad_account_name: "GHI Fashion - Sale", platform: "facebook", currency: "THB", account_status: 1, spend_today: 6800.00, total_spend: 38500.00, topup_amount: 40000, remaining_balance: 1500.00, threshold: 1500, alert_sent: false, is_active: true, last_synced_at: now, created_at: now, updated_at: now },
  { id: "6", user_id: "demo-user-id", account_id: "act_666666666", client_name: "Food & Co.", ad_account_name: "FoodCo - Delivery Ads", platform: "facebook", currency: "THB", account_status: 1, spend_today: 2150.00, total_spend: 15300.00, topup_amount: 20000, remaining_balance: 4700.00, threshold: 1500, alert_sent: false, is_active: true, last_synced_at: now, created_at: now, updated_at: now },
  { id: "7", user_id: "demo-user-id", account_id: "act_777777777", client_name: "Tech Startup JKL", ad_account_name: "JKL Tech - App Install", platform: "facebook", currency: "THB", account_status: 1, spend_today: 1200.00, total_spend: 8800.00, topup_amount: 10000, remaining_balance: 1200.00, threshold: 1500, alert_sent: true, is_active: true, last_synced_at: now, created_at: now, updated_at: now },
  { id: "8", user_id: "demo-user-id", account_id: "act_888888888", client_name: "Beauty MNO", ad_account_name: "MNO Beauty - Catalog", platform: "facebook", currency: "THB", account_status: 1, spend_today: 3900.00, total_spend: 55200.00, topup_amount: 60000, remaining_balance: 4800.00, threshold: 1500, alert_sent: false, is_active: true, last_synced_at: now, created_at: now, updated_at: now },
  { id: "9", user_id: "demo-user-id", account_id: "act_999999999", client_name: "Auto PQR", ad_account_name: "PQR Auto - Video Ads", platform: "facebook", currency: "THB", account_status: 1, spend_today: 0, total_spend: 12400.00, topup_amount: 15000, remaining_balance: 2600.00, threshold: 1500, alert_sent: false, is_active: true, last_synced_at: now, created_at: now, updated_at: now },
  { id: "10", user_id: "demo-user-id", account_id: "act_101010101", client_name: "Travel STU", ad_account_name: "STU Travel - Booking", platform: "facebook", currency: "THB", account_status: 1, spend_today: 7200.00, total_spend: 93400.00, topup_amount: 100000, remaining_balance: 6600.00, threshold: 1500, alert_sent: false, is_active: true, last_synced_at: now, created_at: now, updated_at: now },
  { id: "11", user_id: "demo-user-id", account_id: "act_111212121", client_name: "Health VWX", ad_account_name: "VWX Health - Supplement", platform: "facebook", currency: "THB", account_status: 1, spend_today: 4500.00, total_spend: 27800.00, topup_amount: 30000, remaining_balance: 2200.00, threshold: 1500, alert_sent: false, is_active: true, last_synced_at: now, created_at: now, updated_at: now },
  { id: "12", user_id: "demo-user-id", account_id: "act_121314151", client_name: "Education YZ", ad_account_name: "YZ Education - Course", platform: "facebook", currency: "THB", account_status: 2, spend_today: 0, total_spend: 5100.00, topup_amount: 0, remaining_balance: 0, threshold: 1500, alert_sent: false, is_active: false, last_synced_at: now, created_at: now, updated_at: now },
];

// GET /api/ad-accounts - list all ad accounts
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (userId === "demo-user-id") {
    return NextResponse.json({ data: DEMO_ACCOUNTS });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("ad_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("remaining_balance", { ascending: true });

  if (status === "critical") {
    query = query.lt("remaining_balance", 1500).gt("topup_amount", 0);
  } else if (status === "warning") {
    query = query
      .gte("remaining_balance", 1500)
      .lt("remaining_balance", 3000)
      .gt("topup_amount", 0);
  }

  if (search) {
    query = query.or(
      `ad_account_name.ilike.%${search}%,client_name.ilike.%${search}%,account_id.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
