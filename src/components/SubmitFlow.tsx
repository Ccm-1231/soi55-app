"use client";

import { useState } from "react";
import { GuestSurveyForm, GuestSurveyValues } from "./GuestSurveyForm";
import { generateCouponCode, generateDrawEntryNumber } from "@/lib/rewards";
import { timeAgo } from "@/lib/time";
import { useLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { ComplaintRow } from "@/lib/supabase/mappers";
import type { DishRow, SurveyQuestionRow } from "@/lib/survey";

export function SubmitFlow({
  locationSlug,
  locationDisplayName,
  questions,
  dishes,
}: {
  locationSlug: string;
  locationDisplayName: string;
  questions: SurveyQuestionRow[];
  dishes: DishRow[];
}) {
  const { t } = useLocale();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [drawEntry, setDrawEntry] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: GuestSurveyValues) {
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const coupon = generateCouponCode();
    const draw = generateDrawEntryNumber();

    const { data, error: insertError } = await supabase
      .from("complaints")
      .insert({
        location_slug: locationSlug,
        source: "self_submit",
        description: values.changeRequest,
        guest_name: values.guestName || null,
        guest_contact: values.guestContact || null,
        food_rating: values.foodRating ?? null,
        service_rating: values.serviceRating ?? null,
        value_rating: values.valueRating ?? null,
        compared_to_previous: values.comparedToPrevious ?? null,
        return_likelihood: values.returnLikelihood ?? null,
        dishes_ordered: values.dishesOrdered,
        additional_notes: values.additionalNotes || null,
        coupon_code: coupon,
        draw_entry_number: draw,
      })
      .select()
      .single<ComplaintRow>();

    setSubmitting(false);

    if (insertError || !data) {
      setError("Something went wrong sending your feedback. Please try again.");
      return;
    }

    setTicketId(data.ticket_number);
    setSubmittedAt(data.submitted_at);
    setCouponCode(data.coupon_code);
    setDrawEntry(data.draw_entry_number);
  }

  if (ticketId && submittedAt && couponCode && drawEntry) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-pandan">{t.confirm.received}</p>
        <h2 className="font-display text-3xl uppercase tracking-wide">{t.confirm.title}</h2>
        <p className="text-[14px] leading-relaxed text-ink-text/75">
          {t.confirm.body.replace("{location}", locationDisplayName)}
        </p>

        <div className="rounded-[2px] border border-dashed border-turmeric/50 bg-turmeric/10 px-3 py-3 text-left">
          <p className="text-[12px] text-ink-text/60">{t.confirm.couponLabel}</p>
          <p className="font-display text-2xl tracking-wide text-chili">{couponCode}</p>
          <p className="mt-2 text-[12px] text-ink-text/60">{t.confirm.drawLabel}</p>
          <p className="font-display text-2xl tracking-wide text-chili">{drawEntry}</p>
          <p className="mt-2 text-[11px] text-ink-text/50">{t.confirm.showScreen}</p>
        </div>

        <div className="ticket-tear mt-1" style={{ ["--notch-color" as string]: "var(--color-ink)" }} />
        <div className="flex items-center justify-between pt-1">
          <span className="text-[12px] text-ink-text/55">{t.confirm.ticket}</span>
          <span className="text-[13px] font-semibold">#{ticketId}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-ink-text/55">{t.confirm.submitted}</span>
          <span className="text-[13px]">{timeAgo(submittedAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <GuestSurveyForm
      questions={questions}
      dishes={dishes}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitError={error}
    />
  );
}
