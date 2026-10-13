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
import { FilterDropdown } from "@/components/FilterDropdown";
import { MultiSelectDropdown } from "@/components/MultiSelectDropdown";
import { canManage, roleOf, type StaffRole } from "@/lib/roles";
import { actorLabelFor, logActivity } from "@/lib/activity";
import { monthKey, monthLabel } from "@/lib/time";

type BoardColumnKey = "new" | "checked";

const COLUMNS: { key: BoardColumnKey; title: string; accent: string }[] = [
  { key: "new", title: "New", accent: "text-chili" },
  { key: "checked", title: "Checked", accent: "text-pandan" },
];

function columnOf(c: Complaint): BoardColumnKey {
  return c.status === "new" ? "new" : "checked";
}

const PRIORITY_RANK: Record<string, number> = { red: 0, yellow: 1, green: 2 };
function byPriority(a: Complaint, b: Complaint): number {
  const rankA = a.priority ? PRIORITY_RANK[a.priority] : 3;
  const rankB = b.priority ? PRIORITY_RANK[b.priority] : 3;
  return rankA - rankB;
}

function byDayDesc(a: Complaint, b: Complaint): number {
  return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
}

function byDayAsc(a: Complaint, b: Complaint): number {
  return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
}

type SortMode = "priority" | "location" | "day_desc" | "day_asc";

const NEXT_STATUS: Partial<Record<ComplaintStatus, ComplaintStatus>> = {
  new: "resolved",
};

const PREV_STATUS: Partial<Record<ComplaintStatus, ComplaintStatus>> = {
  resolved: "new",
  in_progress: "new",
};

export default function BoardPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilters, setLocationFilters] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("priority");
  const [showManageLink, setShowManageLink] = useState(false);
  const [role, setRole] = useState<StaffRole>("user");
  const [actorLabel, setActorLabel] = useState("unknown");
  const [activeTab, setActiveTab] = useState<"dashboard" | "board">("dashboard");
  const isAdmin = role === "admin";

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("complaints").select("*").order("submitted_at", { ascending: false }),
      supabase.from("outlets").select("id, slug, name").order("created_at", { ascending: true }),
      supabase.auth.getUser(),
    ]).then(([complaintsRes, outletsRes, { data: userRes }]) => {
      setComplaints(((complaintsRes.data as ComplaintRow[] | null) ?? []).map(rowToComplaint));
      setOutlets((outletsRes.data as Outlet[] | null) ?? []);
      const userRole = roleOf(userRes.user?.app_metadata);
      const canView = canManage(userRole);
      setShowManageLink(canView);
      setRole(userRole);
      if (!canView) setActiveTab("board");
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

  const monthOptions = useMemo(() => {
    const keys = Array.from(new Set(complaints.map((c) => monthKey(c.submittedAt))));
    return keys.sort().reverse();
  }, [complaints]);

  // Default to the most recent month until the user explicitly picks one.
  const effectiveMonth = selectedMonth ?? monthOptions[0] ?? null;

  function toggleLocation(slug: string) {
    setLocationFilters((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  const outletNameOf = useMemo(() => {
    const map = new Map(outlets.map((o) => [o.slug, o.name]));
    return (slug: string) => map.get(slug) ?? slug;
  }, [outlets]);

  function byLocation(a: Complaint, b: Complaint): number {
    return outletNameOf(a.locationSlug).localeCompare(outletNameOf(b.locationSlug));
  }

  const sortComparator =
    sortMode === "priority"
      ? byPriority
      : sortMode === "location"
        ? byLocation
        : sortMode === "day_desc"
          ? byDayDesc
          : byDayAsc;

  const visible = useMemo(
    () =>
      complaints
        .filter((c) => locationFilters.length === 0 || locationFilters.includes(c.locationSlug))
        .filter((c) => effectiveMonth === null || monthKey(c.submittedAt) === effectiveMonth),
    [complaints, locationFilters, effectiveMonth]
  );

  const totalCounts = useMemo(
    () => ({
      new: complaints.filter((c) => c.status === "new").length,
      resolved: complaints.filter((c) => c.status !== "new").length,
    }),
    [complaints]
  );

  async function advance(id: string) {
    const current = complaints.find((c) => c.id === id);
    const next = current && NEXT_STATUS[current.status];
    if (!next) return;

    const resolvedAt = new Date().toISOString();
    const resolvedBy = actorLabel;

    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: next, resolvedAt, resolvedBy } : c))
    );

    const supabase = createClient();
    await supabase
      .from("complaints")
      .update({ status: next, resolved_at: resolvedAt, resolved_by: resolvedBy })
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

    setComplaints((prevList) =>
      prevList.map((c) =>
        c.id === id
          ? {
              ...c,
              status: prev,
              resolvedAt: undefined,
              resolvedBy: undefined,
              pickedUpAt: undefined,
              pickedUpBy: undefined,
            }
          : c
      )
    );

    const supabase = createClient();
    await supabase
      .from("complaints")
      .update({
        status: prev,
        resolved_at: null,
        resolved_by: null,
        picked_up_at: null,
        picked_up_by: null,
      })
      .eq("ticket_number", id);

    logActivity(supabase, actorLabel, "revert_status", id, {
      from: current?.status,
      to: prev,
    });
  }

  async function deleteTickets(ticketNumbers: string[]) {
    const res = await fetch("/api/admin/complaints", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketNumbers }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Failed to delete");
      return;
    }
    setComplaints((prev) => prev.filter((c) => !ticketNumbers.includes(c.id)));
  }

  function deleteOne(id: string) {
    if (!window.confirm(`Delete ticket #${id}? This can't be undone.`)) return;
    deleteTickets([id]);
  }

  function deleteVisible() {
    const ticketNumbers = visible.map((c) => c.id);
    if (ticketNumbers.length === 0) return;
    const label = effectiveMonth ? monthLabel(effectiveMonth) : "the selected period";
    if (
      !window.confirm(
        `Delete all ${ticketNumbers.length} reviews shown for ${label}? This can't be undone.`
      )
    )
      return;
    deleteTickets(ticketNumbers);
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

        {showManageLink && (
          <nav className="mt-4 flex flex-wrap gap-1.5">
            {(["dashboard", "board"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-[2px] px-3.5 py-2 font-body text-[12px] font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
                  activeTab === tab ? "bg-chili text-cream" : "text-muted hover:text-cream"
                }`}
              >
                {tab === "dashboard" ? "Dashboard" : "Reviews"}
              </button>
            ))}
          </nav>
        )}
      </header>

      {loading && (
        <p className="px-5 py-6 font-body text-[12px] text-muted sm:px-8">Loading complaints…</p>
      )}

      {!loading && showManageLink && activeTab === "dashboard" && (
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
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {monthOptions.length > 0 && (
                  <FilterDropdown
                    label="Month"
                    options={monthOptions.map((k) => ({ value: k, label: monthLabel(k) }))}
                    value={effectiveMonth ?? monthOptions[0]}
                    onChange={setSelectedMonth}
                  />
                )}
                <MultiSelectDropdown
                  label="Locations"
                  options={outlets.map((o) => ({ value: o.slug, label: o.name }))}
                  selected={locationFilters}
                  onToggle={toggleLocation}
                  onClear={() => setLocationFilters([])}
                />
                <FilterDropdown
                  label="Sort by"
                  options={[
                    { value: "priority", label: "Priority" },
                    { value: "location", label: "Location" },
                    { value: "day_desc", label: "Day (descending)" },
                    { value: "day_asc", label: "Day (ascending)" },
                  ]}
                  value={sortMode}
                  onChange={setSortMode}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {isAdmin && visible.length > 0 && (
                  <button
                    onClick={deleteVisible}
                    className="rounded-[2px] border border-chili/40 px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-wide text-chili transition-colors hover:bg-chili/10 cursor-pointer"
                  >
                    Delete {visible.length} shown
                  </button>
                )}
                <DownloadButton complaints={visible} outlets={outlets} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {COLUMNS.map((col) => {
                const items = visible.filter((c) => columnOf(c) === col.key).sort(sortComparator);
                return (
                  <section key={col.key} className="flex flex-col gap-3">
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
                          onDelete={isAdmin ? deleteOne : undefined}
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
