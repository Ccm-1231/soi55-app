"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded-[2px] bg-chili px-5 py-2.5 font-body text-[13px] font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-chili-dim cursor-pointer"
    >
      🖨️ Print / Save as PDF
    </button>
  );
}
