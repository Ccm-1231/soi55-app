"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TicketCard } from "@/components/TicketCard";
import { Complaint, ComplaintStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { rowToComplaint, type ComplaintRow } from "@/lib/supabase/mappers";
import { OutletsProvider, type Outlet } from "@/lib/outlets";
import { InsightsPanel } from "@/components/InsightsPanel";
import { MonthlyGoalStrip } from "@/components/MonthlyGoalStrip";
import { DownloadButton } from "@/components/DownloadButton";
import { ChangePasswordButton } from "@/components/ChangePasswordButton";
import { canManage, roleOf } from "@/lib/roles";
import { actorLabelFor, logActivity } from "@/lib/activity";

const COLUMNS: { status: ComplaintStatus; title: string; accent: string }[] = [
  { status: "new", title: "New", accent: "text-chili" },
  { status: "in_progress", title: "In progress", accent: "text-turmeric" },
  { status: "resolved", title: "Resolved", accent: "text-pandan" },
];

const PRIORITY_RANK: Record<string, number> = { red: 0, yellow: 1, green: 2 };
function byPriority(a: Complaint, b: Complaint): number {
  const rankA = a.priority ? PRIORITY_RANK[a.priority] : 3;
  const rankB = b.priority ? PRIORITY_RANK[b.priority] : 3;
  return rankA - rankB;
}

const NEXT_STATUS: Partial<Record<ComplaintStatus, ComplaintStatus>> = {
  new: "in_progress",
  in_progress: "resolved",
};

const PREV_STATUS: Partial<Record<ComplaintStatus, ComplaintStatus>> = {
  in_progress: "new",
  resolved: "in_progress",
};

export default function BoardPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [showManageLink, setShowManageLink] = useState(false);
  const [actorLabel, setActorLabel] = useState("unknown");
  const [activeTab, setActiveTab] = useState<"dashboard" | "board">("dashboard");

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("complaints").select("*").order("submitted_at", { ascending: false }),
      supabase.from("outlets").select("id, slug, name").order("created_at", { ascending: true }),
      supabase.auth.getUser(),
    ]).then(([complaintsRes, outletsRes, { data: userRes }]) => {
      setComplaints(((complaintsRes.data as ComplaintRow[] | null) ?? []).map(rowToComplaint));
      setOutlets((outletsRes.data as Outlet[] | null) ?? []);
      setShowManageLink(canManage(roleOf(userRes.user?.app_metadata)));
      setActorLabel(actorLabelFor(userRes.user));
      setLoading(false);
    });
  }, []);

  async function refreshComplaints() {
    const supabase = createClient();
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .order("submitted_at", { ascending: false });
    setComplaints(((data as ComplaintRow[] | null) ?? []).map(rowToComplaint));
  }

  const visible = useMemo(
    () =>
      locationFilter === "all"
        ? complaints
        : complaints.filter((c) => c.locationSlug === locationFilter),
    [complaints, locationFilter]
  );

  const totalCounts = useMemo(
    () => ({
      new: complaints.filter((c) => c.status === "new").length,
      in_progress: complaints.filter((c) => c.status === "in_progress").length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
    }),
    [complaints]
  );

  async function advance(id: string) {
    const current = complaints.find((c) => c.id === id);
    const next = current && NEXT_STATUS[current.status];
    if (!next) return;

    const now = new Date().toISOString();
    const resolvedAt = next === "resolved" ? now : current?.resolvedAt;
    const pickedUpBy = next === "in_progress" ? actorLabel : current?.pickedUpBy;
    const pickedUpAt = next === "in_progress" ? now : current?.pickedUpAt;
    const resolvedBy = next === "resolved" ? actorLabel : current?.resolvedBy;

    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: next, resolvedAt, pickedUpBy, pickedUpAt, resolvedBy } : c
      )
    );

    const supabase = createClient();
    await supabase
      .from("complaints")
      .update({
        status: next,
        resolved_at: resolvedAt ?? null,
        picked_up_by: pickedUpBy ?? null,
        picked_up_at: pickedUpAt ?? null,
        resolved_by: resolvedBy ?? null,
      })
      .eq("ticket_number", id);

    logActivity(supabase, actorLabel, "advance_status", id, {
      from: current?.status,
      to: next,
    });
  }

  async function revert(id: string) {
    const current = complaints.find((c) => c.id === id);
    const prev = current && PREV_STATUS[current.status];
    if (!prev) return;

    const resolvedAt = prev === "resolved" ? current?.resolvedAt : undefined;
    const pickedUpBy = current?.status === "in_progress" ? undefined : current?.pickedUpBy;
    const pickedUpAt = current?.status === "in_progress" ? undefined : current?.pickedUpAt;
    const resolvedBy = current?.status === "resolved" ? undefined : current?.resolvedBy;

    setComplaints((prevList) =>
      prevList.map((c) =>
        c.id === id ? { ...c, status: prev, resolvedAt, pickedUpBy, pickedUpAt, resolvedBy } : c
      )
    );

    const supabase = createClient();
    await supabase
      .from("complaints")
      .update({
        status: prev,
        resolved_at: resolvedAt ?? null,
        picked_up_by: pickedUpBy ?? null,
        picked_up_at: pickedUpAt ?? null,
        resolved_by: resolvedBy ?? null,
      })
      .eq("ticket_number", id);

    logActivity(supabase, actorLabel, "revert_status", id, {
      from: current?.status,
      to: prev,
    });
  }

  function actionPlanSaved(id: string, actionPlan: string, updatedAt: string) {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, actionPlan, actionPlanUpdatedAt: updatedAt } : c))
    );
  }

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
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted">Soi 55 Thai Kitchen</p>
            <h1 className="font-display text-3xl uppercase tracking-wide text-cream sm:text-4xl">
              Customer Review Board
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {showManageLink && (
              <Link
                href="/admin"
                className="rounded-[2px] border border-rail-line px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-wide text-muted transition-colors hover:text-cream"
              >
                Admin
              </Link>
            )}
            <ChangePasswordButton />
            <button
              onClick={signOut}
              className="rounded-[2px] border border-rail-line px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-wide text-muted transition-colors hover:text-cream cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap gap-1.5">
          {(["dashboard", "board"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-[2px] px-3.5 py-2 font-body text-[12px] font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
                activeTab === tab ? "bg-chili text-cream" : "text-muted hover:text-cream"
              }`}
            >
              {tab === "dashboard" ? "Dashboard" : "Board"}
            </button>
          ))}
        </nav>
      </header>

      {loading && (
        <p className="px-5 py-6 font-body text-[12px] text-muted sm:px-8">Loading complaints…</p>
      )}

      {!loading && activeTab === "dashboard" && (
        <div className="pt-6">
          <MonthlyGoalStrip complaints={complaints} outlets={outlets} />
          <InsightsPanel
            counts={totalCounts}
            complaints={complaints}
            outlets={outlets}
            onGenerated={refreshComplaints}
          />
        </div>
      )}

      {!loading && activeTab === "board" && (
        <OutletsProvider outlets={outlets}>
          <main className="flex-1 px-5 py-6 sm:px-8">
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="rounded-[2px] border border-rail-line bg-rail px-3 py-2 font-body text-[12px] uppercase tracking-wide text-cream focus:outline-none focus:ring-2 focus:ring-chili/40"
              >
                <option value="all">All locations</option>
                {outlets.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.name}
                  </option>
                ))}
              </select>
              <DownloadButton complaints={visible} outlets={outlets} />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {COLUMNS.map((col) => {
                const items = visible.filter((c) => c.status === col.status).sort(byPriority);
                return (
                  <section key={col.status} className="flex flex-col gap-3">
                    <div className="flex items-baseline gap-2 border-b border-rail-line pb-2">
                      <h2 className={`font-display text-xl uppercase tracking-wide ${col.accent}`}>
                        {col.title}
                      </h2>
                      <span className="font-body text-[12px] text-muted">{items.length}</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {items.length === 0 && (
                        <p className="rounded-[3px] border border-dashed border-rail-line px-3 py-6 text-center font-body text-[12px] text-muted">
                          Nothing here
                        </p>
                      )}
                      {items.map((c) => (
                        <TicketCard
                          key={c.id}
                          complaint={c}
                          onAdvance={advance}
                          onRevert={revert}
                          onActionPlanSaved={actionPlanSaved}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </main>
        </OutletsProvider>
      )}
    </div>
  );
}
