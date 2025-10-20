export type ReportStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED";

export interface Report {
  id: string;
  category: string;
  location: string;
  description: string;
  photoUrl: string; // data URI
  summary: string;
  status: ReportStatus;
  createdAt: Date;
}

export type NewReport = Omit<Report, "id" | "createdAt" | "status">;
