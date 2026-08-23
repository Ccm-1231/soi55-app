"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordButton() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setLoading(false);
    setDone(false);
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    const email = userRes.user?.email;
    if (!email) {
      setLoading(false);
      setError("Couldn't verify your account. Try signing in again.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      setLoading(false);
      setError("Current password is incorrect.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError("Couldn't update password. Try again.");
      return;
    }
    setDone(true);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-[2px] border border-rail-line px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-wide text-muted transition-colors hover:text-cream cursor-pointer"
      >
        Change password
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-[3px] border border-rail-line bg-rail p-6 text-cream shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]">
            {done ? (
              <div className="text-center">
                <h2 className="mb-2 font-display text-xl uppercase tracking-wide">Password updated</h2>
                <p className="mb-4 font-body text-[13px] text-cream/80">
                  Your password has been changed.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-[2px] bg-chili px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-cream transition-colors hover:bg-chili-dim cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2 className="mb-4 font-display text-xl uppercase tracking-wide">Change password</h2>
                <form onSubmit={submit}>
                  <label className="mb-3 flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-muted">
                      Current password
                    </span>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="rounded-[2px] border border-rail-line bg-ink px-3 py-2 text-[14px] text-cream focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
                    />
                  </label>
                  <label className="mb-3 flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-muted">
                      New password
                    </span>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="rounded-[2px] border border-rail-line bg-ink px-3 py-2 text-[14px] text-cream focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
                    />
                  </label>
                  <label className="mb-2 flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-muted">
                      Confirm new password
                    </span>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-[2px] border border-rail-line bg-ink px-3 py-2 text-[14px] text-cream focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
                    />
                  </label>

                  {error && <p className="mb-3 font-body text-[12px] text-chili">{error}</p>}

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={close}
                      className="flex-1 rounded-[2px] border border-rail-line px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-muted transition-colors hover:text-cream cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-[2px] bg-chili px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-cream transition-colors hover:bg-chili-dim disabled:opacity-60 cursor-pointer"
                    >
                      {loading ? "Updating…" : "Update password"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
