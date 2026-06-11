import { NextRequest, NextResponse } from "next/server";
import { sendLineNotification } from "@/lib/line/api";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { line_token, line_user_id } = await request.json();

  if (!line_token) {
    return NextResponse.json({ error: "LINE token is required" }, { status: 400 });
  }

  const targetUserId = line_user_id || line_token; // fallback

  const result = await sendLineNotification(line_token, targetUserId, {
    clientName: "Test Client",
    adAccountName: "Test Ad Account",
    remainingBalance: 800,
    currency: "THB",
  });

  if (result.success) {
    return NextResponse.json({ success: true, message: "Test notification sent!" });
  } else {
    return NextResponse.json(
      { error: result.error || "Failed to send test notification" },
      { status: 400 }
    );
  }
}
