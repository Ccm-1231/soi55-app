"use client";

import { useState } from "react";
import { StarRating } from "./StarRating";
import { PillGroup } from "./PillGroup";
import { DishPicker } from "./DishPicker";
import { ComparedToPrevious, ReturnLikelihood } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { questionText, type DishRow, type SurveyQuestionRow } from "@/lib/survey";

export type GuestSurveyValues = {
  foodRating?: number;
  serviceRating?: number;
  valueRating?: number;
  comparedToPrevious?: ComparedToPrevious;
  returnLikelihood?: ReturnLikelihood;
  dishesOrdered: string[];
  changeRequest: string;
  additionalNotes: string;
  guestName: string;
  guestContact: string;
};

const inputClass =
  "w-full rounded-[2px] border border-ink-text/15 bg-white/60 px-3 py-2 text-[14px] text-ink-text placeholder:text-ink-text/40 focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25";

function Question({
  n,
  title,
  caption,
  children,
}: {
  n: number;
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-chili text-[11px] font-bold text-cream">
          {n}
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-[14px] font-semibold leading-snug text-ink-text">{title}</p>
          {caption && <p className="text-[12px] text-ink-text/55">{caption}</p>}
        </div>
      </div>
      <div className="pl-[30px]">{children}</div>
    </div>
  );
}

const COMPARED_VALUES: ComparedToPrevious[] = ["better", "same", "worse", "first_visit"];
const RETURN_VALUES: ReturnLikelihood[] = [
  "definitely",
  "probably",
  "not_sure",
  "probably_not",
  "definitely_not",
];

export function GuestSurveyForm({
  questions,
  dishes,
  onSubmit,
  submitting,
  submitError,
}: {
  questions: SurveyQuestionRow[];
  dishes: DishRow[];
  onSubmit: (values: GuestSurveyValues) => void;
  submitting?: boolean;
  submitError?: string | null;
}) {
  const { t, locale } = useLocale();
  const comparedOptions = COMPARED_VALUES.map((v) => ({ value: v, label: t.compared[v] }));
  const returnOptions = RETURN_VALUES.map((v) => ({ value: v, label: t.returnLikelihood[v] }));
  const dishOptions = dishes.map((d) => ({ value: d.name, label: d.name }));

  const byKey = Object.fromEntries(questions.map((q) => [q.key, q]));
  const q1 = byKey.q1 && questionText(byKey.q1, locale);
  const q2 = byKey.q2 && questionText(byKey.q2, locale);
  const q3 = byKey.q3 && questionText(byKey.q3, locale);
  const q4 = byKey.q4 && questionText(byKey.q4, locale);
  const q5 = byKey.q5 && questionText(byKey.q5, locale);
  const q6 = byKey.q6 && questionText(byKey.q6, locale);
  const q7 = byKey.q7 && questionText(byKey.q7, locale);
  const q8 = byKey.q8 && questionText(byKey.q8, locale);

  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [comparedToPrevious, setComparedToPrevious] = useState<ComparedToPrevious>();
  const [returnLikelihood, setReturnLikelihood] = useState<ReturnLikelihood>();
  const [dishesOrdered, setDishesOrdered] = useState<string[]>([]);
  const [changeRequest, setChangeRequest] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!changeRequest.trim()) {
      setError(true);
      return;
    }
    onSubmit({
      foodRating: foodRating || undefined,
      serviceRating: serviceRating || undefined,
      valueRating: valueRating || undefined,
      comparedToPrevious,
      returnLikelihood,
      dishesOrdered,
      changeRequest: changeRequest.trim(),
      additionalNotes: additionalNotes.trim(),
      guestName,
      guestContact,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {q1 && (
        <Question n={1} title={q1.label}>
          <StarRating value={foodRating} onChange={setFoodRating} />
        </Question>
      )}

      {q2 && (
        <Question n={2} title={q2.label}>
          <StarRating value={serviceRating} onChange={setServiceRating} />
        </Question>
      )}

      {q3 && (
        <Question n={3} title={q3.label}>
          <StarRating value={valueRating} onChange={setValueRating} />
        </Question>
      )}

      {q4 && (
        <Question n={4} title={q4.label}>
          <PillGroup options={comparedOptions} value={comparedToPrevious} onChange={setComparedToPrevious} />
        </Question>
      )}

      {q5 && (
        <Question n={5} title={q5.label}>
          <PillGroup options={returnOptions} value={returnLikelihood} onChange={setReturnLikelihood} />
        </Question>
      )}

      {q6 && (
        <Question n={6} title={q6.label} caption={q6.caption}>
          <DishPicker options={dishOptions} value={dishesOrdered} onChange={setDishesOrdered} />
        </Question>
      )}

      {q7 && (
        <Question n={7} title={q7.label} caption={q7.caption}>
          <textarea
            className={`${inputClass} min-h-[100px] resize-none`}
            value={changeRequest}
            onChange={(e) => {
              setChangeRequest(e.target.value);
              if (error) setError(false);
            }}
            placeholder={q7.placeholder}
          />
          {error && <span className="mt-1 block text-[11px] text-chili">{t.requiredError}</span>}
        </Question>
      )}

      {q8 && (
        <Question n={8} title={q8.label} caption={q8.caption}>
          <textarea
            className={`${inputClass} min-h-[70px] resize-none`}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder={q8.placeholder}
          />
        </Question>
      )}

      <div className="flex flex-col gap-3 border-t border-ink-text/10 pt-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-ink-text/55">{t.nameLabel}</span>
          <input
            className={inputClass}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder={t.namePlaceholder}
          />
        </label>
        <label className="flex flex-col gap-1.5 rounded-[3px] border-2 border-turmeric bg-turmeric/10 p-3">
          <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-chili">
            📱 {t.phoneLabel}
          </span>
          <input
            className={`${inputClass} bg-white`}
            value={guestContact}
            onChange={(e) => setGuestContact(e.target.value)}
            placeholder={t.phonePlaceholder}
          />
          <span className="text-[11px] text-ink-text/60">{t.phoneHint}</span>
        </label>
      </div>

      {submitError && <span className="text-[12px] text-chili">{submitError}</span>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-[2px] bg-chili px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-cream transition-colors hover:bg-chili-dim disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili cursor-pointer"
      >
        {submitting ? "…" : t.submit}
      </button>
    </form>
  );
}
