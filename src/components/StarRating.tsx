"use client";

export function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "md" | "sm";
}) {
  const stars = [1, 2, 3, 4, 5];
  const textSize = size === "sm" ? "text-lg" : "text-3xl";

  if (!onChange) {
    return (
      <span className={`${textSize} leading-none text-turmeric`} aria-label={`${value} out of 5 stars`}>
        {stars.map((n) => (n <= value ? "★" : "☆")).join("")}
      </span>
    );
  }

  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="Rating out of 5">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onClick={() => onChange(n)}
          className={`${textSize} leading-none transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili ${
            n <= value ? "text-turmeric" : "text-ink-text/25 hover:text-turmeric/60"
          }`}
        >
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
