
import { type Report, type ReportStatus, type NewReport, type UserProfile, type Notification, type Complaint, type NotificationType } from "@/lib/types";
import { isEmailEmployee } from "./config";

const globalForStore = globalThis as unknown as {
  reports: Report[] | undefined;
  users: UserProfile[] | undefined;
  notifications: Notification[] | undefined;
  complaints: Complaint[] | undefined;
  idCounter: number | undefined;
  notificationCounter: number | undefined;
  complaintCounter: number | undefined;
};

// Initialize global storage if not present to ensure persistence across reloads
if (!globalForStore.reports) globalForStore.reports = [];
if (!globalForStore.users) globalForStore.users = [];
if (!globalForStore.notifications) globalForStore.notifications = [];
if (!globalForStore.complaints) globalForStore.complaints = [];
if (globalForStore.idCounter === undefined) globalForStore.idCounter = 1;
if (globalForStore.notificationCounter === undefined) globalForStore.notificationCounter = 1;
if (globalForStore.complaintCounter === undefined) globalForStore.complaintCounter = 1;

const reports = globalForStore.reports;
const users = globalForStore.users;
const notifications = globalForStore.notifications;
const complaints = globalForStore.complaints;

export async function getReports(limit?: number): Promise<Report[]> {
  const sorted = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return limit ? sorted.slice(0, limit) : sorted;
}

export function addReport(report: NewReport): Report {
  const newReport: Report = {
    ...report,
    id: String(globalForStore.idCounter!++),
    status: "UNDER_REVIEW",
    createdAt: new Date().toISOString(),
    upvotes: 0,
  };
  reports.push(newReport);
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
    // Soft delete: muda o status para EXCLUDED em vez de remover do array
    reports[index].status = 'EXCLUDED';
    return true;
  }
  return false;
}

export async function saveUser(user: UserProfile): Promise<UserProfile> {
    const role = isEmailEmployee(user.email) ? "EMPLOYEE" : "USER";
    const userToSave = { ...user, role };

    const existingUserIndex = users.findIndex(u => u.id === user.id);
    if (existingUserIndex > -1) {
        users[existingUserIndex] = {
            ...users[existingUserIndex],
            ...userToSave
        };
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

export function addNotification(userId: string, reportId: string, type: NotificationType, title: string, message: string): Notification {
    const newNotification: Notification = {
        id: String(globalForStore.notificationCounter!++),
        userId,
        reportId,
        type,
        title,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
    };
    notifications.push(newNotification);
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

// Funções para Denúncias
export async function addComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'status'>): Promise<Complaint> {
  const newComplaint: Complaint = {
    ...complaint,
    id: String(globalForStore.complaintCounter!++),
    createdAt: new Date().toISOString(),
    status: 'PENDING'
  };
  complaints.push(newComplaint);
  return newComplaint;
}

export async function getComplaints(): Promise<Complaint[]> {
  return [...complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getReportById(id: string): Promise<Report | undefined> {
  return reports.find(r => r.id === id);
}
