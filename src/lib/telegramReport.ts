import type { Complaint } from "@/lib/types";
import type { Outlet } from "@/lib/outlets";
import { MONTHLY_TARGET, countedPhonesThisMonth } from "@/lib/reviewGoal";

const FILLER_WORDS = /\b(show|me|the|report|reports|for|please|pls|of|and|check)\b/gi;

/** Matches outlet codes/names out of a free-form staff message like
 * "show me xm, ad, jt report" or "bukit jelutong report". */
export function matchOutlets(text: string, outlets: Outlet[]): Outlet[] {
  const cleaned = text.replace(FILLER_WORDS, " ").trim();
  const segments = cleaned
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const results: Outlet[] = [];
  const seen = new Set<string>();

  function findByToken(token: string): Outlet | undefined {
    return outlets.find((o) => o.name.toLowerCase() === token || o.slug.toLowerCase() === token);
  }

  function add(o: Outlet | undefined) {
    if (o && !seen.has(o.slug)) {
      seen.add(o.slug);
      results.push(o);
    }
  }

  for (const seg of segments) {
    const segLower = seg.toLowerCase();
    const direct = findByToken(segLower);
    if (direct) {
      add(direct);
      continue;
    }
    for (const word of segLower.split(/\s+/).filter(Boolean)) {
      add(findByToken(word));
    }
  }

  return results;
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export function buildOutletReport(outlet: Outlet, complaints: Complaint[]): string {
  const atOutlet = complaints.filter((c) => c.locationSlug === outlet.slug);
  const monthlyCount = countedPhonesThisMonth(outlet.slug, complaints).size;

  const food = average(atOutlet.map((c) => c.foodRating).filter((v): v is number => typeof v === "number"));
  const service = average(
    atOutlet.map((c) => c.serviceRating).filter((v): v is number => typeof v === "number")
  );
  const value = average(atOutlet.map((c) => c.valueRating).filter((v): v is number => typeof v === "number"));
  const overallVals = [food, service, value].filter((v): v is number => v !== null);
  const overall = average(overallVals);

  const newCount = atOutlet.filter((c) => c.status === "new").length;
  const checkedCount = atOutlet.filter((c) => c.status !== "new").length;

  const lines = [
    `📍 ${outlet.name}`,
    `This month: ${monthlyCount}/${MONTHLY_TARGET} reviews (${Math.max(0, MONTHLY_TARGET - monthlyCount)} to go)`,
    overall !== null
      ? `Avg rating: ${overall.toFixed(1)}/5 (Food ${food?.toFixed(1)} · Service ${service?.toFixed(1)} · Value ${value?.toFixed(1)})`
      : "Avg rating: no ratings yet",
    `Tickets: ${newCount} new · ${checkedCount} checked`,
  ];
  return lines.join("\n");
}
