import { createServiceClient } from "@/lib/supabase/server";
import { batchFetchSpend } from "@/lib/facebook/api";
import { sendLineNotification } from "@/lib/line/api";
import { AdAccount, SyncResult } from "@/types";

// ============================================
// Core Sync Logic (used by both cron and manual)
// ============================================

export async function syncAllAccounts(
  userId?: string
): Promise<SyncResult> {
  const supabase = createServiceClient();
  let accountsSynced = 0;
  let alertsSent = 0;
  const errors: string[] = [];

  try {
    // Get users to sync (with their tokens)
    let usersQuery = supabase
      .from("users")
      .select("id, access_token, line_token, alert_threshold")
      .not("access_token", "is", null);

    if (userId) {
      usersQuery = usersQuery.eq("id", userId);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      return { success: true, accountsSynced: 0, alertsSent: 0 };
    }

    for (const user of users) {
      try {
        // Get all active ad accounts for this user
        const { data: accounts, error: accountsError } = await supabase
          .from("ad_accounts")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (accountsError || !accounts || accounts.length === 0) continue;

        // Batch fetch spend data
        const accountIds = accounts.map((a: AdAccount) => a.account_id);
        const spendMap = await batchFetchSpend(accountIds, user.access_token);

        // Update each account
        for (const account of accounts) {
          const spendData = spendMap.get(account.account_id);

          if (spendData) {
            const { error: updateError } = await supabase
              .from("ad_accounts")
              .update({
                spend_today: spendData.spendToday,
                total_spend: spendData.totalSpend,
                last_synced_at: new Date().toISOString(),
              })
              .eq("id", account.id);

            if (updateError) {
              errors.push(
                `Failed to update account ${account.account_id}: ${updateError.message}`
              );
            } else {
              accountsSynced++;

              // Check if we need to send alert
              const newRemainingBalance =
                account.topup_amount - spendData.totalSpend;

              if (
                newRemainingBalance < account.threshold &&
                !account.alert_sent &&
                account.topup_amount > 0 &&
                user.line_token
              ) {
                const lineResult = await sendLineNotification(
                  user.line_token,
                  user.line_token, // In this case LINE token IS user ID for simplicity
                  {
                    clientName: account.client_name || account.ad_account_name,
                    adAccountName: account.ad_account_name,
                    remainingBalance: newRemainingBalance,
                    currency: account.currency,
                  }
                );

                if (lineResult.success) {
                  // Mark alert as sent
                  await supabase
                    .from("ad_accounts")
                    .update({ alert_sent: true })
                    .eq("id", account.id);

                  // Log notification
                  await supabase.from("notifications").insert({
                    ad_account_id: account.id,
                    user_id: user.id,
                    message: `Low balance alert sent for ${account.ad_account_name}`,
                    remaining_balance: newRemainingBalance,
                    notification_type: "low_balance",
                    status: "sent",
                  });

                  alertsSent++;
                } else {
                  await supabase.from("notifications").insert({
                    ad_account_id: account.id,
                    user_id: user.id,
                    message: `Failed to send alert for ${account.ad_account_name}: ${lineResult.error}`,
                    remaining_balance: newRemainingBalance,
                    notification_type: "low_balance",
                    status: "failed",
                  });
                }
              }
            }
          }
        }
      } catch (userError) {
        errors.push(
          `Error syncing user ${user.id}: ${String(userError)}`
        );
      }
    }

    return {
      success: true,
      accountsSynced,
      alertsSent,
    };
  } catch (error) {
    return {
      success: false,
      accountsSynced,
      alertsSent,
      error: String(error),
    };
  }
}
