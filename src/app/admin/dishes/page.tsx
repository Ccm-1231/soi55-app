"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DishRow } from "@/lib/survey";

export default function AdminDishesPage() {
  const [dishes, setDishes] = useState<DishRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("dishes")
      .select("id, name")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setDishes((data as DishRow[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  async function addDish(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const supabase = createClient();
    const { data } = await supabase.from("dishes").insert({ name }).select("id, name").single();
    setAdding(false);
    if (data) {
      setDishes((prev) => [...prev, data as DishRow]);
      setNewName("");
    }
  }

  async function saveName(dish: DishRow) {
    const name = editing[dish.id]?.trim();
    if (!name || name === dish.name) {
      setEditing((prev) => {
        const next = { ...prev };
        delete next[dish.id];
        return next;
      });
      return;
    }
    const supabase = createClient();
    await supabase.from("dishes").update({ name }).eq("id", dish.id);
    setDishes((prev) => prev.map((d) => (d.id === dish.id ? { ...d, name } : d)));
    setEditing((prev) => {
      const next = { ...prev };
      delete next[dish.id];
      return next;
    });
  }

  async function deleteDish(dish: DishRow) {
    if (!window.confirm(`Remove "${dish.name}" from the dish list?`)) return;
    const supabase = createClient();
    await supabase.from("dishes").delete().eq("id", dish.id);
    setDishes((prev) => prev.filter((d) => d.id !== dish.id));
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h2 className="font-display text-2xl uppercase tracking-wide text-cream">Dishes</h2>
      <p className="-mt-4 font-body text-[12px] text-muted">
        Shown in the guest form&apos;s &ldquo;Which dish(es) did you order?&rdquo; question, in every language.
      </p>

      <form onSubmit={addDish} className="flex gap-2.5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New dish name"
          className="flex-1 rounded-[2px] border border-rail-line bg-rail px-3 py-2 text-[14px] text-cream placeholder:text-muted focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-[2px] bg-chili px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-chili-dim disabled:opacity-50 cursor-pointer"
        >
          + Add dish
        </button>
      </form>

      {loading ? (
        <p className="font-body text-[12px] text-muted">Loading…</p>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {dishes.length === 0 && (
            <p className="rounded-[3px] border border-dashed border-rail-line px-3 py-6 text-center font-body text-[12px] text-muted">
              No dishes yet — add your first one above.
            </p>
          )}
          {dishes.map((dish) => (
            <div
              key={dish.id}
              className="flex items-center gap-2 rounded-full border border-rail-line bg-rail py-1 pl-3.5 pr-1.5"
            >
              <input
                value={editing[dish.id] ?? dish.name}
                onChange={(e) => setEditing((prev) => ({ ...prev, [dish.id]: e.target.value }))}
                onBlur={() => saveName(dish)}
                size={Math.max((editing[dish.id] ?? dish.name).length, 4)}
                className="bg-transparent font-body text-[13px] text-cream focus:outline-none"
              />
              <button
                onClick={() => deleteDish(dish)}
                aria-label={`Remove ${dish.name}`}
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors hover:bg-chili/20 hover:text-chili cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
