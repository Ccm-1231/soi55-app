import type { Complaint } from "@/lib/types";
import { daysSince } from "@/lib/time";

const STATUS_LABEL: Record<Complaint["status"], string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
};

const PRIORITY_LABEL: Record<NonNullable<Complaint["priority"]>, string> = {
  red: "High",
  yellow: "Medium",
  green: "Low",
};

function outletNameFor(slug: string, outlets: { slug: string; name: string }[]): string {
  return outlets.find((o) => o.slug === slug)?.name ?? slug;
}

/**
 * Phone numbers pasted from a phone's contacts app or WhatsApp often carry invisible Unicode
 * bidi-direction marks and a non-breaking hyphen. jsPDF's built-in fonts can't measure or render
 * those characters, which corrupts that cell's line-wrapping (letters end up spaced one-per-line).
 * Strip the invisible marks and normalize dash variants before handing text to jsPDF.
 */
// Built from codepoints (not literal characters) so this file has no invisible/ambiguous glyphs in it.
function codepointRange(start: number, end: number): string {
  let chars = "";
  for (let cp = start; cp <= end; cp++) chars += String.fromCodePoint(cp);
  return chars;
}

// Zero-width spaces/joiners (200B-200F), bidi embedding/override marks (202A-202E),
// bidi isolate marks (2066-2069), and the BOM/zero-width-no-break-space (FEFF).
const INVISIBLE_FORMATTING_CHARS = new RegExp(
  `[${codepointRange(0x200b, 0x200f)}${codepointRange(0x202a, 0x202e)}${codepointRange(0x2066, 0x2069)}${codepointRange(0xfeff, 0xfeff)}]`,
  "g"
);
// Hyphen/non-breaking-hyphen/figure-dash/en-dash/em-dash/horizontal-bar (2010-2015).
const DASH_VARIANTS = new RegExp(`[${codepointRange(0x2010, 0x2015)}]`, "g");

// Emoji and other pictographic/symbol characters: jsPDF's built-in fonts only support the
// WinAnsi (Latin-1-ish) subset, so anything in these ranges renders as garbled mojibake
// instead of the intended glyph, and can corrupt the rest of the cell's text alongside it.
// Arrows, misc technical/symbols, dingbats (2190-2BFF), variation selectors (FE00-FE0F),
// and the whole supplementary-plane block used by virtually all emoji (1F000-10FFFF).
const UNRENDERABLE_SYMBOLS = new RegExp(
  "[\\u{2190}-\\u{2BFF}\\u{FE00}-\\u{FE0F}\\u{1F000}-\\u{10FFFF}]",
  "gu"
);

function sanitizeForPdf(value: string): string {
  return value
    .replace(UNRENDERABLE_SYMBOLS, "")
    .replace(INVISIBLE_FORMATTING_CHARS, "")
    .replace(DASH_VARIANTS, "-");
}

const PRIORITY_RANK: Record<string, number> = { red: 0, yellow: 1, green: 2 };

/** High -> medium -> low priority first; unclassified tickets sort last. */
function sortByPriority(complaints: Complaint[]): Complaint[] {
  return [...complaints].sort((a, b) => {
    const rankA = a.priority ? PRIORITY_RANK[a.priority] : 3;
    const rankB = b.priority ? PRIORITY_RANK[b.priority] : 3;
    return rankA - rankB;
  });
}

function rowsFor(complaints: Complaint[], outlets: { slug: string; name: string }[]) {
  return sortByPriority(complaints).map((c) => ({
    Ticket: `#${c.id}`,
    Outlet: outletNameFor(c.locationSlug, outlets),
    Status: STATUS_LABEL[c.status],
    Priority: c.priority ? PRIORITY_LABEL[c.priority] : "",
    "Days Open": daysSince(c.submittedAt),
    Source: c.source,
    "Food Rating": c.foodRating ?? "",
    "Service Rating": c.serviceRating ?? "",
    "Value Rating": c.valueRating ?? "",
    Dishes: c.dishesOrdered?.join(", ") ?? "",
    Description: c.description,
    "Additional Notes": c.additionalNotes ?? "",
    "Guest Name": c.guestName ?? "",
    "Guest Contact": c.guestContact ?? "",
    "Action Plan": c.actionPlan ?? "",
    Submitted: new Date(c.submittedAt).toLocaleString(),
    Resolved: c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : "",
  }));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportToExcel(
  complaints: Complaint[],
  outlets: { slug: string; name: string }[]
) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reviews");
  const rows = rowsFor(complaints, outlets);

  if (rows.length > 0) {
    sheet.columns = Object.keys(rows[0]).map((key) => ({
      header: key,
      key,
      width: Math.min(Math.max(key.length + 4, 14), 40),
    }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `soi55-reviews-${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

export async function exportToPdf(
  complaints: Complaint[],
  outlets: { slug: string; name: string }[]
) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Soi 55 Thai Kitchen — Reviews", 14, 15);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 21);

  const rows = sortByPriority(complaints).map((c) => [
    `#${c.id}`,
    outletNameFor(c.locationSlug, outlets),
    STATUS_LABEL[c.status],
    c.priority ? PRIORITY_LABEL[c.priority] : "-",
    String(daysSince(c.submittedAt)),
    sanitizeForPdf([c.guestName, c.guestContact].filter(Boolean).join(" · ")) || "-",
    sanitizeForPdf(c.description),
    sanitizeForPdf(c.actionPlan ?? ""),
  ]);

  autoTable(doc, {
    startY: 26,
    head: [["Ticket", "Outlet", "Status", "Priority", "Days", "Guest", "Review", "Action Plan"]],
    body: rows,
    styles: { fontSize: 8, cellWidth: "wrap" },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 28 },
      2: { cellWidth: 20 },
      3: { cellWidth: 16 },
      4: { cellWidth: 14 },
      5: { cellWidth: 40 },
      6: { cellWidth: 80 },
      7: { cellWidth: 80 },
    },
  });

  doc.save(`soi55-reviews-${new Date().toISOString().slice(0, 10)}.pdf`);
}
