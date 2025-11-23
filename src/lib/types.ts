export type ReportStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED";

export interface Report {
  id: string;
  category: string;
  bairro: string;
  location: string;
  description: string;
  photoUrl: string; // data URI for before image
  photoAfterUrl?: string; // data URI for after image
  summary: string;
  status: ReportStatus;
  createdAt: Date;
  upvotes: number;
  latitude: number;
  longitude: number;
}

export type NewReport = Omit<Report, "id" | "createdAt" | "status" | "upvotes" | "photoAfterUrl">;