import type { SupabaseClient } from "@supabase/supabase-js";

export function actorLabelFor(user: { email?: string | null; app_metadata?: Record<string, unknown> } | null): string {
  if (!user) return "unknown";
  const username = user.app_metadata?.username;
  if (typeof username === "string") return `@${username}`;
  return user.email ?? "unknown";
}

export async function logActivity(
  supabase: SupabaseClient,
  actorLabel: string,
  action: string,
  ticketNumber: string | null,
  details?: Record<string, unknown>
) {
  await supabase.from("activity_log").insert({
    actor_label: actorLabel,
    action,
    ticket_number: ticketNumber,
    details: details ?? null,
  });
}
