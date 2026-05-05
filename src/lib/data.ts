
import { type Report, type ReportStatus, type NewReport, type UserProfile, type Notification } from "@/lib/types";
import { isEmailEmployee } from "./config";

// In-memory store to persist data across hot-reloads in development
const globalForStore = globalThis as unknown as {
  reports: Report[] | undefined;
  users: UserProfile[] | undefined;
  notifications: Notification[] | undefined;
  idCounter: number | undefined;
  notificationCounter: number | undefined;
};

const reports = globalForStore.reports ?? [];
const users = globalForStore.users ?? [];
const notifications = globalForStore.notifications ?? [];
let idCounter = globalForStore.idCounter ?? 1;
let notificationCounter = globalForStore.notificationCounter ?? 1;

// In development, save the in-memory store to the global object to survive hot-reloads.
if (process.env.NODE_ENV !== "production") {
  globalForStore.reports = reports;
  globalForStore.users = users;
  globalForStore.notifications = notifications;
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
    status: "UNDER_REVIEW", // Inicia em análise para moderação
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

export async function deleteUser(id: string): Promise<boolean> {
  // Remove o perfil se existir
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex !== -1) {
    users.splice(userIndex, 1);
  }

  // Remove todos os relatos deste usuário (sempre tenta limpar, mesmo que o perfil não exista)
  let i = reports.length;
  while (i--) {
    if (reports[i].userId === id) {
      reports.splice(i, 1);
    }
  }

  // Remove todas as notificações deste usuário
  let j = notifications.length;
  while (j--) {
    if (notifications[j].userId === id) {
      notifications.splice(j, 1);
    }
  }

  // Sempre retorna true para permitir que a exclusão continue no lado do cliente (Auth)
  return true;
}

// Notifications Data Functions
export async function getNotifications(userId: string): Promise<Notification[]> {
    return notifications
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addNotification(userId: string, reportId: string, message: string): Notification {
    const newNotification: Notification = {
        id: String(notificationCounter++),
        userId,
        reportId,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
    };
    notifications.push(newNotification);
    if (process.env.NODE_ENV !== 'production') {
        globalForStore.notificationCounter = notificationCounter;
    }
    return newNotification;
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
        notifications[index].isRead = true;
        return true;
    }
    return false;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    notifications.forEach(n => {
        if (n.userId === userId) {
            n.isRead = true;
        }
    });
}
