"use client";

import { useMemo } from "react";
import type { Complaint } from "@/lib/types";
import type { Outlet } from "@/lib/outlets";

const DAILY_TARGET = 5;

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function DailyGoalStrip({
  complaints,
  outlets,
}: {
  complaints: Complaint[];
  outlets: Outlet[];
}) {
  const rows = useMemo(() => {
    const todays = complaints.filter((c) => isToday(c.submittedAt));
    return outlets
      .map((o) => ({
        outlet: o,
        count: todays.filter((c) => c.locationSlug === o.slug).length,
      }))
      .sort((a, b) => a.count - b.count || a.outlet.name.localeCompare(b.outlet.name));
  }, [complaints, outlets]);

  if (outlets.length === 0) return null;

  return (
    <div className="mx-5 mb-4 sm:mx-8">
      <p className="mb-2 font-body text-[11px] uppercase tracking-wider text-muted">
        Today&apos;s reviews · target {DAILY_TARGET}/outlet
      </p>
      <div className="flex flex-wrap gap-2">
        {rows.map(({ outlet, count }) => {
          const met = count >= DAILY_TARGET;
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
                {count}/{DAILY_TARGET}
              </span>
              {!met && (
                <span className="text-[10px] text-chili/80">
                  {DAILY_TARGET - count} to go
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
