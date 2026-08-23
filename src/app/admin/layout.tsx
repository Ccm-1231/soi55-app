"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { href: "/admin/outlets", label: "Outlets" },
  { href: "/admin/dishes", label: "Dishes" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/activity", label: "Activity" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="border-b border-rail-line px-5 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted">
              Soi 55 Thai Kitchen
            </p>
            <h1 className="font-display text-3xl uppercase tracking-wide text-cream sm:text-4xl">
              Manage
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/board"
              className="rounded-[2px] border border-rail-line px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-wide text-muted transition-colors hover:text-cream"
            >
              ← Board
            </Link>
            <button
              onClick={signOut}
              className="rounded-[2px] border border-rail-line px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-wide text-muted transition-colors hover:text-cream cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>

        <nav className="mt-8 flex flex-wrap justify-start gap-1.5">
          {TABS.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-[2px] px-3.5 py-2 font-body text-[12px] font-semibold uppercase tracking-wide transition-colors ${
                  active ? "bg-chili text-cream" : "text-muted hover:text-cream"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 px-5 py-6 sm:px-8">{children}</main>
    </div>
  );
}
