import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: outlets } = await supabase
    .from("outlets")
    .select("slug, name")
    .order("created_at", { ascending: true });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-ink px-6 py-16 text-center">
      <div>
        <p className="font-body text-[11px] uppercase tracking-[0.25em] text-muted">
          Soi 55 Thai Kitchen
        </p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-cream sm:text-5xl">
          Complaint Rail
        </h1>
      </div>

      <div className="flex gap-3">
        <Link
          href="/board"
          className="rounded-[2px] bg-chili px-6 py-3 font-body text-[13px] font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-chili-dim"
        >
          Open the board →
        </Link>
        <Link
          href="/admin"
          className="rounded-[2px] border border-rail-line px-6 py-3 font-body text-[13px] font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-rail"
        >
          Manage
        </Link>
      </div>

      <div className="w-full max-w-sm rounded-[3px] border border-rail-line bg-rail p-5 text-left">
        <p className="mb-3 font-body text-[11px] uppercase tracking-wider text-muted">
          QR code destinations, one per outlet
        </p>
        <ul className="flex flex-col gap-2">
          {(outlets ?? []).map((l) => (
            <li key={l.slug} className="flex items-center justify-between gap-4">
              <span className="font-display text-lg uppercase tracking-wide text-cream">
                {l.name}
              </span>
              <Link
                href={`/submit/${l.slug}`}
                className="font-body text-[12px] text-turmeric hover:underline"
              >
                /submit/{l.slug}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
