"use client";

import { useEffect, useRef, useState } from "react";

export function useClickAway(onAway: () => void) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onAway();
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [onAway]);
  return rootRef;
}

export const DROPDOWN_BUTTON_CLASS =
  "rounded-[2px] border border-rail-line bg-rail px-3.5 py-2 font-body text-[12px] uppercase tracking-wide text-cream transition-colors hover:bg-rail/70 cursor-pointer";
export const DROPDOWN_PANEL_CLASS =
  "absolute left-0 z-20 mt-2 overflow-hidden rounded-[3px] border border-ink-text/10 bg-paper shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]";

export function FilterDropdown<T extends string>({
  label,
  options,
  value,
  onChange,
  renderButtonLabel,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  /** Override the default "Label: value" button text, e.g. for a friendlier phrase. */
  renderButtonLabel?: (activeLabel: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useClickAway(() => setOpen(false));
  const activeLabel = options.find((o) => o.value === value)?.label ?? "—";
  const buttonText = renderButtonLabel ? renderButtonLabel(activeLabel) : `${label}: ${activeLabel}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={DROPDOWN_BUTTON_CLASS}
      >
        {buttonText} <span className="text-muted">▾</span>
      </button>
      {open && (
        <div role="listbox" className={`${DROPDOWN_PANEL_CLASS} w-44`}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left font-body text-[13px] transition-colors cursor-pointer ${
                opt.value === value ? "bg-chili/10 text-chili" : "text-ink-text hover:bg-chili/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
