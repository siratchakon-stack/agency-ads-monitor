import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendLineNotification } from "@/lib/line/api";
import { cookies } from "next/headers";

function buildWeeklyReport(
  accounts: Array<{
    client_name: string;
    ad_account_name: string;
    spend_today: number;
    total_spend: number;
    topup_amount: number;
    remaining_balance: number;
    threshold: number;
    currency: string;
  }>,
  totalSpend: number
): string {
  const critical = accounts.filter(
    (a) => a.topup_amount > 0 && a.remaining_balance < a.threshold
  );
  const warning = accounts.filter(
    (a) =>
      a.topup_amount > 0 &&
      a.remaining_balance >= a.threshold &&
      a.remaining_balance < 3000
  );

  const fmt = (n: number) =>
    n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let msg =
    `📊 Weekly Ads Budget Report\n` +
    `${"─".repeat(28)}\n\n` +
    `📅 Total Accounts: ${accounts.length}\n` +
    `💸 Total Spend Today: ${fmt(totalSpend)} THB\n\n`;

  if (critical.length > 0) {
    msg += `🔴 CRITICAL (${critical.length} accounts)\n`;
    critical.slice(0, 5).forEach((a) => {
      msg += `  • ${a.client_name || a.ad_account_name}\n`;
      msg += `    Remaining: ${fmt(a.remaining_balance)} THB\n`;
    });
    if (critical.length > 5) msg += `  ... and ${critical.length - 5} more\n`;
    msg += "\n";
  }

  if (warning.length > 0) {
    msg += `🟡 WARNING (${warning.length} accounts)\n`;
    warning.slice(0, 5).forEach((a) => {
      msg += `  • ${a.client_name || a.ad_account_name}\n`;
      msg += `    Remaining: ${fmt(a.remaining_balance)} THB\n`;
    });
    if (warning.length > 5) msg += `  ... and ${warning.length - 5} more\n`;
    msg += "\n";
  }

  if (critical.length === 0 && warning.length === 0) {
    msg += `✅ All accounts are healthy!\n\n`;
  }

  msg += `${"─".repeat(28)}\n`;
  msg += `Agency Ads Balance Monitor`;

  return msg;
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Demo mode
  if (userId === "demo-user-id") {
    return NextResponse.json({
      success: true,
      message: "Demo: Weekly report would be sent to LINE (no real token configured)",
    });
  }

  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("line_token, alert_threshold")
    .eq("id", userId)
    .single();

  if (!user?.line_token) {
    return NextResponse.json(
      { error: "LINE token not configured. Please set it in Settings." },
      { status: 400 }
    );
  }

  const { data: accounts } = await supabase
    .from("ad_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ error: "No accounts found" }, { status: 404 });
  }

  const totalSpend = accounts.reduce((s, a) => s + Number(a.spend_today), 0);
  const message = buildWeeklyReport(accounts, totalSpend);

  const result = await sendLineNotification(user.line_token, user.line_token, {
    clientName: "Weekly Report",
    adAccountName: "",
    remainingBalance: 0,
    currency: "THB",
  });

  // Send raw message directly
  const axios = (await import("axios")).default;
  try {
    await axios.post(
      "https://api.line.me/v2/bot/message/push",
      {
        to: user.line_token,
        messages: [{ type: "text", text: message }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.line_token}`,
        },
      }
    );
    return NextResponse.json({ success: true, message: "Weekly report sent!" });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to send LINE message" },
      { status: 500 }
    );
  }
}

// GET — for Vercel cron
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, line_token")
    .not("line_token", "is", null);

  let sent = 0;
  for (const user of users || []) {
    const { data: accounts } = await supabase
      .from("ad_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (!accounts || accounts.length === 0) continue;

    const totalSpend = accounts.reduce((s, a) => s + Number(a.spend_today), 0);
    const message = buildWeeklyReport(accounts, totalSpend);

    const axios = (await import("axios")).default;
    try {
      await axios.post(
        "https://api.line.me/v2/bot/message/push",
        { to: user.line_token, messages: [{ type: "text", text: message }] },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.line_token}`,
          },
        }
      );
      sent++;
    } catch {}
  }

  return NextResponse.json({ success: true, reportsSent: sent });
}
