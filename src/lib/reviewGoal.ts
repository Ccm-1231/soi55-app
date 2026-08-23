import type { Complaint } from "@/lib/types";

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

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/**
 * Only submissions with a valid Malaysian mobile number count toward the
 * monthly target, and each phone number counts once per outlet per month --
 * otherwise staff could hit the target by scanning themselves repeatedly.
 */
export function countedPhonesThisMonth(outletSlug: string, complaints: Complaint[]): Set<string> {
  const seen = new Set<string>();
  for (const c of complaints) {
    if (c.locationSlug !== outletSlug || !isThisMonth(c.submittedAt)) continue;
    const phone = normalizedMyPhone(c.guestContact);
    if (phone) seen.add(phone);
  }
  return seen;
}
