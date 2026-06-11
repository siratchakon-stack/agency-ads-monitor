import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchAccountSpend } from "@/lib/facebook/api";
import { sendLineNotification } from "@/lib/line/api";
import { cookies } from "next/headers";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Demo mode
  if (userId === "demo-user-id") {
    return NextResponse.json({
      success: true,
      message: "Demo: account synced (mock data)",
      spendToday: Math.random() * 5000,
      totalSpend: Math.random() * 50000,
    });
  }

  const supabase = createServiceClient();

  // Get account + user token
  const { data: account } = await supabase
    .from("ad_accounts")
    .select("*, users(access_token, line_token, alert_threshold)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const user = account.users as { access_token: string; line_token?: string };
  const { spendToday, totalSpend } = await fetchAccountSpend(
    account.account_id,
    user.access_token
  );

  const { error } = await supabase
    .from("ad_accounts")
    .update({
      spend_today: spendToday,
      total_spend: totalSpend,
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check alert
  const remaining = account.topup_amount - totalSpend;
  if (remaining < account.threshold && !account.alert_sent && account.topup_amount > 0 && user.line_token) {
    await sendLineNotification(user.line_token, user.line_token, {
      clientName: account.client_name || account.ad_account_name,
      adAccountName: account.ad_account_name,
      remainingBalance: remaining,
      currency: account.currency,
    });
    await supabase.from("ad_accounts").update({ alert_sent: true }).eq("id", id);
  }

  return NextResponse.json({ success: true, spendToday, totalSpend });
}
