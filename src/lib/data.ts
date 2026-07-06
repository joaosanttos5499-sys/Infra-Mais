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
  addDoc,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

const { firestore } = initializeFirebase();

/**
 * Converte documentos do Firestore em objetos serializáveis (POJOs).
 * Essencial para evitar erros de serialização (como JSON.parse/useState) 
 * ao passar dados de Server Components para Client Components.
 */
function convertDoc<T>(doc: DocumentSnapshot | QueryDocumentSnapshot): T {
  const data = doc.data();
  if (!data) return {} as T;

  const converted: any = { ...data, id: doc.id };
  
  // Converte Timestamps e outros objetos complexos para strings ISO
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate().toISOString();
    } else if (converted[key] instanceof Date) {
      converted[key] = converted[key].toISOString();
    }
  });

  return converted as T;
}

export async function getReports(limitCount?: number): Promise<Report[]> {
  try {
    const reportsQuery = query(
      collectionGroup(firestore, "reports"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(reportsQuery);
    const results = snapshot.docs.map(doc => convertDoc<Report>(doc));
    
    // Retorna apenas os dados necessários para evitar sobrecarga de memória no servidor
    return limitCount ? results.slice(0, limitCount) : results;
  } catch (error) {
    console.error("[Firestore] Erro ao buscar relatos:", error);
    // Retorna array vazio em caso de erro de permissão para não quebrar a UI
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
    console.error(`[Firestore] Erro ao buscar relato ${id}:`, error);
    return undefined;
  }
}

export async function addReport(report: NewReport): Promise<Report> {
  const id = doc(collection(firestore, "temp")).id;
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
    
    const reportRef = snapshot.docs[0].ref;
    const updates: any = { status };
    if (photoAfterUrl) updates.photoAfterUrl = photoAfterUrl;
    if (extraData) Object.assign(updates, extraData);
    
    await updateDoc(reportRef, updates);
    const updated = await getDoc(reportRef);
    return convertDoc<Report>(updated);
  } catch (error) {
    console.error(`[Firestore] Erro ao atualizar status ${id}:`, error);
    return undefined;
  }
}

export async function upvoteReport(id: string): Promise<Report | undefined> {
  try {
    const reportsQuery = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(reportsQuery);
    if (snapshot.empty) return undefined;

    const reportDoc = snapshot.docs[0];
    const currentUpvotes = reportDoc.data().upvotes || 0;
    await updateDoc(reportDoc.ref, { upvotes: currentUpvotes + 1 });
    
    const updated = await getDoc(reportDoc.ref);
    return convertDoc<Report>(updated);
  } catch (error) {
    console.error(`[Firestore] Erro no upvote ${id}:`, error);
    return undefined;
  }
}

export async function downvoteReport(id: string): Promise<Report | undefined> {
  try {
    const reportsQuery = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(reportsQuery);
    if (snapshot.empty) return undefined;

    const reportDoc = snapshot.docs[0];
    const currentUpvotes = reportDoc.data().upvotes || 0;
    if (currentUpvotes <= 0) return convertDoc<Report>(reportDoc);

    await updateDoc(reportDoc.ref, { upvotes: currentUpvotes - 1 });
    const updated = await getDoc(reportDoc.ref);
    return convertDoc<Report>(updated);
  } catch (error) {
    console.error(`[Firestore] Erro no downvote ${id}:`, error);
    return undefined;
  }
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
    console.error(`[Firestore] Erro ao marcar como excluído ${id}:`, error);
    return false;
  }
}

export async function saveUser(user: UserProfile): Promise<UserProfile> {
  const role = isEmailEmployee(user.email) ? "EMPLOYEE" : "USER";
  const userToSave = { ...user, role };
  const userRef = doc(firestore, "users", user.id);
  await setDoc(userRef, userToSave, { merge: true });
  return userToSave;
}

export async function getUserById(id: string): Promise<UserProfile | undefined> {
  try {
    const userRef = doc(firestore, "users", id);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return convertDoc<UserProfile>(snapshot);
    }
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
    console.error(`[Firestore] Erro ao excluir perfil ${id}:`, error);
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
    console.error("[Firestore] Erro ao buscar notificações:", error);
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