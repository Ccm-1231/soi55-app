import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { roleOf } from "@/lib/roles";
import { actorLabelFor, logActivity } from "@/lib/activity";

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (roleOf(user.app_metadata) !== "admin") {
    return NextResponse.json({ error: "Only admins can delete reviews." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const ticketNumbers = body?.ticketNumbers;
  if (
    !Array.isArray(ticketNumbers) ||
    ticketNumbers.length === 0 ||
    !ticketNumbers.every((t) => typeof t === "string")
  ) {
    return NextResponse.json(
      { error: "ticketNumbers must be a non-empty array of strings." },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Delete isn't configured yet — the server is missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 501 }
    );
  }

  const { error, count } = await admin
    .from("complaints")
    .delete({ count: "exact" })
    .in("ticket_number", ticketNumbers);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const actorLabel = actorLabelFor(user);
  await Promise.allSettled(
    ticketNumbers.map((t: string) => logActivity(supabase, actorLabel, "delete_review", t))
  );

  return NextResponse.json({ ok: true, deletedCount: count ?? ticketNumbers.length });
}
