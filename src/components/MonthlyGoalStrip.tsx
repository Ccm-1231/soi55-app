"use client";

import { useMemo } from "react";
import type { Complaint } from "@/lib/types";
import type { Outlet } from "@/lib/outlets";
import { MONTHLY_TARGET, countedPhonesThisMonth } from "@/lib/reviewGoal";

export function MonthlyGoalStrip({
  complaints,
  outlets,
}: {
  complaints: Complaint[];
  outlets: Outlet[];
}) {
  const rows = useMemo(() => {
    return outlets
      .map((o) => ({ outlet: o, count: countedPhonesThisMonth(o.slug, complaints).size }))
      .sort((a, b) => a.count - b.count || a.outlet.name.localeCompare(b.outlet.name));
  }, [complaints, outlets]);

  if (outlets.length === 0) return null;

  return (
    <div className="mx-5 mb-4 sm:mx-8">
      <p className="mb-2 font-body text-[11px] uppercase tracking-wider text-muted">
        This month&apos;s reviews · target {MONTHLY_TARGET}/outlet · valid MY phone number only, one per customer
      </p>
      <div className="flex flex-wrap gap-2">
        {rows.map(({ outlet, count }) => {
          const met = count >= MONTHLY_TARGET;
          return (
            <div
              key={outlet.slug}
              className={`flex items-center gap-2 rounded-[2px] border px-3 py-1.5 font-body text-[12px] ${
                met
                  ? "border-pandan/40 bg-pandan/10 text-pandan"
                  : "border-chili/40 bg-chili/10 text-chili"
              }`}
            >
              <span className="font-semibold">{outlet.name}</span>
              <span>
                {count}/{MONTHLY_TARGET}
              </span>
              {!met && (
                <span className="text-[10px] text-chili/80">
                  {MONTHLY_TARGET - count} to go
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
