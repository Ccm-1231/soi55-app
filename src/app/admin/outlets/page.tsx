"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { slugify, MAX_OUTLETS, type Outlet } from "@/lib/outlets";

export default function AdminOutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("outlets")
      .select("id, slug, name")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setOutlets((data as Outlet[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  function uniqueSlug(base: string): string {
    let slug = base || "outlet";
    let i = 2;
    while (outlets.some((o) => o.slug === slug)) {
      slug = `${base}-${i}`;
      i++;
    }
    return slug;
  }

  async function addOutlet(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) return;
    if (outlets.length >= MAX_OUTLETS) {
      setError(`You've reached the ${MAX_OUTLETS} outlet limit.`);
      return;
    }
    setAdding(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("outlets")
      .insert({ name, slug: uniqueSlug(slugify(name)) })
      .select("id, slug, name")
      .single();
    setAdding(false);
    if (insertError) {
      setError("Couldn't add that outlet. Try again.");
      return;
    }
    setOutlets((prev) => [...prev, data as Outlet]);
    setNewName("");
  }

  async function saveName(outlet: Outlet) {
    const name = editing[outlet.id]?.trim();
    if (!name || name === outlet.name) {
      setEditing((prev) => {
        const next = { ...prev };
        delete next[outlet.id];
        return next;
      });
      return;
    }
    const supabase = createClient();
    await supabase.from("outlets").update({ name }).eq("id", outlet.id);
    setOutlets((prev) => prev.map((o) => (o.id === outlet.id ? { ...o, name } : o)));
    setEditing((prev) => {
      const next = { ...prev };
      delete next[outlet.id];
      return next;
    });
  }

  async function deleteOutlet(outlet: Outlet) {
    if (!window.confirm(`Delete "${outlet.name}"? Its QR code will stop working.`)) return;
    const supabase = createClient();
    await supabase.from("outlets").delete().eq("id", outlet.id);
    setOutlets((prev) => prev.filter((o) => o.id !== outlet.id));
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase tracking-wide text-cream">Outlets</h2>
        <span className="font-body text-[12px] text-muted">
          {outlets.length} / {MAX_OUTLETS}
        </span>
      </div>

      <form onSubmit={addOutlet} className="flex gap-2.5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New outlet name, e.g. Siam Square"
          className="flex-1 rounded-[2px] border border-rail-line bg-rail px-3 py-2 text-[14px] text-cream placeholder:text-muted focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
        />
        <button
          type="submit"
          disabled={adding || outlets.length >= MAX_OUTLETS}
          className="rounded-[2px] bg-chili px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-chili-dim disabled:opacity-50 cursor-pointer"
        >
          + Add outlet
        </button>
      </form>
      {error && <p className="-mt-3 text-[12px] text-chili">{error}</p>}

      {loading ? (
        <p className="font-body text-[12px] text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {outlets.length === 0 && (
            <p className="rounded-[3px] border border-dashed border-rail-line px-3 py-6 text-center font-body text-[12px] text-muted">
              No outlets yet — add your first one above.
            </p>
          )}
          {outlets.map((outlet) => (
            <div
              key={outlet.id}
              className="flex flex-wrap items-center gap-3 rounded-[3px] border border-rail-line bg-rail px-4 py-3"
            >
              <input
                value={editing[outlet.id] ?? outlet.name}
                onChange={(e) => setEditing((prev) => ({ ...prev, [outlet.id]: e.target.value }))}
                onBlur={() => saveName(outlet)}
                className="min-w-[140px] flex-1 bg-transparent font-display text-lg uppercase tracking-wide text-cream focus:outline-none focus:ring-1 focus:ring-chili/40 rounded-[2px] px-1"
              />
              <span className="font-body text-[11px] text-muted">/submit/{outlet.slug}</span>
              <Link
                href={`/outlets/${outlet.slug}/poster`}
                target="_blank"
                className="rounded-[2px] border border-turmeric/50 px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wide text-turmeric transition-colors hover:bg-turmeric/10"
              >
                QR &amp; poster →
              </Link>
              <button
                onClick={() => deleteOutlet(outlet)}
                className="rounded-[2px] border border-rail-line px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-wide text-muted transition-colors hover:border-chili hover:text-chili cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
