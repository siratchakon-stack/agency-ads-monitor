import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const DEMO_HISTORY = [
  { id: "s1", sync_type: "cron", accounts_synced: 12, alerts_sent: 0, status: "completed", started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 8000).toISOString() },
  { id: "s2", sync_type: "manual", accounts_synced: 12, alerts_sent: 2, status: "completed", started_at: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(), completed_at: new Date(Date.now() - 3.5 * 60 * 60 * 1000 + 6500).toISOString() },
  { id: "s3", sync_type: "cron", accounts_synced: 12, alerts_sent: 1, status: "completed", started_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), completed_at: new Date(Date.now() - 4 * 60 * 60 * 1000 + 9200).toISOString() },
  { id: "s4", sync_type: "cron", accounts_synced: 11, alerts_sent: 0, status: "completed", started_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), completed_at: new Date(Date.now() - 6 * 60 * 60 * 1000 + 7800).toISOString() },
  { id: "s5", sync_type: "cron", accounts_synced: 0, alerts_sent: 0, status: "failed", errors: "Meta API rate limit exceeded", started_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), completed_at: new Date(Date.now() - 8 * 60 * 60 * 1000 + 1200).toISOString() },
  { id: "s6", sync_type: "cron", accounts_synced: 12, alerts_sent: 0, status: "completed", started_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), completed_at: new Date(Date.now() - 10 * 60 * 60 * 1000 + 8100).toISOString() },
];

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (userId === "demo-user-id") {
    return NextResponse.json({ data: DEMO_HISTORY });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sync_logs")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
