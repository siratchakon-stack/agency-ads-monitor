import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getFacebookProfile,
  fetchAdAccounts,
} from "@/lib/facebook/api";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=no_code", request.url)
    );
  }

  try {
    const supabase = createServiceClient();

    // Exchange code for short-lived token
    const tokenData = await exchangeCodeForToken(code);

    // Exchange for long-lived token
    const longLivedToken = await getLongLivedToken(tokenData.access_token);

    // Get Facebook profile
    const profile = await getFacebookProfile(longLivedToken.access_token);

    // Calculate token expiry
    const tokenExpiresAt = new Date(
      Date.now() + (longLivedToken.expires_in || 5184000) * 1000
    ).toISOString();

    // Upsert user
    const { data: user, error: userError } = await supabase
      .from("users")
      .upsert(
        {
          facebook_id: profile.id,
          name: profile.name,
          email: profile.email,
          picture_url: profile.picture?.data?.url,
          access_token: longLivedToken.access_token,
          token_expires_at: tokenExpiresAt,
        },
        { onConflict: "facebook_id" }
      )
      .select()
      .single();

    if (userError) {
      console.error("User upsert error:", userError);
      return NextResponse.redirect(
        new URL("/login?error=db_error", request.url)
      );
    }

    // Fetch and save all accessible ad accounts
    const adAccounts = await fetchAdAccounts(longLivedToken.access_token);

    if (adAccounts.length > 0) {
      const accountsToUpsert = adAccounts.map((account) => ({
        user_id: user.id,
        account_id: account.id.replace("act_", ""),
        ad_account_name: account.name,
        currency: account.currency || "THB",
        account_status: account.account_status || 1,
        platform: "facebook",
      }));

      await supabase
        .from("ad_accounts")
        .upsert(accountsToUpsert, { onConflict: "user_id,account_id" });
    }

    // Create session cookie
    const response = NextResponse.redirect(
      new URL("/dashboard", request.url)
    );

    response.cookies.set("session_token", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url)
    );
  }
}
