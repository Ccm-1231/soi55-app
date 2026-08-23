"use client";

import { useEffect, useState } from "react";
import { TimeAgo } from "@/components/TimeAgo";
import type { StaffRole } from "@/lib/roles";

type StaffUser = {
  id: string;
  email: string | null;
  username: string | null;
  role: StaffRole;
  createdAt: string;
  lastSignInAt: string | null;
};

const ROLE_LABEL: Record<StaffRole, string> = { admin: "Admin", manager: "Manager", user: "User" };
const ROLE_BADGE: Record<StaffRole, string> = {
  admin: "bg-turmeric/20 text-turmeric",
  manager: "bg-pandan/20 text-pandan",
  user: "bg-ink-text/20 text-muted",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<StaffRole>("user");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("user");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to load users");
      setUsers(body.users);
      setCurrentUserId(body.currentUserId);
      setCurrentUserRole(body.currentUserRole);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to load users");
        setUsers(body.users);
        setCurrentUserId(body.currentUserId);
        setCurrentUserRole(body.currentUserRole);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          role === "user" ? { username, password, role } : { email, password, role }
        ),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to add user");
      setEmail("");
      setUsername("");
      setPassword("");
      setRole("user");
      reload();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to add user");
    } finally {
      setAdding(false);
    }
  }

  async function deleteUser(user: StaffUser) {
    if (!window.confirm(`Remove staff access for ${user.username ?? user.email}?`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Failed to remove user");
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl uppercase tracking-wide text-cream">Users</h2>
        <p className="mt-1 font-body text-[12px] text-muted">
          Admins can create any role and remove anyone. Managers can only create User accounts,
          and can&apos;t remove an admin. Users can only view the board.
        </p>
      </div>

      <form onSubmit={addUser} className="flex flex-wrap gap-2.5">
        {role === "user" ? (
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="flex-1 min-w-[180px] rounded-[2px] border border-rail-line bg-rail px-3 py-2 text-[14px] text-cream placeholder:text-muted focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
          />
        ) : (
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="flex-1 min-w-[180px] rounded-[2px] border border-rail-line bg-rail px-3 py-2 text-[14px] text-cream placeholder:text-muted focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
          />
        )}
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 8 chars)"
          className="flex-1 min-w-[180px] rounded-[2px] border border-rail-line bg-rail px-3 py-2 text-[14px] text-cream placeholder:text-muted focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as StaffRole)}
          className="rounded-[2px] border border-rail-line bg-rail px-3 py-2 font-body text-[13px] text-cream focus:outline-none focus:ring-2 focus:ring-chili/25"
        >
          <option value="user">User</option>
          {currentUserRole === "admin" && (
            <>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </>
          )}
        </select>
        <button
          type="submit"
          disabled={adding}
          className="rounded-[2px] bg-chili px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-chili-dim disabled:opacity-50 cursor-pointer"
        >
          {adding ? "Adding…" : "+ Add user"}
        </button>
      </form>
      {addError && <p className="-mt-3 text-[12px] text-chili">{addError}</p>}

      {loading ? (
        <p className="font-body text-[12px] text-muted">Loading…</p>
      ) : loadError ? (
        <p className="font-body text-[12px] text-chili">{loadError}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {users.map((u) => {
            const canDelete = u.id !== currentUserId && (currentUserRole === "admin" || u.role !== "admin");
            return (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-rail-line bg-rail px-4 py-3"
              >
                <div>
                  <p className="flex items-center gap-2 font-body text-[14px] text-cream">
                    {u.username ? `@${u.username}` : u.email}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${ROLE_BADGE[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                    {u.id === currentUserId && (
                      <span className="rounded-full bg-chili/20 px-2 py-0.5 text-[10px] uppercase text-chili">
                        You
                      </span>
                    )}
                  </p>
                  <p className="font-body text-[11px] text-muted">
                    Joined <TimeAgo iso={u.createdAt} />
                    {u.lastSignInAt && (
                      <>
                        {" "}
                        · Last active <TimeAgo iso={u.lastSignInAt} />
                      </>
                    )}
                  </p>
                </div>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => deleteUser(u)}
                    disabled={!canDelete}
                    title={canDelete ? undefined : "Managers can't delete admin accounts"}
                    className="rounded-[2px] border border-rail-line px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wide text-muted transition-colors hover:border-chili hover:text-chili disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rail-line disabled:hover:text-muted cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
