"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let loginEmail = identifier;
    if (!identifier.includes("@")) {
      try {
        const res = await fetch("/api/resolve-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: identifier }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error();
        loginEmail = body.email;
      } catch {
        setLoading(false);
        setError("Wrong username or password.");
        return;
      }
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    setLoading(false);
    if (error) {
      setError("Wrong email/username or password.");
      return;
    }
    router.push(searchParams.get("next") || "/board");
    router.refresh();
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      setResetError("Couldn't send reset link. Try again.");
      return;
    }
    setResetSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-signal px-4 py-10">
      <Image
        src="/soi55-logo.jpg"
        alt="Soi 55 Thai Kitchen"
        width={1080}
        height={738}
        className="h-24 w-auto rounded-[2px]"
        priority
      />

      <div className="w-full max-w-sm rounded-[3px] border border-rail-line bg-rail p-6 text-cream shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]">
        {!showReset ? (
          <>
            <h2 className="mb-5 font-display text-xl uppercase tracking-wide">Staff login</h2>
            <form onSubmit={handleSubmit}>
              <label className="mb-3 flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-muted">
                  Email or username
                </span>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="rounded-[2px] border border-rail-line bg-ink px-3 py-2 text-[14px] text-cream focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
                />
              </label>

              <label className="mb-2 flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-muted">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-[2px] border border-rail-line bg-ink px-3 py-2 text-[14px] text-cream focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowReset(true);
                  setResetEmail(identifier.includes("@") ? identifier : "");
                }}
                className="mb-4 font-body text-[11px] text-turmeric hover:underline cursor-pointer"
              >
                Forgot password?
              </button>

              {error && <p className="mb-3 text-[12px] text-chili">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[2px] bg-chili px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-cream transition-colors hover:bg-chili-dim disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </>
        ) : resetSent ? (
          <div className="text-center">
            <h2 className="mb-2 font-display text-xl uppercase tracking-wide">Check your email</h2>
            <p className="mb-4 font-body text-[13px] text-cream/80">
              If an account exists for {resetEmail}, a reset link is on its way.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowReset(false);
                setResetSent(false);
              }}
              className="font-body text-[12px] text-turmeric hover:underline cursor-pointer"
            >
              ← Back to sign in
            </button>
          </div>
        ) : (
          <>
            <h2 className="mb-1 font-display text-xl uppercase tracking-wide">Reset password</h2>
            <p className="mb-4 font-body text-[12px] text-cream/70">
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={handleReset}>
              <label className="mb-4 flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-muted">Email</span>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="rounded-[2px] border border-rail-line bg-ink px-3 py-2 text-[14px] text-cream focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
                />
              </label>

              {resetError && <p className="mb-3 text-[12px] text-chili">{resetError}</p>}

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="flex-1 rounded-[2px] border border-rail-line px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-muted transition-colors hover:text-cream cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 rounded-[2px] bg-chili px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-cream transition-colors hover:bg-chili-dim disabled:opacity-60 cursor-pointer"
                >
                  {resetLoading ? "Sending…" : "Send link"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
