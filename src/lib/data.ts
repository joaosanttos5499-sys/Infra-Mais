
import { type Report, type ReportStatus, type NewReport, type UserProfile, type Notification, type Complaint, type NotificationType } from "@/lib/types";
import { isEmailEmployee } from "./config";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  collectionGroup,
  orderBy,
  deleteDoc,
  Timestamp,
  addDoc
} from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

// Inicializa os SDKs do Firebase para uso no servidor ou cliente
const { firestore } = initializeFirebase();

/**
 * Converte documentos do Firestore em objetos serializáveis (POJOs)
 */
function convertDoc<T>(doc: any): T {
  const data = doc.data();
  // Converte Timestamps do Firebase para strings ISO para evitar erros de serialização no Next.js
  const converted: any = { ...data, id: doc.id };
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate().toISOString();
    }
  });
  return converted as T;
}

export async function getReports(limitCount?: number): Promise<Report[]> {
  try {
    // Busca em todas as subcoleções 'reports' usando collectionGroup
    const reportsQuery = query(
      collectionGroup(firestore, "reports"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(reportsQuery);
    const results = snapshot.docs.map(doc => convertDoc<Report>(doc));
    return limitCount ? results.slice(0, limitCount) : results;
  } catch (error) {
    console.error("Erro ao buscar relatos no Firestore:", error);
    return [];
  }
}

export async function getReportById(id: string): Promise<Report | undefined> {
  try {
    const reportsQuery = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(reportsQuery);
    if (snapshot.empty) return undefined;
    return convertDoc<Report>(snapshot.docs[0]);
  } catch (error) {
    console.error(`Erro ao buscar relato ${id}:`, error);
    return undefined;
  }
}

export async function addReport(report: NewReport): Promise<Report> {
  const id = doc(collection(firestore, "temp")).id; // Gera um ID único
  const newReport: Report = {
    ...report,
    id,
    status: "UNDER_REVIEW",
    createdAt: new Date().toISOString(),
    upvotes: 0,
  };
  
  const reportRef = doc(firestore, `users/${report.userId}/reports`, id);
  await setDoc(reportRef, newReport);
  return newReport;
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  photoAfterUrl?: string,
  extraData?: Partial<Pick<Report, 'category' | 'problem' | 'bairro' | 'location' | 'description' | 'latitude' | 'longitude'>>
): Promise<Report | undefined> {
  try {
    const reportsQuery = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(reportsQuery);
    
    if (snapshot.empty) return undefined;
    
    const reportDoc = snapshot.docs[0];
    const reportRef = reportDoc.ref;
    
    const updates: any = { status };
    if (photoAfterUrl) updates.photoAfterUrl = photoAfterUrl;
    if (extraData) Object.assign(updates, extraData);
    
    await updateDoc(reportRef, updates);
    const updated = await getDoc(reportRef);
    return convertDoc<Report>(updated);
  } catch (error) {
    console.error(`Erro ao atualizar status do relato ${id}:`, error);
    return undefined;
  }
}

export async function upvoteReport(id: string): Promise<Report | undefined> {
  const report = await getReportById(id);
  if (!report) return undefined;
  
  const reportsQuery = query(collectionGroup(firestore, "reports"), where("id", "==", id));
  const snapshot = await getDocs(reportsQuery);
  const reportRef = snapshot.docs[0].ref;
  
  await updateDoc(reportRef, { upvotes: (report.upvotes || 0) + 1 });
  return { ...report, upvotes: (report.upvotes || 0) + 1 };
}

export async function downvoteReport(id: string): Promise<Report | undefined> {
  const report = await getReportById(id);
  if (!report || (report.upvotes || 0) <= 0) return report;
  
  const reportsQuery = query(collectionGroup(firestore, "reports"), where("id", "==", id));
  const snapshot = await getDocs(reportsQuery);
  const reportRef = snapshot.docs[0].ref;
  
  await updateDoc(reportRef, { upvotes: report.upvotes - 1 });
  return { ...report, upvotes: report.upvotes - 1 };
}

export async function deleteReport(id: string, reason: string, employeeId: string): Promise<boolean> {
  try {
    const reportsQuery = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(reportsQuery);
    if (snapshot.empty) return false;
    
    const reportRef = snapshot.docs[0].ref;
    await updateDoc(reportRef, {
      status: 'EXCLUDED',
      exclusionReason: reason,
      excludedBy: employeeId,
      excludedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error(`Erro ao excluir relato ${id}:`, error);
    return false;
  }
}

export async function saveUser(user: UserProfile): Promise<UserProfile> {
  const role = isEmailEmployee(user.email) ? "EMPLOYEE" : "USER";
  const userToSave = { ...user, role };
  
  console.log(`[Firestore] Salvando perfil do usuário em /users/${user.id}`);
  console.log(`[Firestore] Dados:`, JSON.stringify(userToSave));
  
  const userRef = doc(firestore, "users", user.id);
  await setDoc(userRef, userToSave, { merge: true });
  
  console.log(`[Firestore] Perfil salvo com sucesso.`);
  return userToSave;
}

export async function getUserById(id: string): Promise<UserProfile | undefined> {
  try {
    console.log(`[Firestore] Buscando perfil do usuário: /users/${id}`);
    const userRef = doc(firestore, "users", id);
    const snapshot = await getDoc(userRef);
    
    if (snapshot.exists()) {
      const userData = convertDoc<UserProfile>(snapshot);
      console.log(`[Firestore] Perfil encontrado para o UID ${id}`);
      return userData;
    }
    
    console.warn(`[Firestore] Perfil NÃO encontrado para o UID ${id}`);
    return undefined;
  } catch (error) {
    console.error(`[Firestore] Erro ao buscar usuário ${id}:`, error);
    return undefined;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const userRef = doc(firestore, "users", id);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error(`Erro ao excluir usuário ${id}:`, error);
    return false;
  }
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertDoc<Notification>(doc));
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return [];
  }
}

export async function addNotification(userId: string, reportId: string, type: NotificationType, title: string, message: string): Promise<Notification> {
  const notificationData: Omit<Notification, 'id'> = {
    userId,
    reportId,
    type,
    title,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  
  const docRef = await addDoc(collection(firestore, "notifications"), notificationData);
  return { ...notificationData, id: docRef.id };
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    const docRef = doc(firestore, "notifications", id);
    await updateDoc(docRef, { isRead: true });
    return true;
  } catch {
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const q = query(collection(firestore, "notifications"), where("userId", "==", userId), where("isRead", "==", false));
  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map(d => updateDoc(d.ref, { isRead: true }));
  await Promise.all(promises);
}

export async function addComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'status'>): Promise<Complaint> {
  const complaintData: Omit<Complaint, 'id'> = {
    ...complaint,
    createdAt: new Date().toISOString(),
    status: 'PENDING'
  };
  const docRef = await addDoc(collection(firestore, "complaints"), complaintData);
  return { ...complaintData, id: docRef.id };
}

export async function getComplaints(): Promise<Complaint[]> {
  const q = query(collection(firestore, "complaints"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => convertDoc<Complaint>(doc));
}
