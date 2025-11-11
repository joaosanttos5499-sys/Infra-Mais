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
    bairro: 'Centro',
    location: 'Rua Principal, 123, Qualquerlugar, BR',
    description: 'Buraco grande no meio da rua, causando problemas no trânsito.',
    photoUrl: 'https://picsum.photos/seed/pothole1/600/400',
    summary: 'Um buraco significativo na Rua Principal, 123, está atrapalhando o fluxo do trânsito.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    upvotes: 12,
  }, {
    id: String(idCounter++),
    category: 'streetlight',
    bairro: 'Vila Madalena',
    location: 'Esquina da Av. Carvalho com a Alameda Bordo',
    description: 'O poste de luz da esquina está completamente apagado. Já faz algumas noites que está escuro, o que parece perigoso.',
    photoUrl: 'https://picsum.photos/seed/light1/600/400',
    summary: 'Um poste de luz quebrado na esquina da Av. Carvalho com a Alameda Bordo está causando preocupações de segurança devido à escuridão.',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    upvotes: 5,
  },
  {
    id: String(idCounter++),
    category: 'garbage',
    bairro: 'Jardins',
    location: 'Praça das Flores',
    description: 'Lixo acumulado na praça, atraindo pragas.',
    photoUrl: 'https://picsum.photos/seed/garbage1/600/400',
    photoAfterUrl: 'https://picsum.photos/seed/garbage-resolved/600/400',
    summary: 'Acúmulo de lixo na Praça das Flores necessita de remoção urgente.',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    upvotes: 25,
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