import { type Report, type ReportStatus, type NewReport } from "@/lib/types";

// In-memory store
const globalForReports = globalThis as unknown as {
  reports: Report[] | undefined;
};

const reports = globalForReports.reports ?? [];
if (process.env.NODE_ENV !== "production") globalForReports.reports = reports;

let idCounter = reports.length > 0 ? Math.max(...reports.map(r => parseInt(r.id))) + 1 : 1;

if (reports.length === 0) {
  // Add some initial data for demonstration
  reports.push({
    id: String(idCounter++),
    category: 'pothole',
    location: '123 Main St, Anytown, USA',
    description: 'Large pothole in the middle of the street, causing traffic issues.',
    photoUrl: 'https://picsum.photos/seed/pothole1/600/400',
    summary: 'A significant pothole at 123 Main St is disrupting traffic flow.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
  }, {
    id: String(idCounter++),
    category: 'streetlight',
    location: 'Corner of Oak & Maple Ave',
    description: 'The streetlight on the corner is completely out. It has been dark for a few nights now, which feels unsafe.',
    photoUrl: 'https://picsum.photos/seed/light1/600/400',
    summary: 'A broken streetlight at Oak and Maple Ave is causing safety concerns due to darkness.',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  });
}


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
  };
  reports.push(newReport);
  return newReport;
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus
): Promise<Report | undefined> {
  const reportIndex = reports.findIndex((r) => r.id === id);
  if (reportIndex !== -1) {
    reports[reportIndex].status = status;
    return reports[reportIndex];
  }
  return undefined;
}
