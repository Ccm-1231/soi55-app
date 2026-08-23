"use client";

import { useEffect, useState } from "react";
import { TimeAgo } from "./TimeAgo";
import { createClient } from "@/lib/supabase/client";
import { actorLabelFor, logActivity } from "@/lib/activity";

type Insight = {
  summary: string;
  counts: { new: number; in_progress: number; resolved: number };
  generated_at: string;
};

export function InsightsPanel({
  counts,
  onGenerated,
}: {
  counts: { new: number; in_progress: number; resolved: number };
  onGenerated?: () => void;
}) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/insights")
      .then((res) => res.json())
      .then((body) => {
        setInsight(body.insight ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to generate");
      setInsight(body.insight);
      onGenerated?.();
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      logActivity(supabase, actorLabelFor(data.user), "insight_generated", null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-5 mb-6 rounded-[3px] border border-rail-line bg-rail p-5 sm:mx-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl uppercase tracking-wide text-cream">
          ✨ AI Insights
        </h2>
        <button
          onClick={generate}
          disabled={generating}
          className="rounded-[2px] bg-chili px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-chili-dim disabled:opacity-50 cursor-pointer"
        >
          {generating ? "Analyzing…" : insight ? "Regenerate" : "Generate summary"}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-[2px] border border-rail-line px-3 py-2.5 text-center">
          <p className="font-display text-2xl text-chili">{counts.new}</p>
          <p className="font-body text-[10px] uppercase tracking-wider text-muted">New</p>
        </div>
        <div className="rounded-[2px] border border-rail-line px-3 py-2.5 text-center">
          <p className="font-display text-2xl text-turmeric">{counts.in_progress}</p>
          <p className="font-body text-[10px] uppercase tracking-wider text-muted">In progress</p>
        </div>
        <div className="rounded-[2px] border border-rail-line px-3 py-2.5 text-center">
          <p className="font-display text-2xl text-pandan">{counts.resolved}</p>
          <p className="font-body text-[10px] uppercase tracking-wider text-muted">Resolved</p>
        </div>
      </div>

      {error && <p className="mb-2 font-body text-[12px] text-chili">{error}</p>}

      {loading ? (
        <p className="font-body text-[12px] text-muted">Loading…</p>
      ) : insight ? (
        <div>
          <p className="whitespace-pre-line font-body text-[13px] leading-relaxed text-cream/90">
            {insight.summary}
          </p>
          <p className="mt-3 font-body text-[11px] text-muted">
            Generated <TimeAgo iso={insight.generated_at} />
          </p>
        </div>
      ) : (
        <p className="font-body text-[12px] text-muted">
          No AI summary yet. Click &ldquo;Generate summary&rdquo; to get a priority briefing and
          red/yellow/green labels on every ticket below.
        </p>
      )}
    </div>
  );
}
