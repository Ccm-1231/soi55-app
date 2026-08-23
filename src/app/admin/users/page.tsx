"use client";

import { useEffect, useState } from "react";
import { TimeAgo } from "@/components/TimeAgo";

type StaffUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to add user");
      setEmail("");
      setPassword("");
      reload();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to add user");
    } finally {
      setAdding(false);
    }
  }

  async function deleteUser(user: StaffUser) {
    if (!window.confirm(`Remove staff access for ${user.email}?`)) return;
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
      <h2 className="font-display text-2xl uppercase tracking-wide text-cream">Users</h2>

      <form onSubmit={addUser} className="flex flex-wrap gap-2.5">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="flex-1 min-w-[180px] rounded-[2px] border border-rail-line bg-rail px-3 py-2 text-[14px] text-cream placeholder:text-muted focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 8 chars)"
          className="flex-1 min-w-[180px] rounded-[2px] border border-rail-line bg-rail px-3 py-2 text-[14px] text-cream placeholder:text-muted focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
        />
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
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-rail-line bg-rail px-4 py-3"
            >
              <div>
                <p className="font-body text-[14px] text-cream">
                  {u.email}
                  {u.id === currentUserId && (
                    <span className="ml-2 rounded-full bg-chili/20 px-2 py-0.5 text-[10px] uppercase text-chili">
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
                  className="rounded-[2px] border border-rail-line px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wide text-muted transition-colors hover:border-chili hover:text-chili cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
