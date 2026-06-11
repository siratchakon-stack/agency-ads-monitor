import { NextRequest, NextResponse } from "next/server";
import { syncAllAccounts } from "@/lib/utils/sync";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Log sync start
  const { data: syncLog } = await supabase
    .from("sync_logs")
    .insert({
      user_id: userId,
      sync_type: "manual",
      status: "running",
    })
    .select()
    .single();

  const result = await syncAllAccounts(userId);

  // Update sync log
  if (syncLog) {
    await supabase
      .from("sync_logs")
      .update({
        accounts_synced: result.accountsSynced,
        alerts_sent: result.alertsSent,
        errors: result.error,
        completed_at: new Date().toISOString(),
        status: result.success ? "completed" : "failed",
      })
      .eq("id", syncLog.id);
  }

  return NextResponse.json({
    success: result.success,
    accountsSynced: result.accountsSynced,
    alertsSent: result.alertsSent,
    error: result.error,
  });
}
