import { timeAgo } from "@/lib/time";

/**
 * Relative time text ("12m ago") will always differ between the server render
 * and the client render, since real time passes between them — that's expected,
 * not a bug, so hydration warnings for this one span are suppressed rather than
 * chasing a mismatch that can't be avoided.
 */
export function TimeAgo({ iso }: { iso: string }) {
  return <span suppressHydrationWarning>{timeAgo(iso)}</span>;
}
