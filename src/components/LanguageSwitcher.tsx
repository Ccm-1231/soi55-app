"use client";

import { useState, useRef, useEffect } from "react";
import { LOCALES, LOCALE_LABEL, LOCALE_SHORT, useLocale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  return (
    <div ref={rootRef} className="fixed right-4 top-4 z-20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-white/25 bg-black/20 px-3 py-1.5 text-[12px] font-semibold text-cream backdrop-blur-sm transition-colors hover:bg-black/30 cursor-pointer"
      >
        <span aria-hidden>🌐</span>
        {LOCALE_SHORT[locale]}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-40 overflow-hidden rounded-[3px] border border-ink-text/10 bg-paper shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              role="option"
              aria-selected={l === locale}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] cursor-pointer transition-colors ${
                l === locale ? "bg-chili text-cream" : "text-ink-text hover:bg-chili/10"
              }`}
            >
              {LOCALE_LABEL[l]}
              {l === locale && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
