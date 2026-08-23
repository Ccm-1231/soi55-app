"use client";

import { useState } from "react";
import { StarRating } from "./StarRating";
import { Complaint, COMPARED_LABEL, RETURN_LABEL, SOURCE_LABEL } from "@/lib/types";
import { useOutletName } from "@/lib/outlets";
import { createClient } from "@/lib/supabase/client";
import { actorLabelFor, logActivity } from "@/lib/activity";
import { TimeAgo } from "./TimeAgo";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-[12px] uppercase tracking-wider text-ink-text/50">{label}</span>
      <span className="text-right text-[14px] text-ink-text">{children}</span>
    </div>
  );
}

export function ComplaintDetail({
  complaint: c,
  onActionPlanSaved,
}: {
  complaint: Complaint;
  onActionPlanSaved?: (id: string, actionPlan: string, updatedAt: string) => void;
}) {
  const hasSurvey =
    c.foodRating || c.serviceRating || c.valueRating || c.comparedToPrevious || c.returnLikelihood;
  const outletName = useOutletName(c.locationSlug);

  const [actionPlan, setActionPlan] = useState(c.actionPlan ?? "");
  const [savedAt, setSavedAt] = useState(c.actionPlanUpdatedAt);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  async function saveActionPlan() {
    setSaving(true);
    const updatedAt = new Date().toISOString();
    const supabase = createClient();
    const { error } = await supabase
      .from("complaints")
      .update({ action_plan: actionPlan.trim() || null, action_plan_updated_at: updatedAt })
      .eq("ticket_number", c.id);
    setSaving(false);
    if (!error) {
      setSavedAt(updatedAt);
      setJustSaved(true);
      onActionPlanSaved?.(c.id, actionPlan.trim(), updatedAt);
      const { data } = await supabase.auth.getUser();
      logActivity(supabase, actorLabelFor(data.user), "action_plan_saved", c.id, {
        preview: actionPlan.trim().slice(0, 140),
      });
      setTimeout(() => setJustSaved(false), 1500);
    }
  }

  return (
    <div className="flex flex-col divide-y divide-ink-text/10 text-ink-text">
      <div className="pb-2">
        <p className="text-[11px] uppercase tracking-wider text-ink-text/50">
          #{c.id} · {outletName} · {SOURCE_LABEL[c.source]} · <TimeAgo iso={c.submittedAt} />
        </p>
      </div>

      {hasSurvey && (
        <div className="flex flex-col gap-1">
          {c.foodRating !== undefined && (
            <Row label="Food">
              <StarRating value={c.foodRating} size="sm" />
            </Row>
          )}
          {c.serviceRating !== undefined && (
            <Row label="Service">
              <StarRating value={c.serviceRating} size="sm" />
            </Row>
          )}
          {c.valueRating !== undefined && (
            <Row label="Portion & value">
              <StarRating value={c.valueRating} size="sm" />
            </Row>
          )}
          {c.comparedToPrevious && (
            <Row label="Vs. previous visit">{COMPARED_LABEL[c.comparedToPrevious]}</Row>
          )}
          {c.returnLikelihood && <Row label="Will return">{RETURN_LABEL[c.returnLikelihood]}</Row>}
        </div>
      )}

      {c.dishesOrdered && c.dishesOrdered.length > 0 && (
        <div className="py-3">
          <p className="mb-1.5 text-[12px] uppercase tracking-wider text-ink-text/50">Dishes ordered</p>
          <div className="flex flex-wrap gap-1.5">
            {c.dishesOrdered.map((d) => (
              <span
                key={d}
                className="rounded-full border border-pandan/40 bg-pandan/10 px-2.5 py-0.5 text-[12px] text-pandan-dim"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="py-3">
        <p className="mb-1 text-[12px] uppercase tracking-wider text-ink-text/50">
          What they&apos;d change
        </p>
        <p className="text-[14px] leading-snug">&ldquo;{c.description}&rdquo;</p>
      </div>

      {c.additionalNotes && (
        <div className="py-3">
          <p className="mb-1 text-[12px] uppercase tracking-wider text-ink-text/50">Anything else</p>
          <p className="text-[14px] leading-snug">{c.additionalNotes}</p>
        </div>
      )}

      {(c.guestName || c.guestContact) && (
        <Row label="Contact">{[c.guestName, c.guestContact].filter(Boolean).join(" · ")}</Row>
      )}

      {c.couponCode && <Row label="Coupon">{c.couponCode}</Row>}
      {c.drawEntryNumber && <Row label="Draw entry">{c.drawEntryNumber}</Row>}

      <div className="py-3">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[12px] uppercase tracking-wider text-ink-text/50">
            Manager&apos;s action plan
          </p>
          {savedAt && (
            <p className="text-[11px] text-ink-text/40">
              Updated <TimeAgo iso={savedAt} />
            </p>
          )}
        </div>
        <textarea
          value={actionPlan}
          onChange={(e) => setActionPlan(e.target.value)}
          placeholder="What did we do about this? e.g. Retrained kitchen staff on allergy checks, apologized to guest with a follow-up call…"
          className="w-full min-h-[80px] resize-none rounded-[2px] border border-ink-text/15 bg-white/60 px-3 py-2 text-[14px] text-ink-text placeholder:text-ink-text/40 focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
        />
        <button
          type="button"
          onClick={saveActionPlan}
          disabled={saving}
          className="mt-2 rounded-[2px] bg-chili px-4 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-chili-dim disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving…" : justSaved ? "Saved ✓" : "Save action plan"}
        </button>
      </div>
    </div>
  );
}
