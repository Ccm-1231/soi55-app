"use client";

import Image from "next/image";
import { LocaleProvider, useLocale } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SubmitFlow } from "./SubmitFlow";
import type { DishRow, SurveyQuestionRow } from "@/lib/survey";

function SubmitPageInner({
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-signal px-4 py-10">
      <LanguageSwitcher />
      <div className="w-full max-w-sm">
        <div className="mb-5 flex justify-center">
          <Image
            src="/soi55-logo.jpg"
            alt="Soi 55 Thai Kitchen"
            width={1080}
            height={738}
            className="h-[5.5rem] w-auto rounded-[2px]"
            priority
          />
        </div>
        <div className="rounded-[3px] bg-paper p-5 text-ink-text shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]">
          <h2 className="mb-1 font-display text-xl uppercase tracking-wide sm:text-2xl">
            {t.heading}
          </h2>
          <p className="mb-3 text-[13px] text-ink-text/70">{t.subheading}</p>
          <div className="mb-4 rounded-[2px] border border-dashed border-turmeric/50 bg-turmeric/10 px-3 py-2.5">
            <p className="text-[13px] font-medium leading-snug text-ink-text">{t.rewardLine1}</p>
            <p className="mt-1 text-[13px] font-medium leading-snug text-ink-text">{t.rewardLine2}</p>
          </div>
          <SubmitFlow
            locationSlug={locationSlug}
            locationDisplayName={locationDisplayName}
            questions={questions}
            dishes={dishes}
          />
        </div>
      </div>
    </div>
  );
}

export function SubmitPageShell(props: {
  locationSlug: string;
  locationDisplayName: string;
  questions: SurveyQuestionRow[];
  dishes: DishRow[];
}) {
  return (
    <LocaleProvider>
      <SubmitPageInner {...props} />
    </LocaleProvider>
  );
}
