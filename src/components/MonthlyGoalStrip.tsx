"use client";

import { useMemo } from "react";
import type { Complaint } from "@/lib/types";
import type { Outlet } from "@/lib/outlets";

const MONTHLY_TARGET = 150;

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/**
 * Malaysian mobile numbers: 01x followed by 7-8 more digits (10-11 digits
 * total). Accepts +60 / 60 / 0 prefixes and any spacing/dashes.
 */
function normalizedMyPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("60") && digits.length >= 11) {
    digits = "0" + digits.slice(2);
  }
  if (!/^01\d{8,9}$/.test(digits)) return null;
  return digits;
}

/**
 * Only submissions with a valid Malaysian mobile number count toward the
 * monthly target, and each phone number counts once per outlet per month --
 * otherwise staff could hit the target by scanning themselves repeatedly.
 */
function countedThisMonth(outletSlug: string, complaints: Complaint[]): number {
  const seen = new Set<string>();
  for (const c of complaints) {
    if (c.locationSlug !== outletSlug || !isThisMonth(c.submittedAt)) continue;
    const phone = normalizedMyPhone(c.guestContact);
    if (phone) seen.add(phone);
  }
  return seen.size;
}

export function MonthlyGoalStrip({
  complaints,
  outlets,
}: {
  complaints: Complaint[];
  outlets: Outlet[];
}) {
  const rows = useMemo(() => {
    return outlets
      .map((o) => ({ outlet: o, count: countedThisMonth(o.slug, complaints) }))
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
