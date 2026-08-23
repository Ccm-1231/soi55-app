"use client";

import { useState } from "react";
import { Complaint, SOURCE_LABEL } from "@/lib/types";
import { useOutletName } from "@/lib/outlets";
import { tiltForId, daysSince } from "@/lib/time";
import { Modal } from "./Modal";
import { ComplaintDetail } from "./ComplaintDetail";
import { TimeAgo } from "./TimeAgo";

const STATUS_ACCENT: Record<Complaint["status"], string> = {
  new: "border-l-chili",
  in_progress: "border-l-turmeric",
  resolved: "border-l-pandan",
};

const PRIORITY_DOT: Record<NonNullable<Complaint["priority"]>, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
};

const PRIORITY_LABEL: Record<NonNullable<Complaint["priority"]>, string> = {
  red: "High priority",
  yellow: "Medium priority",
  green: "Low priority",
};

const UNDO_BUTTON_CLASS =
  "shrink-0 rounded-[2px] border border-ink-text/20 px-2 py-1.5 font-body text-[11px] text-ink-text/55 transition-colors hover:border-ink-text/40 hover:text-ink-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili cursor-pointer";

export function TicketCard({
  complaint,
  onAdvance,
  onRevert,
  onActionPlanSaved,
  notchColor = "var(--color-rail)",
}: {
  complaint: Complaint;
  onAdvance?: (id: string) => void;
  onRevert?: (id: string) => void;
  onActionPlanSaved?: (id: string, actionPlan: string, updatedAt: string) => void;
  notchColor?: string;
}) {
  const tilt = tiltForId(complaint.id);
  const [showDetail, setShowDetail] = useState(false);
  const outletName = useOutletName(complaint.locationSlug);
  const days = daysSince(complaint.submittedAt);
  const overdue = complaint.status !== "resolved" && days >= 3;

  return (
    <>
    <div
      className={`ticket-card overflow-hidden rounded-[3px] border-l-4 bg-paper text-ink-text shadow-[0_4px_14px_-6px_rgba(0,0,0,0.4)] ${STATUS_ACCENT[complaint.status]} ${overdue ? "ticket-overdue" : ""}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="flex items-start justify-between gap-3 px-3.5 pt-3 pb-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 font-body text-[11px] font-medium tracking-wide text-ink-text/60">
            {complaint.priority && (
              <span
                aria-label={PRIORITY_LABEL[complaint.priority]}
                title={PRIORITY_LABEL[complaint.priority]}
                className={`inline-block h-2 w-2 rounded-full ${PRIORITY_DOT[complaint.priority]}`}
              />
            )}
            #{complaint.id}
          </span>
          <span className="font-display text-base uppercase tracking-wide leading-none">
            {outletName}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5 pt-0.5">
          <span className="font-body text-[11px] text-ink-text/50 whitespace-nowrap">
            <TimeAgo iso={complaint.submittedAt} />
          </span>
          <span
            className={`whitespace-nowrap rounded-full px-1.5 py-0.5 font-body text-[10px] ${
              overdue ? "bg-red-600 font-semibold text-white" : "bg-ink-text/10 text-ink-text/55"
            }`}
          >
            Day {days}
          </span>
        </div>
      </div>

      <div className="ticket-tear mx-3.5" style={{ ["--notch-color" as string]: notchColor }} />

      <div className="px-3.5 pt-2.5 pb-3">
        <p className="font-body text-[10px] uppercase tracking-wider text-ink-text/45 mb-1.5">
          {SOURCE_LABEL[complaint.source]}
        </p>
        <p className="text-[13.5px] leading-snug text-ink-text/90 line-clamp-3">
          &ldquo;{complaint.description}&rdquo;
        </p>

        {(complaint.guestName || complaint.guestContact) && (
          <p className="mt-2 font-body text-[11px] text-ink-text/55">
            {[complaint.guestName, complaint.guestContact].filter(Boolean).join(" · ")}
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="mt-2 font-body text-[11px] font-medium text-chili hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili"
        >
          View full details →
        </button>

        <div className="mt-3">
          {complaint.status === "new" && onAdvance && (
            <button
              onClick={() => onAdvance(complaint.id)}
              className="w-full rounded-[2px] bg-chili px-3 py-1.5 font-body text-[11px] font-medium uppercase tracking-wider text-cream transition-colors hover:bg-chili-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili cursor-pointer"
            >
              Start working on it
            </button>
          )}
          {complaint.status === "in_progress" && onAdvance && (
            <div className="flex gap-1.5">
              {onRevert && (
                <button
                  onClick={() => onRevert(complaint.id)}
                  aria-label="Move back to New"
                  title="Move back to New"
                  className={UNDO_BUTTON_CLASS}
                >
                  ↩
                </button>
              )}
              <button
                onClick={() => onAdvance(complaint.id)}
                className="flex-1 rounded-[2px] bg-pandan px-3 py-1.5 font-body text-[11px] font-medium uppercase tracking-wider text-cream transition-colors hover:bg-pandan-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pandan cursor-pointer"
              >
                Mark resolved
              </button>
            </div>
          )}
          {complaint.status === "resolved" && (
            <div className="flex items-center justify-between gap-1.5">
              <p className="font-body text-[11px] text-pandan-dim">
                ✓ Resolved {complaint.resolvedAt ? <TimeAgo iso={complaint.resolvedAt} /> : ""}
              </p>
              {onRevert && (
                <button
                  onClick={() => onRevert(complaint.id)}
                  aria-label="Move back to In progress"
                  title="Move back to In progress"
                  className={UNDO_BUTTON_CLASS}
                >
                  ↩
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    {showDetail && (
      <Modal title={`Ticket #${complaint.id}`} onClose={() => setShowDetail(false)}>
        <ComplaintDetail complaint={complaint} onActionPlanSaved={onActionPlanSaved} />
      </Modal>
    )}
    </>
  );
}
