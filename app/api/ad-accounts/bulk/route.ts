import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// POST /api/ad-accounts/bulk
// body: { ids: string[], action: "reset_alerts" | "set_threshold", value?: number }
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { ids, action, value } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No account IDs provided" }, { status: 400 });
  }

  // Demo mode
  if (userId === "demo-user-id") {
    return NextResponse.json({
      success: true,
      updated: ids.length,
      message: `Demo: ${action} applied to ${ids.length} accounts`,
    });
  }

  const supabase = createServiceClient();

  let updates: Record<string, unknown> = {};

  if (action === "reset_alerts") {
    updates = { alert_sent: false };
  } else if (action === "set_threshold" && value !== undefined) {
    updates = { threshold: value };
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error, count } = await supabase
    .from("ad_accounts")
    .update(updates)
    .in("id", ids)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    updated: count,
    message: `${action} applied to ${count} accounts`,
  });
}
