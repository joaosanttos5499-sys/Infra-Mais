import { type Report, type ReportStatus, type NewReport, type UserProfile, type Notification } from "@/lib/types";
import { isEmailEmployee } from "./config";

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

if (process.env.NODE_ENV !== "production") {
  globalForStore.reports = reports;
  globalForStore.users = users;
  globalForStore.notifications = notifications;
}

export async function getReports(limit?: number): Promise<Report[]> {
  const sorted = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return limit ? sorted.slice(0, limit) : sorted;
}

export function addReport(report: NewReport): Report {
  const newReport: Report = {
    ...report,
    id: String(idCounter++),
    status: "UNDER_REVIEW",
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
  extraData?: Partial<Pick<Report, 'category' | 'problem' | 'bairro' | 'location' | 'description' | 'latitude' | 'longitude'>>
): Promise<Report | undefined> {
  const reportIndex = reports.findIndex((r) => r.id === id);
  if (reportIndex !== -1) {
    reports[reportIndex].status = status;
    if (photoAfterUrl) reports[reportIndex].photoAfterUrl = photoAfterUrl;
    if (extraData) {
        Object.assign(reports[reportIndex], extraData);
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
        if (reports[reportIndex].upvotes > 0) reports[reportIndex].upvotes--;
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
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex !== -1) users.splice(userIndex, 1);

  let i = reports.length;
  while (i--) {
    // Só deleta o relato se ainda estiver em análise. 
    // Relatos aprovados (patrimônio da cidade) ficam salvos mesmo sem a conta.
    if (reports[i].userId === id && reports[i].status === 'UNDER_REVIEW') {
      reports.splice(i, 1);
    }
  }

  let j = notifications.length;
  while (j--) {
    if (notifications[j].userId === id) notifications.splice(j, 1);
  }

  return true;
}

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
        if (n.userId === userId) n.isRead = true;
    });
}
