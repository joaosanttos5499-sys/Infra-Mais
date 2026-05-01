
export type ReportStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED";

export interface Report {
  id: string;
  userId: string;
  category: string;
  problem: string;
  city: string;
  bairro: string;
  location: string;
  description: string;
  photoUrl: string; // data URI for before image
  photoAfterUrl?: string; // data URI for after image
  summary: string;
  status: ReportStatus;
  createdAt: string;
  upvotes: number;
  latitude: number;
  longitude: number;
}

export type NewReport = Omit<Report, "id" | "createdAt" | "status" | "upvotes" | "photoAfterUrl">;

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    dateOfBirth: string;
    photoURL?: string;
    nameLastUpdatedAt?: string;
}
