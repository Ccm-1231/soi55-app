export type StaffRole = "admin" | "manager" | "user";

/** Accounts with no role set are treated as the lowest tier ("user"), for least privilege. */
export function roleOf(appMetadata: Record<string, unknown> | null | undefined): StaffRole {
  const role = appMetadata?.role;
  if (role === "admin" || role === "manager") return role;
  return "user";
}

export function canManage(role: StaffRole): boolean {
  return role === "admin" || role === "manager";
}
