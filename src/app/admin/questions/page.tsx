"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SurveyQuestionRow } from "@/lib/survey";

const QUESTION_TITLES: Record<string, string> = {
  q1: "Q1 · Food rating",
  q2: "Q2 · Service rating",
  q3: "Q3 · Value rating",
  q4: "Q4 · Compared to last visit",
  q5: "Q5 · Would return",
  q6: "Q6 · Dishes ordered",
  q7: "Q7 · What would you change (required)",
  q8: "Q8 · Anything else (optional)",
};

const HAS_CAPTION = new Set(["q6", "q7", "q8"]);
const HAS_PLACEHOLDER = new Set(["q7", "q8"]);

const LANGS: { key: "en" | "zh" | "ms"; label: string }[] = [
  { key: "en", label: "English" },
  { key: "zh", label: "中文" },
  { key: "ms", label: "Bahasa Melayu" },
];

const fieldClass =
  "w-full rounded-[2px] border border-rail-line bg-ink px-2.5 py-1.5 text-[13px] text-cream focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<SurveyQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("survey_questions")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setQuestions((data as SurveyQuestionRow[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  function updateField(key: string, field: keyof SurveyQuestionRow, value: string) {
    setQuestions((prev) => prev.map((q) => (q.key === key ? { ...q, [field]: value } : q)));
  }

  async function saveField(key: string, field: keyof SurveyQuestionRow, value: string) {
    const supabase = createClient();
    await supabase.from("survey_questions").update({ [field]: value }).eq("key", key);
    setSavedKey(key);
    setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1200);
  }

  if (loading) {
    return <p className="font-body text-[12px] text-muted">Loading…</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl uppercase tracking-wide text-cream">Questions</h2>
        <p className="mt-1 font-body text-[12px] text-muted">
          Edit the wording guests see on the feedback form, in all three languages. Changes save
          automatically.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((q) => (
          <div
            key={q.key}
            className="rounded-[3px] border border-rail-line bg-rail p-4 relative"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-body text-[12px] font-semibold uppercase tracking-wider text-turmeric">
                {QUESTION_TITLES[q.key] ?? q.key}
              </h3>
              {savedKey === q.key && (
                <span className="font-body text-[11px] text-pandan">Saved ✓</span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="mb-1 font-body text-[10px] uppercase tracking-wider text-muted">
                  Question text
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {LANGS.map((lang) => {
                    const field = `label_${lang.key}` as const;
                    return (
                      <input
                        key={lang.key}
                        value={q[field]}
                        placeholder={lang.label}
                        onChange={(e) => updateField(q.key, field, e.target.value)}
                        onBlur={(e) => saveField(q.key, field, e.target.value)}
                        className={fieldClass}
                      />
                    );
                  })}
                </div>
              </div>

              {HAS_CAPTION.has(q.key) && (
                <div>
                  <p className="mb-1 font-body text-[10px] uppercase tracking-wider text-muted">
                    Caption (small text under the question)
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {LANGS.map((lang) => {
                      const field = `caption_${lang.key}` as const;
                      return (
                        <input
                          key={lang.key}
                          value={q[field] ?? ""}
                          placeholder={lang.label}
                          onChange={(e) => updateField(q.key, field, e.target.value)}
                          onBlur={(e) => saveField(q.key, field, e.target.value)}
                          className={fieldClass}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {HAS_PLACEHOLDER.has(q.key) && (
                <div>
                  <p className="mb-1 font-body text-[10px] uppercase tracking-wider text-muted">
                    Placeholder text
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {LANGS.map((lang) => {
                      const field = `placeholder_${lang.key}` as const;
                      return (
                        <input
                          key={lang.key}
                          value={q[field] ?? ""}
                          placeholder={lang.label}
                          onChange={(e) => updateField(q.key, field, e.target.value)}
                          onBlur={(e) => saveField(q.key, field, e.target.value)}
                          className={fieldClass}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
