"use client";

import { useMemo } from "react";
import type { Complaint } from "@/lib/types";
import type { Outlet } from "@/lib/outlets";

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Rating thresholds map to this app's existing status colors (pandan=good, turmeric=warning, chili=critical). */
function ratingColor(value: number): string {
  if (value >= 4) return "bg-pandan";
  if (value >= 3) return "bg-turmeric";
  return "bg-chili";
}

function RatingBar({ label, value }: { label: string; value: number | null }) {
  const pct = value != null ? (value / 5) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 font-body text-[11px] uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-text/10">
        {value != null && (
          <div
            className={`h-full rounded-full ${ratingColor(value)}`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <span className="w-9 shrink-0 text-right font-body text-[12px] font-semibold text-cream">
        {value != null ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

export function RatingsCharts({
  complaints,
  outlets,
}: {
  complaints: Complaint[];
  outlets: Outlet[];
}) {
  const ratings = useMemo(() => {
    const food = complaints.map((c) => c.foodRating).filter((v): v is number => v != null);
    const service = complaints.map((c) => c.serviceRating).filter((v): v is number => v != null);
    const value = complaints.map((c) => c.valueRating).filter((v): v is number => v != null);
    return {
      overall: average([...food, ...service, ...value]),
      count: food.length + service.length + value.length,
      food: average(food),
      service: average(service),
      value: average(value),
    };
  }, [complaints]);

  const outletActionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of complaints) {
      if (c.status === "new") {
        counts.set(c.locationSlug, (counts.get(c.locationSlug) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([slug, count]) => ({
        slug,
        name: outlets.find((o) => o.slug === slug)?.name ?? slug,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [complaints, outlets]);

  const maxOutletCount = Math.max(1, ...outletActionCounts.map((o) => o.count));

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-[2px] border border-rail-line p-3.5">
        <div className="mb-3 flex items-baseline gap-2">
          <p className="font-display text-3xl leading-none text-cream">
            {ratings.overall != null ? ratings.overall.toFixed(1) : "—"}
          </p>
          <p className="font-body text-[11px] text-muted">/5 overall · {ratings.count} ratings</p>
        </div>
        <div className="flex flex-col gap-2">
          <RatingBar label="Food" value={ratings.food} />
          <RatingBar label="Service" value={ratings.service} />
          <RatingBar label="Value" value={ratings.value} />
        </div>
      </div>

      <div className="rounded-[2px] border border-rail-line p-3.5">
        <p className="mb-3 font-body text-[11px] uppercase tracking-wide text-muted">
          Outlets needing action
        </p>
        {outletActionCounts.length === 0 ? (
          <p className="font-body text-[12px] text-muted">Nothing open right now.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {outletActionCounts.map((o) => (
              <div key={o.slug} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate font-body text-[11px] text-cream/90" title={o.name}>
                  {o.name}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-text/10">
                  <div
                    className="h-full rounded-full bg-chili"
                    style={{ width: `${(o.count / maxOutletCount) * 100}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right font-body text-[12px] font-semibold text-cream">
                  {o.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
