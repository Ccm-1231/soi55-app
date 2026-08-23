"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setInvalid(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setError("Couldn't update password. Try again.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/board"), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-sm rounded-[3px] border border-rail-line bg-rail p-6 text-cream">
        <p className="font-body text-[11px] uppercase tracking-[0.25em] text-muted">
          Soi 55 Thai Kitchen
        </p>
        <h1 className="mb-5 font-display text-2xl uppercase tracking-wide">Set new password</h1>

        {invalid ? (
          <p className="font-body text-[13px] text-chili">
            This reset link is invalid or has expired. Request a new one from the sign-in page.
          </p>
        ) : done ? (
          <p className="font-body text-[13px] text-pandan">Password updated — taking you in…</p>
        ) : !ready ? (
          <p className="font-body text-[12px] text-muted">Checking your link…</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="mb-3 flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-muted">
                New password
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-[2px] border border-rail-line bg-ink px-3 py-2 text-[14px] text-cream focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
              />
            </label>

            <label className="mb-4 flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-muted">
                Confirm password
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="rounded-[2px] border border-rail-line bg-ink px-3 py-2 text-[14px] text-cream focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
              />
            </label>

            {error && <p className="mb-3 text-[12px] text-chili">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-[2px] bg-chili px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-cream transition-colors hover:bg-chili-dim disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
