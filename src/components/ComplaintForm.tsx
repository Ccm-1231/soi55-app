"use client";

import { useState } from "react";
import { ComplaintSource } from "@/lib/types";
import type { Outlet } from "@/lib/outlets";

export type ComplaintFormValues = {
  locationSlug: string;
  source: ComplaintSource;
  description: string;
  guestName: string;
  guestContact: string;
};

const CHANNEL_OPTIONS: { value: ComplaintSource; label: string }[] = [
  { value: "in_person", label: "In person" },
  { value: "phone_text", label: "Phone or text" },
  { value: "online_review", label: "Online review" },
];

const inputClass =
  "w-full rounded-[2px] border border-ink-text/15 bg-white/60 px-3 py-2 text-[14px] text-ink-text placeholder:text-ink-text/40 focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/25";

const labelClass = "font-body text-[11px] uppercase tracking-wider text-ink-text/55";

export function ComplaintForm({
  variant,
  fixedLocationSlug,
  locations,
  submitLabel,
  onSubmit,
}: {
  variant: "public" | "manual";
  fixedLocationSlug?: string;
  locations: Outlet[];
  submitLabel: string;
  onSubmit: (values: ComplaintFormValues) => void;
}) {
  const [locationSlug, setLocationSlug] = useState(fixedLocationSlug ?? locations[0]?.slug ?? "");
  const [source, setSource] = useState<ComplaintSource>(
    variant === "public" ? "self_submit" : "in_person"
  );
  const [description, setDescription] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError(true);
      return;
    }
    onSubmit({ locationSlug, source, description: description.trim(), guestName, guestContact });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {variant === "manual" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Location</span>
            <select
              className={inputClass}
              value={locationSlug}
              onChange={(e) => setLocationSlug(e.target.value)}
            >
              {locations.map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>How it reached you</span>
            <select
              className={inputClass}
              value={source}
              onChange={(e) => setSource(e.target.value as ComplaintSource)}
            >
              {CHANNEL_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>
          {variant === "public" ? "What happened?" : "What happened?"}
        </span>
        <textarea
          className={`${inputClass} min-h-[120px] resize-none`}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (error) setError(false);
          }}
          placeholder={
            variant === "public"
              ? "Tell us what went wrong, in your own words."
              : "What did the guest say happened?"
          }
        />
        {error && (
          <span className="font-body text-[11px] text-chili">
            Add a short description before sending.
          </span>
        )}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{variant === "public" ? "Your name (optional)" : "Guest name (optional)"}</span>
          <input
            className={inputClass}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Phone or email (optional)</span>
          <input
            className={inputClass}
            value={guestContact}
            onChange={(e) => setGuestContact(e.target.value)}
            placeholder="So we can follow up"
          />
        </label>
      </div>

      {variant === "public" && (
        <p className="text-[12px] leading-snug text-ink-text/55">
          This goes straight to the{" "}
          {locations.find((l) => l.slug === (fixedLocationSlug ?? locationSlug))?.name ??
            fixedLocationSlug ??
            locationSlug}{" "}
          manager on duty — no account needed.
        </p>
      )}

      <button
        type="submit"
        className="mt-1 w-full rounded-[2px] bg-chili px-4 py-2.5 font-body text-[12px] font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-chili-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili cursor-pointer"
      >
        {submitLabel}
      </button>
    </form>
  );
}
