"use client";

import { useMemo } from "react";
import type { Complaint } from "@/lib/types";
import type { Outlet } from "@/lib/outlets";

const DAILY_TARGET = 5;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function contactKey(c: Complaint): string | null {
  const name = c.guestName?.trim();
  const contact = c.guestContact?.trim().toLowerCase();
  if (!name || !contact) return null;
  return contact;
}

/**
 * A submission only counts toward the daily target if it has a real name +
 * contact, and isn't a repeat from the same contact within 24h at the same
 * outlet -- otherwise staff could hit the target by scanning themselves.
 */
function countableIdsFor(outletSlug: string, complaints: Complaint[]): Set<string> {
  const atOutlet = complaints
    .filter((c) => c.locationSlug === outletSlug && contactKey(c))
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

  const lastCountedAt = new Map<string, number>();
  const countable = new Set<string>();

  for (const c of atOutlet) {
    const key = contactKey(c)!;
    const time = new Date(c.submittedAt).getTime();
    const last = lastCountedAt.get(key);
    if (last === undefined || time - last > DUPLICATE_WINDOW_MS) {
      countable.add(c.id);
      lastCountedAt.set(key, time);
    }
  }

  return countable;
}

export function DailyGoalStrip({
  complaints,
  outlets,
}: {
  complaints: Complaint[];
  outlets: Outlet[];
}) {
  const rows = useMemo(() => {
    return outlets
      .map((o) => {
        const countable = countableIdsFor(o.slug, complaints);
        const count = complaints.filter(
          (c) => c.locationSlug === o.slug && isToday(c.submittedAt) && countable.has(c.id)
        ).length;
        return { outlet: o, count };
      })
      .sort((a, b) => a.count - b.count || a.outlet.name.localeCompare(b.outlet.name));
  }, [complaints, outlets]);

  if (outlets.length === 0) return null;

  return (
    <div className="mx-5 mb-4 sm:mx-8">
      <p className="mb-2 font-body text-[11px] uppercase tracking-wider text-muted">
        Today&apos;s reviews · target {DAILY_TARGET}/outlet · named + contact only, one per 24h
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
