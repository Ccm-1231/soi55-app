"use client";

import { useState } from "react";
import { useClickAway, DROPDOWN_BUTTON_CLASS, DROPDOWN_PANEL_CLASS } from "@/components/FilterDropdown";

export function MultiSelectDropdown<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useClickAway(() => setOpen(false));

  const buttonLabel =
    selected.length === 0
      ? "All"
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? "1 selected")
        : `${selected.length} selected`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className={DROPDOWN_BUTTON_CLASS}
      >
        {label}: {buttonLabel} <span className="text-muted">▾</span>
      </button>
      {open && (
        <div className={`${DROPDOWN_PANEL_CLASS} w-56`}>
          <button
            type="button"
            onClick={onClear}
            className={`block w-full px-3 py-2 text-left font-body text-[13px] font-semibold transition-colors cursor-pointer ${
              selected.length === 0 ? "bg-chili/10 text-chili" : "text-ink-text hover:bg-chili/5"
            }`}
          >
            All
          </button>
          <div className="max-h-64 overflow-y-auto border-t border-ink-text/10">
            {options.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 font-body text-[13px] text-ink-text transition-colors hover:bg-chili/5"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => onToggle(opt.value)}
                  className="h-3.5 w-3.5 accent-chili"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
