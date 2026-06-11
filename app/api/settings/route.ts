import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { verifyLineToken } from "@/lib/line/api";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (userId === "demo-user-id") {
    return NextResponse.json({ data: { name: "Demo User", email: "demo@agency.com", line_token: "", alert_threshold: 1500, warning_threshold: 3000, created_at: new Date().toISOString() } });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("users")
    .select("name, email, picture_url, line_token, alert_threshold, warning_threshold, created_at, token_expires_at")
    .eq("id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const allowedFields = ["line_token", "alert_threshold", "warning_threshold"];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  // Validate LINE token if provided
  if (updates.line_token) {
    const verification = await verifyLineToken(updates.line_token as string);
    if (!verification.valid) {
      return NextResponse.json(
        { error: "Invalid LINE Channel Access Token" },
        { status: 400 }
      );
    }
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, message: "Settings saved" });
}
