import axios from "axios";
import { FacebookAdAccount, MetaInsight } from "@/types";

const FB_API_VERSION = "v21.0";
const FB_BASE_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

// ============================================
// Facebook OAuth
// ============================================

export function getFacebookLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI!,
    scope: [
      "ads_management",
      "ads_read",
      "business_management",
      "email",
      "public_profile",
    ].join(","),
    response_type: "code",
    state: crypto.randomUUID(),
  });

  return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in?: number;
}> {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    redirect_uri: process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI!,
    code,
  });

  const response = await axios.get(
    `${FB_BASE_URL}/oauth/access_token?${params.toString()}`
  );

  return response.data;
}

export async function getLongLivedToken(shortLivedToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    fb_exchange_token: shortLivedToken,
  });

  const response = await axios.get(
    `${FB_BASE_URL}/oauth/access_token?${params.toString()}`
  );

  return response.data;
}

// ============================================
// User Profile
// ============================================

export async function getFacebookProfile(
  accessToken: string
): Promise<{ id: string; name: string; email?: string; picture?: { data: { url: string } } }> {
  const response = await axios.get(`${FB_BASE_URL}/me`, {
    params: {
      fields: "id,name,email,picture.type(large)",
      access_token: accessToken,
    },
  });

  return response.data;
}

// ============================================
// Ad Accounts
// ============================================

export async function fetchAdAccounts(
  accessToken: string
): Promise<FacebookAdAccount[]> {
  const allAccounts: FacebookAdAccount[] = [];
  let nextUrl: string | null = `${FB_BASE_URL}/me/adaccounts`;

  while (nextUrl) {
    const url: string = nextUrl;
    const response = await axios.get(url, {
      params: {
        fields: "id,name,currency,account_status",
        access_token: accessToken,
        limit: 100,
      },
    });

    const data = response.data;
    allAccounts.push(...(data.data || []));

    // Pagination
    nextUrl = data.paging?.next || null;
  }

  return allAccounts;
}

// ============================================
// Spend Data
// ============================================

export async function fetchAccountSpend(
  accountId: string,
  accessToken: string
): Promise<{ spendToday: number; totalSpend: number }> {
  try {
    // Get today's spend
    const todayResponse = await axios.get(
      `${FB_BASE_URL}/act_${accountId}/insights`,
      {
        params: {
          fields: "spend",
          date_preset: "today",
          access_token: accessToken,
        },
      }
    );

    // Get all-time spend (lifetime)
    const lifetimeResponse = await axios.get(
      `${FB_BASE_URL}/act_${accountId}/insights`,
      {
        params: {
          fields: "spend",
          date_preset: "maximum",
          access_token: accessToken,
        },
      }
    );

    const todayData: MetaInsight[] = todayResponse.data?.data || [];
    const lifetimeData: MetaInsight[] = lifetimeResponse.data?.data || [];

    const spendToday = todayData.reduce(
      (sum, item) => sum + parseFloat(item.spend || "0"),
      0
    );
    const totalSpend = lifetimeData.reduce(
      (sum, item) => sum + parseFloat(item.spend || "0"),
      0
    );

    return { spendToday, totalSpend };
  } catch (error) {
    console.error(`Error fetching spend for account ${accountId}:`, error);
    return { spendToday: 0, totalSpend: 0 };
  }
}

// ============================================
// Batch Fetch Spend (optimized for 100+ accounts)
// ============================================

export async function batchFetchSpend(
  accountIds: string[],
  accessToken: string
): Promise<Map<string, { spendToday: number; totalSpend: number }>> {
  const results = new Map<
    string,
    { spendToday: number; totalSpend: number }
  >();

  // Process in batches of 50 (Facebook API limit)
  const BATCH_SIZE = 50;

  for (let i = 0; i < accountIds.length; i += BATCH_SIZE) {
    const batch = accountIds.slice(i, i + BATCH_SIZE);

    const batchRequests = batch.flatMap((accountId) => [
      {
        method: "GET",
        relative_url: `act_${accountId}/insights?fields=spend&date_preset=today`,
      },
      {
        method: "GET",
        relative_url: `act_${accountId}/insights?fields=spend&date_preset=maximum`,
      },
    ]);

    try {
      const response = await axios.post(`${FB_BASE_URL}/`, null, {
        params: {
          access_token: accessToken,
          batch: JSON.stringify(batchRequests),
        },
      });

      const batchResults: Array<{ code: number; body: string }> =
        response.data;

      for (let j = 0; j < batch.length; j++) {
        const accountId = batch[j];
        const todayResult = batchResults[j * 2];
        const lifetimeResult = batchResults[j * 2 + 1];

        let spendToday = 0;
        let totalSpend = 0;

        if (todayResult?.code === 200) {
          const todayData = JSON.parse(todayResult.body);
          spendToday = (todayData.data || []).reduce(
            (sum: number, item: MetaInsight) =>
              sum + parseFloat(item.spend || "0"),
            0
          );
        }

        if (lifetimeResult?.code === 200) {
          const lifetimeData = JSON.parse(lifetimeResult.body);
          totalSpend = (lifetimeData.data || []).reduce(
            (sum: number, item: MetaInsight) =>
              sum + parseFloat(item.spend || "0"),
            0
          );
        }

        results.set(accountId, { spendToday, totalSpend });
      }
    } catch (error) {
      console.error(`Batch fetch error for accounts ${batch.join(",")}:`, error);
      // Set default values for failed batch
      batch.forEach((accountId) => {
        results.set(accountId, { spendToday: 0, totalSpend: 0 });
      });
    }

    // Rate limiting delay between batches
    if (i + BATCH_SIZE < accountIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
