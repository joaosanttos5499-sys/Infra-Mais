
export type ReportStatus = "UNDER_REVIEW" | "PENDING" | "IN_PROGRESS" | "RESOLVED" | "EXCLUDED";

export interface Report {
  id: string;
  userId: string;
  relatorEmail: string;
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
  // Auditoria de exclusão
  excludedBy?: string;
  exclusionReason?: string;
  excludedAt?: string;
}

export type NewReport = Omit<Report, "id" | "createdAt" | "status" | "upvotes" | "photoAfterUrl" | "excludedBy" | "exclusionReason" | "excludedAt">;

export type UserRole = "USER" | "EMPLOYEE";

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    dateOfBirth: string;
    photoURL?: string;
    nameLastUpdatedAt?: string;
    role: UserRole;
}

export type NotificationType = 'SENT' | 'APPROVED' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'EDITED' | 'EXCLUDED' | 'COMPLAINT';

export interface Notification {
  id: string;
  userId: string;
  reportId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Complaint {
  id: string;
  reportId: string;
  denouncedUserId: string;
  denouncedUserEmail: string;
  reporterUserId: string; // Funcionário que denunciou
  reason: string;
  details?: string; // Observações
  createdAt: string;
  status: 'PENDING' | 'RESOLVED';
}
