import type {
  Complaint,
  ComparedToPrevious,
  ComplaintSource,
  ComplaintStatus,
  ReturnLikelihood,
} from "@/lib/types";

export type ComplaintRow = {
  id: string;
  ticket_number: string;
  location_slug: string;
  status: ComplaintStatus;
  source: ComplaintSource;
  description: string;
  guest_name: string | null;
  guest_contact: string | null;
  food_rating: number | null;
  service_rating: number | null;
  value_rating: number | null;
  compared_to_previous: ComparedToPrevious | null;
  return_likelihood: ReturnLikelihood | null;
  dishes_ordered: string[] | null;
  additional_notes: string | null;
  coupon_code: string | null;
  draw_entry_number: string | null;
  submitted_at: string;
  resolved_at: string | null;
};

export function rowToComplaint(row: ComplaintRow): Complaint {
  return {
    id: row.ticket_number,
    locationSlug: row.location_slug,
    status: row.status,
    source: row.source,
    description: row.description,
    guestName: row.guest_name ?? undefined,
    guestContact: row.guest_contact ?? undefined,
    foodRating: row.food_rating ?? undefined,
    serviceRating: row.service_rating ?? undefined,
    valueRating: row.value_rating ?? undefined,
    comparedToPrevious: row.compared_to_previous ?? undefined,
    returnLikelihood: row.return_likelihood ?? undefined,
    dishesOrdered: row.dishes_ordered ?? undefined,
    additionalNotes: row.additional_notes ?? undefined,
    couponCode: row.coupon_code ?? undefined,
    drawEntryNumber: row.draw_entry_number ?? undefined,
    submittedAt: row.submitted_at,
    resolvedAt: row.resolved_at ?? undefined,
  };
}
