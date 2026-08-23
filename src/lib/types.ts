export type ComplaintStatus = "new" | "in_progress" | "resolved";

export type ComplaintPriority = "red" | "yellow" | "green";

export type ComplaintSource = "self_submit" | "in_person" | "phone_text" | "online_review";

export type ComparedToPrevious = "better" | "same" | "worse" | "first_visit";

export type ReturnLikelihood =
  | "definitely"
  | "probably"
  | "not_sure"
  | "probably_not"
  | "definitely_not";

export type SurveyAnswers = {
  foodRating?: number;
  serviceRating?: number;
  valueRating?: number;
  comparedToPrevious?: ComparedToPrevious;
  returnLikelihood?: ReturnLikelihood;
  dishesOrdered?: string[];
  changeRequest?: string;
  additionalNotes?: string;
  couponCode?: string;
  drawEntryNumber?: string;
};

export type Complaint = SurveyAnswers & {
  id: string;
  locationSlug: string;
  status: ComplaintStatus;
  source: ComplaintSource;
  description: string;
  guestName?: string;
  guestContact?: string;
  submittedAt: string;
  resolvedAt?: string;
  priority?: ComplaintPriority;
  actionPlan?: string;
  actionPlanUpdatedAt?: string;
};

export const SOURCE_LABEL: Record<ComplaintSource, string> = {
  self_submit: "QR self-submit",
  in_person: "In person",
  phone_text: "Phone or text",
  online_review: "Online review",
};

export const COMPARED_LABEL: Record<ComparedToPrevious, string> = {
  better: "Better",
  same: "Same",
  worse: "Worse",
  first_visit: "First visit",
};

export const RETURN_LABEL: Record<ReturnLikelihood, string> = {
  definitely: "Definitely",
  probably: "Probably",
  not_sure: "Not sure",
  probably_not: "Probably not",
  definitely_not: "Definitely not",
};
