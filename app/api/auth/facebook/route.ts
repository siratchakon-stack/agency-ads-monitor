import { NextResponse } from "next/server";
import { getFacebookLoginUrl } from "@/lib/facebook/api";

export async function GET() {
  try {
    const url = getFacebookLoginUrl();
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate login URL" },
      { status: 500 }
    );
  }
}
