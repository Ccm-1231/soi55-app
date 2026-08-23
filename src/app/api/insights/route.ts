import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInsight } from "@/lib/gemini";
import type { ComplaintRow } from "@/lib/supabase/mappers";

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await requireStaff();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("insights")
    .select("summary, counts, generated_at")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ insight: data ?? null });
}

export async function POST() {
  const { supabase, user } = await requireStaff();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: complaints }, { data: outlets }] = await Promise.all([
    supabase
      .from("complaints")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(150),
    supabase.from("outlets").select("slug, name"),
  ]);

  const rows = (complaints as ComplaintRow[] | null) ?? [];
  const outletNames = new Map((outlets ?? []).map((o) => [o.slug, o.name]));

  const counts = {
    new: rows.filter((c) => c.status === "new").length,
    in_progress: rows.filter((c) => c.status === "in_progress").length,
    resolved: rows.filter((c) => c.status === "resolved").length,
  };

  if (rows.length === 0) {
    const summary = "No feedback yet — nothing to analyze until guests start submitting.";
    const { data: saved } = await supabase
      .from("insights")
      .insert({ summary, counts })
      .select("summary, counts, generated_at")
      .single();
    return NextResponse.json({ insight: saved });
  }

  const lines = rows.map((c) => {
    const outlet = outletNames.get(c.location_slug) ?? c.location_slug;
    const ratings = [
      c.food_rating != null ? `food ${c.food_rating}/5` : null,
      c.service_rating != null ? `service ${c.service_rating}/5` : null,
      c.value_rating != null ? `value ${c.value_rating}/5` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return `- [${c.status}] ${outlet}${ratings ? ` (${ratings})` : ""}: "${c.description}"`;
  });

  const prompt = `You are analyzing customer feedback for a Thai restaurant chain called Soi 55 with multiple outlets.

Here is the current ticket status count:
- New: ${counts.new}
- In progress: ${counts.in_progress}
- Resolved: ${counts.resolved}

Here are the individual feedback tickets (most recent first, status in brackets, outlet, star ratings if given, then the guest's comment):
${lines.join("\n")}

Write a short operational briefing for the restaurant owner, in plain text (no markdown headers, no asterisks), around 120-180 words, covering:
1. A one-line summary of the current ticket volume/status.
2. Which ONE outlet needs the most urgent attention right now, and why (based on complaint volume, severity, or low ratings).
3. Whether FOOD or SERVICE issues are the bigger recurring problem across the tickets, with a brief concrete reason.
4. One clear, actionable recommendation for what to prioritize first.

Be direct and specific — reference actual outlet names and issues from the data, not generic advice.`;

  try {
    const summary = await generateInsight(prompt);
    const { data: saved, error } = await supabase
      .from("insights")
      .insert({ summary: summary.trim(), counts })
      .select("summary, counts, generated_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ insight: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate insight" },
      { status: 500 }
    );
  }
}
