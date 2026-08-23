"use client";

import { useEffect } from "react";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/80 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[3px] bg-paper p-5 text-ink-text shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-[2px] px-2 py-1 font-body text-sm text-ink-text/50 hover:text-ink-text cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-chili"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
