import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;
  const { id } = await params;

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (userId === "demo-user-id") {
    return NextResponse.json({ success: true, is_active: true, message: "Demo: toggled" });
  }

  const supabase = createServiceClient();

  const { data: account } = await supabase
    .from("ad_accounts")
    .select("is_active")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("ad_accounts")
    .update({ is_active: !account.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, is_active: data.is_active });
}
