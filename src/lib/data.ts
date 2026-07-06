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
  QueryDocumentSnapshot,
  Firestore
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeFirebase } from "@/firebase";

/**
 * Auxiliar para logs de diagnóstico.
 */
function logFirestoreOp(op: string, collection: string, path: string, data?: any) {
  const auth = getAuth();
  const user = auth.currentUser;
  console.log(`[Firestore Diagnostic]
  Operação: ${op}
  Coleção: ${collection}
  Caminho: ${path}
  UID Autenticado: ${user?.uid || 'Nulo/Deslogado'}
  Dados:`, data ? JSON.stringify(data).substring(0, 100) + '...' : 'N/A');
}

/**
 * Converte documentos do Firestore em objetos serializáveis (POJOs).
 */
function convertDoc<T>(doc: DocumentSnapshot | QueryDocumentSnapshot): T {
  const data = doc.data();
  if (!data) return {} as T;

  const converted: any = { ...data, id: doc.id };
  
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate().toISOString();
    }
  });

  return converted as T;
}

let db: Firestore | null = null;
function getDB() {
  if (!db) {
    const sdks = initializeFirebase();
    db = sdks.firestore;
  }
  return db;
}

/**
 * Busca relatos da comunidade. 
 * Usa Collection Group para permitir visualização global pública.
 * Nota: Ordenação feita em memória para evitar erro de índice ausente (Missing Index).
 */
export async function getReports(limitCount?: number): Promise<Report[]> {
  const firestore = getDB();
  logFirestoreOp('QUERY', 'collectionGroup:reports', 'Global');

  try {
    // Busca sem orderBy para evitar necessidade de índice manual no collectionGroup
    const reportsQuery = query(
      collectionGroup(firestore, "reports")
    );
    
    const snapshot = await getDocs(reportsQuery);
    const results = snapshot.docs.map(doc => convertDoc<Report>(doc));
    
    // Ordenação em memória (descendente por createdAt)
    results.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
    });
    
    return limitCount ? results.slice(0, limitCount) : results;
  } catch (error: any) {
    console.error(`[Firestore Error] getReports: ${error.message}`);
    return [];
  }
}

export async function getReportById(id: string): Promise<Report | undefined> {
  const firestore = getDB();
  try {
    const q = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    return convertDoc<Report>(snapshot.docs[0]);
  } catch (error: any) {
    console.error(`[Firestore Error] getReportById: ${error.message}`);
    return undefined;
  }
}

export async function addReport(report: NewReport): Promise<Report> {
  const firestore = getDB();
  const reportId = doc(collection(firestore, "temp")).id;
  
  const newReport: Report = {
    ...report,
    id: reportId,
    status: "UNDER_REVIEW",
    createdAt: new Date().toISOString(),
    upvotes: 0,
  };
  
  const path = `users/${report.userId}/reports/${reportId}`;
  logFirestoreOp('SET', 'reports', path, newReport);
  
  try {
    const reportRef = doc(firestore, `users/${report.userId}/reports`, reportId);
    await setDoc(reportRef, newReport);
    return newReport;
  } catch (error: any) {
    console.error(`[Firestore Error] addReport: ${error.message}`);
    throw error;
  }
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  photoAfterUrl?: string,
  extraData?: Partial<Pick<Report, 'category' | 'problem' | 'bairro' | 'location' | 'description' | 'latitude' | 'longitude'>>
): Promise<Report | undefined> {
  const firestore = getDB();
  try {
    const q = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    
    const reportDoc = snapshot.docs[0];
    const updates: any = { status };
    if (photoAfterUrl) updates.photoAfterUrl = photoAfterUrl;
    if (extraData) {
      Object.entries(extraData).forEach(([key, val]) => {
        if (val !== undefined) updates[key] = val;
      });
    }
    
    await updateDoc(reportDoc.ref, updates);
    const updated = await getDoc(reportDoc.ref);
    return convertDoc<Report>(updated);
  } catch (error: any) {
    console.error(`[Firestore Error] updateReportStatus: ${error.message}`);
    return undefined;
  }
}

export async function upvoteReport(id: string): Promise<Report | undefined> {
  const firestore = getDB();
  try {
    const q = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;

    const reportDoc = snapshot.docs[0];
    const currentUpvotes = reportDoc.data().upvotes || 0;
    await updateDoc(reportDoc.ref, { upvotes: currentUpvotes + 1 });
    
    const updated = await getDoc(reportDoc.ref);
    return convertDoc<Report>(updated);
  } catch (error: any) {
    console.error(`[Firestore Error] upvoteReport: ${error.message}`);
    return undefined;
  }
}

export async function downvoteReport(id: string): Promise<Report | undefined> {
  const firestore = getDB();
  try {
    const q = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;

    const reportDoc = snapshot.docs[0];
    const currentUpvotes = reportDoc.data().upvotes || 0;
    if (currentUpvotes <= 0) return convertDoc<Report>(reportDoc);

    await updateDoc(reportDoc.ref, { upvotes: currentUpvotes - 1 });
    const updated = await getDoc(reportDoc.ref);
    return convertDoc<Report>(updated);
  } catch (error: any) {
    console.error(`[Firestore Error] downvoteReport: ${error.message}`);
    return undefined;
  }
}

export async function deleteReport(id: string, reason: string, employeeId: string): Promise<boolean> {
  const firestore = getDB();
  try {
    const q = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    
    await updateDoc(snapshot.docs[0].ref, {
      status: 'EXCLUDED',
      exclusionReason: reason,
      excludedBy: employeeId,
      excludedAt: new Date().toISOString()
    });
    return true;
  } catch (error: any) {
    console.error(`[Firestore Error] deleteReport: ${error.message}`);
    return false;
  }
}

export async function saveUser(user: UserProfile): Promise<UserProfile> {
  const firestore = getDB();
  const role = isEmailEmployee(user.email) ? "EMPLOYEE" : "USER";
  const userToSave = { ...user, role };
  
  try {
    const userRef = doc(firestore, "users", user.id);
    await setDoc(userRef, userToSave, { merge: true });
    return userToSave;
  } catch (error: any) {
    console.error(`[Firestore Error] saveUser: ${error.message}`);
    throw error;
  }
}

export async function getUserById(id: string): Promise<UserProfile | undefined> {
  const firestore = getDB();
  try {
    const userRef = doc(firestore, "users", id);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return convertDoc<UserProfile>(snapshot);
    }
    return undefined;
  } catch (error: any) {
    console.error(`[Firestore Error] getUserById: ${error.message}`);
    return undefined;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  const firestore = getDB();
  try {
    const userRef = doc(firestore, "users", id);
    await deleteDoc(userRef);
    return true;
  } catch (error: any) {
    console.error(`[Firestore Error] deleteUser: ${error.message}`);
    return false;
  }
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const firestore = getDB();
  if (!userId) return [];
  
  logFirestoreOp('QUERY', 'notifications', `userId == ${userId}`);
  try {
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertDoc<Notification>(doc));
  } catch (error: any) {
    console.error(`[Firestore Error] getNotifications: ${error.message}`);
    return [];
  }
}

export async function addNotification(userId: string, reportId: string, type: NotificationType, title: string, message: string): Promise<Notification> {
  const firestore = getDB();
  const notificationData: Omit<Notification, 'id'> = {
    userId,
    reportId,
    type,
    title,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  
  try {
    const docRef = await addDoc(collection(firestore, "notifications"), notificationData);
    return { ...notificationData, id: docRef.id };
  } catch (error: any) {
    console.error(`[Firestore Error] addNotification: ${error.message}`);
    throw error;
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const firestore = getDB();
  try {
    const docRef = doc(firestore, "notifications", id);
    await updateDoc(docRef, { isRead: true });
    return true;
  } catch (error: any) {
    console.error(`[Firestore Error] markNotificationAsRead: ${error.message}`);
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const firestore = getDB();
  try {
    const q = query(collection(firestore, "notifications"), where("userId", "==", userId), where("isRead", "==", false));
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(d => updateDoc(d.ref, { isRead: true }));
    await Promise.all(promises);
  } catch (error: any) {
    console.error(`[Firestore Error] markAllNotificationsAsRead: ${error.message}`);
  }
}

export async function addComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'status'>): Promise<Complaint> {
  const firestore = getDB();
  const complaintData: Omit<Complaint, 'id'> = {
    ...complaint,
    createdAt: new Date().toISOString(),
    status: 'PENDING'
  };
  try {
    const docRef = await addDoc(collection(firestore, "complaints"), complaintData);
    return { ...complaintData, id: docRef.id };
  } catch (error: any) {
    console.error(`[Firestore Error] addComplaint: ${error.message}`);
    throw error;
  }
}

export async function getComplaints(): Promise<Complaint[]> {
  const firestore = getDB();
  try {
    const q = query(collection(firestore, "complaints"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertDoc<Complaint>(doc));
  } catch (error: any) {
    console.error(`[Firestore Error] getComplaints: ${error.message}`);
    return [];
  }
}