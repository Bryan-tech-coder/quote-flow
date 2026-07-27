import { NextRequest, NextResponse } from "next/server";
import { processPendingNotifications } from "@/lib/notifications/queue";
import { sendStaleQuoteReminders } from "@/lib/notifications/reminders";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const remindersSent = await sendStaleQuoteReminders();
  const processed = await processPendingNotifications();
  return NextResponse.json({ remindersSent, processed });
}
