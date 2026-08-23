import { notFound } from "next/navigation";
import { SubmitPageShell } from "@/components/SubmitPageShell";
import { createClient } from "@/lib/supabase/server";
import type { DishRow, SurveyQuestionRow } from "@/lib/survey";

export default async function SubmitPage(props: PageProps<"/submit/[location]">) {
  const { location } = await props.params;
  const supabase = await createClient();

  const [outletRes, dishesRes, questionsRes] = await Promise.all([
    supabase.from("outlets").select("slug, name").eq("slug", location).maybeSingle(),
    supabase.from("dishes").select("id, name").order("created_at", { ascending: true }),
    supabase.from("survey_questions").select("*").order("sort_order", { ascending: true }),
  ]);

  if (!outletRes.data) notFound();

  return (
    <SubmitPageShell
      locationSlug={outletRes.data.slug}
      locationDisplayName={outletRes.data.name}
      dishes={(dishesRes.data as DishRow[] | null) ?? []}
      questions={(questionsRes.data as SurveyQuestionRow[] | null) ?? []}
    />
  );
}
