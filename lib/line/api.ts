import axios from "axios";
import { LineNotificationPayload } from "@/types";

const LINE_API_URL = "https://api.line.me/v2/bot/message/push";

// ============================================
// LINE Message Builder
// ============================================

function buildLowBalanceMessage(payload: LineNotificationPayload): string {
  const { clientName, adAccountName, remainingBalance, currency } = payload;
  const formattedBalance = remainingBalance.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    `⚠️ Ad Budget Low Alert\n\n` +
    `Client: ${clientName}\n` +
    `Ad Account: ${adAccountName}\n\n` +
    `Estimated Remaining Balance:\n` +
    `${formattedBalance} ${currency}\n\n` +
    `Please top up balance to prevent ads from stopping.`
  );
}

// ============================================
// Send LINE Notification
// ============================================

export async function sendLineNotification(
  lineToken: string,
  userId: string,
  payload: LineNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const message = buildLowBalanceMessage(payload);

    await axios.post(
      LINE_API_URL,
      {
        to: userId,
        messages: [
          {
            type: "text",
            text: message,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lineToken}`,
        },
      }
    );

    return { success: true };
  } catch (error) {
    const errMsg = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : String(error);

    console.error("LINE notification error:", errMsg);
    return { success: false, error: errMsg };
  }
}

// ============================================
// Verify LINE Token
// ============================================

export async function verifyLineToken(
  token: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    await axios.get("https://api.line.me/v2/bot/info", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid LINE token" };
  }
}
