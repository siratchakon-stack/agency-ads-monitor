import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const DEMO_NOTIFICATIONS = [
  { id: "n1", ad_account_id: "2", user_id: "demo-user-id", message: "Low balance alert sent for XYZ Shop - Retargeting", remaining_balance: 800.00, notification_type: "low_balance", sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: "sent", created_at: new Date().toISOString(), ad_accounts: { ad_account_name: "XYZ Shop - Retargeting", client_name: "ร้าน XYZ" } },
  { id: "n2", ad_account_id: "3", user_id: "demo-user-id", message: "Low balance alert sent for TheBrand - Awareness", remaining_balance: 1100.00, notification_type: "low_balance", sent_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), status: "sent", created_at: new Date().toISOString(), ad_accounts: { ad_account_name: "TheBrand - Awareness", client_name: "The Brand Co." } },
  { id: "n3", ad_account_id: "7", user_id: "demo-user-id", message: "Low balance alert sent for JKL Tech - App Install", remaining_balance: 1200.00, notification_type: "low_balance", sent_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), status: "sent", created_at: new Date().toISOString(), ad_accounts: { ad_account_name: "JKL Tech - App Install", client_name: "Tech Startup JKL" } },
  { id: "n4", ad_account_id: "2", user_id: "demo-user-id", message: "Failed to send alert for XYZ Shop: LINE token not configured", remaining_balance: 850.00, notification_type: "low_balance", sent_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), status: "failed", created_at: new Date().toISOString(), ad_accounts: { ad_account_name: "XYZ Shop - Retargeting", client_name: "ร้าน XYZ" } },
];

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (userId === "demo-user-id") {
    return NextResponse.json({ data: DEMO_NOTIFICATIONS, total: DEMO_NOTIFICATIONS.length });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data, error, count } = await supabase
    .from("notifications")
    .select("*, ad_accounts(ad_account_name, client_name)", { count: "exact" })
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total: count });
}
