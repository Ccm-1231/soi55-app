import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rowToComplaint, type ComplaintRow } from "@/lib/supabase/mappers";
import type { Outlet } from "@/lib/outlets";
import { matchOutlets, buildOutletReport } from "@/lib/telegramReport";

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(request: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const update = await request.json().catch(() => null);
  const message = update?.message;
  const chatId: number | undefined = message?.chat?.id;
  const text: string | undefined = message?.text;

  if (!chatId || !text) {
    return NextResponse.json({ ok: true });
  }

  const trimmed = text.trim();
  if (trimmed === "/start" || trimmed.toLowerCase() === "help") {
    await sendMessage(
      chatId,
      'Hi! Send me outlet codes to get their report, e.g. "show me xm, ad, jt report" or just "xm".'
    );
    return NextResponse.json({ ok: true });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    await sendMessage(chatId, "The report bot isn't configured yet — ask an admin to check the server setup.");
    return NextResponse.json({ ok: true });
  }

  const [{ data: outletsData }, { data: complaintsData }] = await Promise.all([
    admin.from("outlets").select("id, slug, name").order("created_at", { ascending: true }),
    admin.from("complaints").select("*"),
  ]);

  const outlets = (outletsData as Outlet[] | null) ?? [];
  const complaints = ((complaintsData as ComplaintRow[] | null) ?? []).map(rowToComplaint);

  const matched = matchOutlets(trimmed, outlets);

  if (matched.length === 0) {
    const codes = outlets.map((o) => o.name).join(", ");
    await sendMessage(
      chatId,
      `Couldn't find that outlet. Try one of: ${codes || "(no outlets set up yet)"}`
    );
    return NextResponse.json({ ok: true });
  }

  const reply = matched.map((o) => buildOutletReport(o, complaints)).join("\n\n");
  await sendMessage(chatId, reply);

  return NextResponse.json({ ok: true });
}
