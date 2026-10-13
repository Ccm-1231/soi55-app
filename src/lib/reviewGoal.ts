import type { Complaint } from "@/lib/types";
import { monthKey } from "@/lib/time";

export const MONTHLY_TARGET = 150;

/**
 * Malaysian mobile numbers: 01x followed by 7-8 more digits (10-11 digits
 * total). Accepts +60 / 60 / 0 prefixes and any spacing/dashes.
 */
export function normalizedMyPhone(raw: string | null | undefined): string | null {
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
export function countedPhonesForMonth(
  outletSlug: string,
  complaints: Complaint[],
  targetMonthKey: string
): Set<string> {
  const seen = new Set<string>();
  for (const c of complaints) {
    if (c.locationSlug !== outletSlug || monthKey(c.submittedAt) !== targetMonthKey) continue;
    const phone = normalizedMyPhone(c.guestContact);
    if (phone) seen.add(phone);
  }
  return seen;
}

/**
 * Count ALL complaints for a given outlet and month, regardless of phone number.
 * Use this for dashboard tracking where you want to see total review volume.
 */
export function countedComplaintsForMonth(
  outletSlug: string,
  complaints: Complaint[],
  targetMonthKey: string
): number {
  let count = 0;
  for (const c of complaints) {
    if (c.locationSlug === outletSlug && monthKey(c.submittedAt) === targetMonthKey) {
      count++;
    }
  }
  return count;
}

export function countedPhonesThisMonth(outletSlug: string, complaints: Complaint[]): Set<string> {
  return countedPhonesForMonth(outletSlug, complaints, monthKey(new Date().toISOString()));
}
