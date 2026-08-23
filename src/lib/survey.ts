import type { Locale } from "@/lib/i18n";

export type SurveyQuestionRow = {
  key: string;
  label_en: string;
  label_zh: string;
  label_ms: string;
  caption_en: string | null;
  caption_zh: string | null;
  caption_ms: string | null;
  placeholder_en: string | null;
  placeholder_zh: string | null;
  placeholder_ms: string | null;
  sort_order: number;
};

export type DishRow = {
  id: string;
  name: string;
};

export function questionText(q: SurveyQuestionRow, locale: Locale) {
  return {
    label: q[`label_${locale}`],
    caption: q[`caption_${locale}`] ?? undefined,
    placeholder: q[`placeholder_${locale}`] ?? undefined,
  };
}
