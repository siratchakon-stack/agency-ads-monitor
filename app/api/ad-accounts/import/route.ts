import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accounts } = await request.json();

  if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
    return NextResponse.json({ error: "No accounts provided" }, { status: 400 });
  }

  // Demo mode
  if (userId === "demo-user-id") {
    return NextResponse.json({
      imported: accounts.length,
      message: `Demo: ${accounts.length} accounts would be imported`,
    });
  }

  const supabase = createServiceClient();

  const toInsert = accounts
    .filter((a) => a.account_id)
    .map((a) => ({
      user_id: userId,
      account_id: String(a.account_id).replace(/^act_/, ""),
      client_name: a.client_name || "",
      ad_account_name: a.client_name || `Account ${a.account_id}`,
      topup_amount: parseFloat(a.topup_amount) || 0,
      threshold: parseFloat(a.threshold) || 1500,
      platform: "facebook",
      currency: "THB",
    }));

  const { error, count } = await supabase
    .from("ad_accounts")
    .upsert(toInsert, { onConflict: "user_id,account_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ imported: toInsert.length });
}
