"use client";

import { useMemo } from "react";
import type { Complaint, ComparedToPrevious, ReturnLikelihood } from "@/lib/types";
import { COMPARED_LABEL, RETURN_LABEL } from "@/lib/types";

function StatRow({
  label,
  count,
  total,
  colorClass,
  labelWidth = "w-[92px]",
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
  labelWidth?: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className={`${labelWidth} shrink-0 truncate font-body text-[11px] text-cream/90`} title={label}>
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-text/10">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right font-body text-[11px] text-muted">
        <span className="font-semibold text-cream">{count}</span> · {pct}%
      </span>
    </div>
  );
}

function starCounts(complaints: Complaint[], key: "foodRating" | "serviceRating" | "valueRating") {
  const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star ... index 4 = 5 star
  let total = 0;
  for (const c of complaints) {
    const v = c[key];
    if (typeof v === "number" && v >= 1 && v <= 5) {
      counts[Math.round(v) - 1]++;
      total++;
    }
  }
  const avg = total > 0 ? counts.reduce((sum, n, i) => sum + n * (i + 1), 0) / total : null;
  return { counts, total, avg };
}

const COMPARED_VALUES: ComparedToPrevious[] = ["better", "same", "worse", "first_visit"];
const COMPARED_COLOR: Record<ComparedToPrevious, string> = {
  better: "bg-pandan",
  same: "bg-cream/50",
  worse: "bg-chili",
  first_visit: "bg-turmeric",
};

const RETURN_VALUES: ReturnLikelihood[] = [
  "definitely",
  "probably",
  "not_sure",
  "probably_not",
  "definitely_not",
];
const RETURN_COLOR: Record<ReturnLikelihood, string> = {
  definitely: "bg-pandan",
  probably: "bg-pandan",
  not_sure: "bg-turmeric",
  probably_not: "bg-chili",
  definitely_not: "bg-chili",
};

export function DetailedBreakdown({ complaints }: { complaints: Complaint[] }) {
  const food = useMemo(() => starCounts(complaints, "foodRating"), [complaints]);
  const service = useMemo(() => starCounts(complaints, "serviceRating"), [complaints]);
  const value = useMemo(() => starCounts(complaints, "valueRating"), [complaints]);

  const compared = useMemo(() => {
    const counts: Record<ComparedToPrevious, number> = { better: 0, same: 0, worse: 0, first_visit: 0 };
    let total = 0;
    for (const c of complaints) {
      if (c.comparedToPrevious) {
        counts[c.comparedToPrevious]++;
        total++;
      }
    }
    return { counts, total };
  }, [complaints]);

  const willReturn = useMemo(() => {
    const counts: Record<ReturnLikelihood, number> = {
      definitely: 0,
      probably: 0,
      not_sure: 0,
      probably_not: 0,
      definitely_not: 0,
    };
    let total = 0;
    for (const c of complaints) {
      if (c.returnLikelihood) {
        counts[c.returnLikelihood]++;
        total++;
      }
    }
    return { counts, total };
  }, [complaints]);

  const dishes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of complaints) {
      for (const dish of c.dishesOrdered ?? []) {
        counts.set(dish, (counts.get(dish) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [complaints]);

  if (complaints.length === 0) return null;

  const starColumns: { title: string; data: ReturnType<typeof starCounts> }[] = [
    { title: "Food", data: food },
    { title: "Service", data: service },
    { title: "Value", data: value },
  ];

  return (
    <div className="mb-4 flex flex-col gap-4">
      <div className="rounded-[2px] border border-rail-line p-3.5">
        <p className="mb-3 font-body text-[11px] uppercase tracking-wide text-muted">Ratings by star</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {starColumns.map(({ title, data }) => (
            <div key={title}>
              <div className="mb-2 flex items-baseline gap-1.5">
                <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {title}
                </span>
                <span className="font-display text-base text-cream">
                  {data.avg != null ? data.avg.toFixed(1) : "—"}
                </span>
                <span className="font-body text-[10px] text-muted">/5</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {[5, 4, 3, 2, 1].map((star) => (
                  <StatRow
                    key={star}
                    label={`${star}★`}
                    count={data.counts[star - 1]}
                    total={data.total}
                    colorClass={star >= 4 ? "bg-pandan" : star === 3 ? "bg-turmeric" : "bg-chili"}
                    labelWidth="w-6"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[2px] border border-rail-line p-3.5">
          <p className="mb-3 font-body text-[11px] uppercase tracking-wide text-muted">Vs previous visit</p>
          <div className="flex flex-col gap-1.5">
            {COMPARED_VALUES.map((v) => (
              <StatRow
                key={v}
                label={COMPARED_LABEL[v]}
                count={compared.counts[v]}
                total={compared.total}
                colorClass={COMPARED_COLOR[v]}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[2px] border border-rail-line p-3.5">
          <p className="mb-3 font-body text-[11px] uppercase tracking-wide text-muted">Will return</p>
          <div className="flex flex-col gap-1.5">
            {RETURN_VALUES.map((v) => (
              <StatRow
                key={v}
                label={RETURN_LABEL[v]}
                count={willReturn.counts[v]}
                total={willReturn.total}
                colorClass={RETURN_COLOR[v]}
              />
            ))}
          </div>
        </div>
      </div>

      {dishes.length > 0 && (
        <div className="rounded-[2px] border border-rail-line p-3.5">
          <p className="mb-3 font-body text-[11px] uppercase tracking-wide text-muted">
            Dishes ordered · % of {complaints.length} reviews mentioning it
          </p>
          <div className="flex flex-col gap-1.5">
            {dishes.map(([dish, count]) => (
              <StatRow
                key={dish}
                label={dish}
                count={count}
                total={complaints.length}
                colorClass="bg-cream/50"
                labelWidth="w-[150px]"
              />
            ))}
          </div>
          <p className="mt-2.5 font-body text-[11px] text-muted">
            Multi-select on the survey, so percentages add up to more than 100%.
          </p>
        </div>
      )}
    </div>
  );
}
