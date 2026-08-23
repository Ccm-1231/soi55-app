"use client";

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value?: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili ${
              active
                ? "border-chili bg-chili text-cream"
                : "border-ink-text/20 bg-white/50 text-ink-text/75 hover:border-chili/50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
