export type StaffRole = "admin" | "manager";

/** Accounts created before roles existed, or with no role set, are treated as managers (least privilege). */
export function roleOf(appMetadata: Record<string, unknown> | null | undefined): StaffRole {
  return appMetadata?.role === "admin" ? "admin" : "manager";
}
