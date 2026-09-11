"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { rowToComplaint, type ComplaintRow } from "@/lib/supabase/mappers";
import type { Complaint } from "@/lib/types";
import { normalizedMyPhone } from "@/lib/reviewGoal";
import { playDrawTick, playDrawFanfare, playTestTone } from "@/lib/sound";
import { monthLabel } from "@/lib/time";
import { MultiSelectDropdown } from "@/components/MultiSelectDropdown";

type Entry = {
  phone: string;
  name: string;
  ticket: string;
  drawEntry?: string;
};

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 4)}-***-${phone.slice(-2)}`;
}

const SHUFFLE_DURATION_MS = 6000;
const SHUFFLE_START_DELAY = 60;
const SHUFFLE_END_DELAY = 450;

export default function LuckyDrawPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilters, setMonthFilters] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [spinning, setSpinning] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [winner, setWinner] = useState<Entry | null>(null);
  const [muted, setMuted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("complaints")
      .select("*")
      .then(({ data }) => {
        setComplaints(((data as ComplaintRow[] | null) ?? []).map(rowToComplaint));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const c of complaints) set.add(c.submittedAt.slice(0, 7));
    return [...set].sort().reverse();
  }, [complaints]);

  const allEligible = useMemo(() => {
    const seen = new Map<string, Entry>();
    for (const c of complaints) {
      if (
        monthFilters.length > 0 &&
        !monthFilters.some((m) => c.submittedAt.startsWith(m))
      )
        continue;
      const phone = normalizedMyPhone(c.guestContact);
      if (!phone || seen.has(phone)) continue;
      seen.set(phone, {
        phone,
        name: c.guestName?.trim() || "Guest",
        ticket: c.id,
        drawEntry: c.drawEntryNumber,
      });
    }
    return [...seen.values()];
  }, [complaints, monthFilters]);

  const pool = useMemo(
    () => allEligible.filter((e) => !excluded.has(e.phone)),
    [allEligible, excluded]
  );

  function resetDrawState() {
    setExcluded(new Set());
    setWinner(null);
    setDisplayName(null);
  }

  function toggleMonth(m: string) {
    setMonthFilters((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
    resetDrawState();
  }

  function clearMonths() {
    setMonthFilters([]);
    resetDrawState();
  }

  function startDraw() {
    if (spinning) return;
    const excludeSet = winner ? new Set(excluded).add(winner.phone) : excluded;
    const effectivePool = allEligible.filter((e) => !excludeSet.has(e.phone));
    if (effectivePool.length === 0) return;

    setExcluded(excludeSet);
    setWinner(null);
    setSpinning(true);

    const winnerEntry = effectivePool[Math.floor(Math.random() * effectivePool.length)];
    const startTime = Date.now();

    function tick() {
      const elapsed = Date.now() - startTime;
      if (elapsed >= SHUFFLE_DURATION_MS) {
        setDisplayName(winnerEntry.name);
        setWinner(winnerEntry);
        setSpinning(false);
        if (!mutedRef.current) playDrawFanfare();
        return;
      }
      const progress = elapsed / SHUFFLE_DURATION_MS;
      const delay = SHUFFLE_START_DELAY + (SHUFFLE_END_DELAY - SHUFFLE_START_DELAY) * progress * progress;
      const random = effectivePool[Math.floor(Math.random() * effectivePool.length)];
      setDisplayName(random.name);
      if (!mutedRef.current) playDrawTick();
      timeoutRef.current = setTimeout(tick, delay);
    }
    tick();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl uppercase tracking-wide text-cream">Lucky Draw</h2>
        <p className="mt-1 font-body text-[12px] text-muted">
          One entry per unique phone number (matches the monthly review target&apos;s validation).
          Picking a new winner excludes the previous one until you change the filter.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <MultiSelectDropdown
          label="Month"
          options={months.map((m) => ({ value: m, label: monthLabel(m) }))}
          selected={monthFilters}
          onToggle={toggleMonth}
          onClear={clearMonths}
        />
        <span className="font-body text-[12px] text-muted">
          {loading ? "Loading…" : `${pool.length} eligible ${pool.length === 1 ? "entry" : "entries"}`}
        </span>
      </div>

      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-[3px] border border-rail-line bg-rail px-6 py-10 text-center">
        {winner ? (
          <>
            <p className="font-body text-[13px] uppercase tracking-[0.2em] text-turmeric">
              🎉 We have a winner!
            </p>
            <p className="font-display text-4xl uppercase tracking-wide text-cream sm:text-5xl">
              {winner.name}
            </p>
            <p className="font-body text-[16px] text-cream/80">{maskPhone(winner.phone)}</p>
            {winner.drawEntry && (
              <p className="font-body text-[12px] text-muted">
                {winner.drawEntry} · Ticket #{winner.ticket}
              </p>
            )}
          </>
        ) : (
          <p className="font-display text-3xl uppercase tracking-wide text-cream sm:text-4xl">
            {displayName ?? (pool.length === 0 ? "No eligible entries" : "Ready to draw")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={startDraw}
          disabled={spinning || pool.length === 0 || (winner ? pool.length <= 1 : pool.length === 0)}
          className="rounded-[2px] bg-chili px-5 py-2.5 font-body text-[13px] font-bold uppercase tracking-wider text-cream transition-colors hover:bg-chili-dim disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {spinning ? "Drawing…" : winner ? "Draw again" : "Start draw"}
        </button>
        <button
          type="button"
          onClick={() => setMuted((v) => !v)}
          aria-pressed={muted}
          title={muted ? "Unmute draw sounds" : "Mute draw sounds"}
          className="rounded-[2px] border border-rail-line px-3.5 py-2.5 font-body text-[13px] text-muted transition-colors hover:text-cream cursor-pointer"
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <button
          type="button"
          onClick={() => playTestTone()}
          className="rounded-[2px] border border-rail-line px-3.5 py-2.5 font-body text-[12px] text-muted transition-colors hover:text-cream cursor-pointer"
        >
          Test sound
        </button>
        {excluded.size > 0 && (
          <button
            onClick={() => {
              setExcluded(new Set());
              setWinner(null);
              setDisplayName(null);
            }}
            className="rounded-[2px] border border-rail-line px-5 py-2.5 font-body text-[12px] font-semibold uppercase tracking-wide text-muted transition-colors hover:text-cream cursor-pointer"
          >
            Reset excluded ({excluded.size})
          </button>
        )}
      </div>
    </div>
  );
}
