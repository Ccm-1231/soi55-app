"use client";

import { useMemo, useState } from "react";
import type { Complaint } from "@/lib/types";
import type { Outlet } from "@/lib/outlets";
import { MONTHLY_TARGET, countedComplaintsForMonth } from "@/lib/reviewGoal";
import { monthKey, monthLabel } from "@/lib/time";
import { FilterDropdown } from "@/components/FilterDropdown";

export function MonthlyGoalStrip({
  complaints,
  outlets,
}: {
  complaints: Complaint[];
  outlets: Outlet[];
}) {
  const currentMonth = monthKey(new Date().toISOString());
  const monthOptions = useMemo(() => {
    const keys = new Set(complaints.map((c) => monthKey(c.submittedAt)));
    keys.add(currentMonth);
    return Array.from(keys).sort().reverse();
  }, [complaints, currentMonth]);

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const effectiveMonth = selectedMonth ?? currentMonth;
  const isCurrentMonth = effectiveMonth === currentMonth;

  const rows = useMemo(() => {
    return outlets
      .map((o) => ({ outlet: o, count: countedComplaintsForMonth(o.slug, complaints, effectiveMonth) }))
      .sort((a, b) => a.count - b.count || a.outlet.name.localeCompare(b.outlet.name));
  }, [complaints, outlets, effectiveMonth]);

  if (outlets.length === 0) return null;

  return (
    <div className="mx-5 mb-4 sm:mx-8">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Month"
          options={monthOptions.map((k) => ({ value: k, label: monthLabel(k) }))}
          value={effectiveMonth}
          onChange={setSelectedMonth}
          renderButtonLabel={(activeLabel) =>
            isCurrentMonth ? "This month's reviews" : `${activeLabel} reviews`
          }
        />
        <p className="font-body text-[11px] uppercase tracking-wider text-muted">
          target {MONTHLY_TARGET}/outlet · all reviews counted
        </p>
      </div>
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
              {!met && isCurrentMonth && (
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
