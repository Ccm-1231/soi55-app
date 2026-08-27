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
    [c.guestName, c.guestContact].filter(Boolean).join(" · ") || "-",
    c.description,
    c.actionPlan ?? "",
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
