"use client";

export function DishPicker({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(dish: string) {
    onChange(value.includes(dish) ? value.filter((d) => d !== dish) : [...value, dish]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((dish) => {
        const active = value.includes(dish.value);
        return (
          <button
            key={dish.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(dish.value)}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili ${
              active
                ? "border-pandan bg-pandan text-cream"
                : "border-ink-text/20 bg-white/50 text-ink-text/75 hover:border-pandan/50"
            }`}
          >
            {dish.label}
          </button>
        );
      })}
    </div>
  );
}
