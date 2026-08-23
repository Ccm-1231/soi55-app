"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Wrong email or password.");
      return;
    }
    router.push(searchParams.get("next") || "/board");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[3px] border border-rail-line bg-rail p-6 text-cream"
      >
        <p className="font-body text-[11px] uppercase tracking-[0.25em] text-muted">
          Soi 55 Thai Kitchen
        </p>
        <h1 className="mb-5 font-display text-2xl uppercase tracking-wide">Staff login</h1>

        <label className="mb-3 flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-muted">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[2px] border border-rail-line bg-ink px-3 py-2 text-[14px] text-cream focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
          />
        </label>

        <label className="mb-4 flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-muted">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[2px] border border-rail-line bg-ink px-3 py-2 text-[14px] text-cream focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
          />
        </label>

        {error && <p className="mb-3 text-[12px] text-chili">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[2px] bg-chili px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-cream transition-colors hover:bg-chili-dim disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
