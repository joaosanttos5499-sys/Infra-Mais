
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
  const now = new Date();
  reports.push(
    {
      id: String(idCounter++),
      category: "vias_publicas",
      problem: "buracos_rua",
      bairro: "Centro",
      location: "Rua Principal, em frente ao nº 123",
      description: "Buraco grande e perigoso na via, causando risco para motoristas e ciclistas.",
      photoUrl: "https://picsum.photos/seed/pothole1/400/300",
      summary: "Buraco perigoso na Rua Principal.",
      status: "PENDING",
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      upvotes: 0,
      latitude: -6.516,
      longitude: -36.355,
    },
    {
      id: String(idCounter++),
      category: "iluminacao",
      problem: "lampada_queimada",
      bairro: "Vila Nova",
      location: "Poste na esquina da Av. Brasil com a Rua das Flores",
      description: "A lâmpada do poste está queimada há mais de uma semana, deixando a rua muito escura e insegura.",
      photoUrl: "https://picsum.photos/seed/streetlight1/400/300",
      summary: "Poste com lâmpada queimada na Vila Nova.",
      status: "IN_PROGRESS",
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      upvotes: 0,
      latitude: -6.512,
      longitude: -36.348,
    },
    {
      id: String(idCounter++),
      category: "limpeza_meio_ambiente",
      problem: "acumulo_lixo",
      bairro: "Jardim América",
      location: "Em frente ao parquinho infantil",
      description: "Acúmulo de lixo na calçada, atraindo insetos e com mau cheiro.",
      photoUrl: "https://picsum.photos/seed/garbage1/400/300",
      summary: "Lixo acumulado perto do parquinho.",
      status: "RESOLVED",
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      upvotes: 0,
      latitude: -6.518,
      longitude: -36.351,
      photoAfterUrl: "https://picsum.photos/seed/garbage-resolved/400/300",
    }
  );
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
