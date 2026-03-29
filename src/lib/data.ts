
import { type Report, type ReportStatus, type NewReport, type UserProfile } from "@/lib/types";

// In-memory store
const globalForReports = globalThis as unknown as {
  reports: Report[] | undefined;
  users: UserProfile[] | undefined;
};

const reports = globalForReports.reports ?? [];
const users = globalForReports.users ?? [];
if (process.env.NODE_ENV !== "production") {
    globalForReports.reports = reports;
    globalForReports.users = users;
}

let idCounter = reports.length > 0 ? Math.max(...reports.map(r => parseInt(r.id))) + 1 : 1;

export async function getReports(): Promise<Report[]> {
  // Return a sorted copy
  return [...reports].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function addReport(report: NewReport): Promise<Report> {
  const newReport: Report = {
    ...report,
    id: String(idCounter++),
    status: "PENDING",
    createdAt: new Date(),
    upvotes: 0,
  };
  reports.push(newReport);
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

export async function saveUser(user: UserProfile): Promise<UserProfile> {
    const existingUserIndex = users.findIndex(u => u.id === user.id);
    if (existingUserIndex > -1) {
        users[existingUserIndex] = user;
    } else {
        users.push(user);
    }
    return user;
}

export async function getUserById(id: string): Promise<UserProfile | undefined> {
    return users.find(u => u.id === id);
}
