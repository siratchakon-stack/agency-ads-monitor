import { NextRequest, NextResponse } from "next/server";
import { syncAllAccounts } from "@/lib/utils/sync";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Log sync start
  const { data: syncLog } = await supabase
    .from("sync_logs")
    .insert({
      sync_type: "cron",
      status: "running",
    })
    .select()
    .single();

  const result = await syncAllAccounts();

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
    timestamp: new Date().toISOString(),
  });
}
