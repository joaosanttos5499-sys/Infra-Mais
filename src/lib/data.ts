
import { type Report, type ReportStatus, type NewReport, type UserProfile } from "@/lib/types";
import { isEmailEmployee } from "./config";

// In-memory store to persist data across hot-reloads in development
const globalForStore = globalThis as unknown as {
  reports: Report[] | undefined;
  users: UserProfile[] | undefined;
  idCounter: number | undefined;
};

const reports = globalForStore.reports ?? [];
const users = globalForStore.users ?? [];
let idCounter = globalForStore.idCounter ?? 1;

// In development, save the in-memory store to the global object to survive hot-reloads.
if (process.env.NODE_ENV !== "production") {
  globalForStore.reports = reports;
  globalForStore.users = users;
}

export async function getReports(limit?: number): Promise<Report[]> {
  // Return a sorted copy
  const sorted = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return limit ? sorted.slice(0, limit) : sorted;
}

export function addReport(report: NewReport): Report {
  const newReport: Report = {
    ...report,
    id: String(idCounter++),
    status: "PENDING",
    createdAt: new Date().toISOString(),
    upvotes: 0,
  };
  reports.push(newReport);
  if (process.env.NODE_ENV !== 'production') {
    globalForStore.idCounter = idCounter;
  }
  return newReport;
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  photoAfterUrl?: string,
): Promise<Report | undefined> {
  const reportIndex = reports.findIndex((r) => r.id === id);
  if (reportIndex !== -1) {
    reports[reportIndex].status = status;
    if (photoAfterUrl) {
        reports[reportIndex].photoAfterUrl = photoAfterUrl;
    }
    return reports[reportIndex];
  }
  return undefined;
}

export async function upvoteReport(id: string): Promise<Report | undefined> {
    const reportIndex = reports.findIndex((r) => r.id === id);
    if (reportIndex !== -1) {
        reports[reportIndex].upvotes++;
        return reports[reportIndex];
    }
    return undefined;
}

export async function downvoteReport(id: string): Promise<Report | undefined> {
    const reportIndex = reports.findIndex((r) => r.id === id);
    if (reportIndex !== -1) {
        if (reports[reportIndex].upvotes > 0) {
            reports[reportIndex].upvotes--;
        }
        return reports[reportIndex];
    }
    return undefined;
}

export async function deleteReport(id: string): Promise<boolean> {
  const index = reports.findIndex(r => r.id === id);
  if (index !== -1) {
    reports.splice(index, 1);
    return true;
  }
  return false;
}

export async function saveUser(user: UserProfile): Promise<UserProfile> {
    // Forçamos a verificação da role baseada no e-mail sempre que salvar
    const role = isEmailEmployee(user.email) ? "EMPLOYEE" : "USER";
    const userToSave = { ...user, role };

    const existingUserIndex = users.findIndex(u => u.id === user.id);
    if (existingUserIndex > -1) {
        users[existingUserIndex] = userToSave;
    } else {
        users.push(userToSave);
    }
    return userToSave;
}

export async function getUserById(id: string): Promise<UserProfile | undefined> {
    return users.find(u => u.id === id);
}
