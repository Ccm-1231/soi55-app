"use client";

import { useEffect, useRef, useState } from "react";
import type { Complaint } from "@/lib/types";
import { exportToExcel, exportToPdf } from "@/lib/export";

export function DownloadButton({
  complaints,
  outlets,
}: {
  complaints: Complaint[];
  outlets: { slug: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  async function handleExport(format: "excel" | "pdf") {
    setOpen(false);
    setExporting(format);
    try {
      if (format === "excel") await exportToExcel(complaints, outlets);
      else await exportToPdf(complaints, outlets);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={exporting !== null}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="rounded-[2px] border border-rail-line px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-rail disabled:opacity-50 cursor-pointer"
      >
        {exporting ? "Exporting…" : "⬇ Download"}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-[3px] border border-ink-text/10 bg-paper shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport("excel")}
            className="block w-full px-3 py-2 text-left font-body text-[13px] text-ink-text transition-colors hover:bg-chili/10 cursor-pointer"
          >
            Excel (.xlsx)
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport("pdf")}
            className="block w-full px-3 py-2 text-left font-body text-[13px] text-ink-text transition-colors hover:bg-chili/10 cursor-pointer"
          >
            PDF
          </button>
        </div>
      )}
    </div>
  );
}
