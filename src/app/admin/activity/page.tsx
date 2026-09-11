"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TimeAgo } from "@/components/TimeAgo";

type ActivityRow = {
  id: string;
  actor_label: string;
  action: string;
  ticket_number: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

const ACTION_LABEL: Record<string, string> = {
  advance_status: "Advanced ticket",
  revert_status: "Reverted ticket",
  action_plan_saved: "Saved action plan",
  insight_generated: "Generated AI insight",
  delete_review: "Deleted review",
};

function describe(row: ActivityRow): string {
  const label = ACTION_LABEL[row.action] ?? row.action;
  if ((row.action === "advance_status" || row.action === "revert_status") && row.details) {
    const from = row.details.from as string | undefined;
    const to = row.details.to as string | undefined;
    if (from && to) return `${label}: ${from} → ${to}`;
  }
  return label;
}

export default function AdminActivityPage() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setRows((data as ActivityRow[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  const visible = filter.trim()
    ? rows.filter(
        (r) =>
          r.actor_label.toLowerCase().includes(filter.toLowerCase()) ||
          r.ticket_number?.toLowerCase().includes(filter.toLowerCase())
      )
    : rows;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl uppercase tracking-wide text-cream">Activity</h2>
        <p className="mt-1 font-body text-[12px] text-muted">
          Every status change, action-plan reply, and AI summary generated on the board.
        </p>
      </div>

      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by person or ticket number…"
        className="rounded-[2px] border border-rail-line bg-rail px-3 py-2 text-[14px] text-cream placeholder:text-muted focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
      />

      {loading ? (
        <p className="font-body text-[12px] text-muted">Loading…</p>
      ) : error ? (
        <p className="font-body text-[12px] text-chili">{error}</p>
      ) : visible.length === 0 ? (
        <p className="rounded-[3px] border border-dashed border-rail-line px-3 py-6 text-center font-body text-[12px] text-muted">
          Nothing logged yet.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-rail-line rounded-[3px] border border-rail-line bg-rail">
          {visible.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-body text-[13px] text-cream">
                  <span className="font-semibold">{row.actor_label}</span> — {describe(row)}
                  {row.ticket_number && (
                    <span className="text-muted"> · #{row.ticket_number}</span>
                  )}
                </p>
                {row.action === "action_plan_saved" &&
                  typeof row.details?.preview === "string" &&
                  row.details.preview && (
                    <p className="mt-0.5 font-body text-[12px] text-muted">
                      &ldquo;{row.details.preview}&rdquo;
                    </p>
                  )}
              </div>
              <span className="whitespace-nowrap font-body text-[11px] text-muted">
                <TimeAgo iso={row.created_at} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
