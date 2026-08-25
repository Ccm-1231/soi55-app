"use client";

import { useMemo } from "react";
import type { Complaint } from "@/lib/types";
import type { Outlet } from "@/lib/outlets";

const PRIORITY_RANK: Record<string, number> = { red: 0, yellow: 1, green: 2 };
const PRIORITY_LABEL: Record<string, string> = { red: "Critical", yellow: "Watch", green: "Fine" };
const PRIORITY_CLASS: Record<string, string> = {
  red: "bg-chili/20 text-chili",
  yellow: "bg-turmeric/20 text-turmeric",
  green: "bg-pandan/20 text-pandan",
};

function outletNameFor(slug: string, outlets: Outlet[]): string {
  return outlets.find((o) => o.slug === slug)?.name ?? slug;
}

/** Q7 ("what one thing would you change") and Q8 ("anything else the boss
 * should know") are free text, so they can't be broken into star columns --
 * this pulls every answer, sorted by the same priority the board already
 * assigns, so the serious ones surface first. */
export function BossFeedbackPanel({
  complaints,
  outlets,
}: {
  complaints: Complaint[];
  outlets: Outlet[];
}) {
  const rows = useMemo(() => {
    return [...complaints]
      .filter((c) => c.description?.trim())
      .sort((a, b) => {
        const rankA = a.priority ? PRIORITY_RANK[a.priority] : 3;
        const rankB = b.priority ? PRIORITY_RANK[b.priority] : 3;
        if (rankA !== rankB) return rankA - rankB;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
  }, [complaints]);

  if (rows.length === 0) return null;

  return (
    <div className="mt-5 border-t border-rail-line pt-4">
      <p className="mb-3 font-body text-[11px] uppercase tracking-wider text-muted">
        Boss feedback · Q7 &amp; Q8, sorted by priority
      </p>
      <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
        {rows.map((c) => (
          <div key={c.id} className="rounded-[2px] border border-rail-line px-3 py-2.5">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-body text-[11px] font-semibold text-cream">#{c.id}</span>
              <span className="font-body text-[11px] text-muted">{outletNameFor(c.locationSlug, outlets)}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                  c.priority ? PRIORITY_CLASS[c.priority] : "bg-ink-text/20 text-muted"
                }`}
              >
                {c.priority ? PRIORITY_LABEL[c.priority] : "Unrated"}
              </span>
            </div>
            <p className="font-body text-[13px] leading-relaxed text-cream/90">{c.description}</p>
            {c.additionalNotes && (
              <p className="mt-1.5 font-body text-[12px] leading-relaxed text-muted">
                &ldquo;{c.additionalNotes}&rdquo;
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
