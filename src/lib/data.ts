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
  Estado Auth: ${user ? 'Autenticado' : 'Não Autenticado'}
  Dados:`, data ? JSON.stringify(data).substring(0, 200) + '...' : 'N/A');
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
    } else if (converted[key] instanceof Date) {
      converted[key] = converted[key].toISOString();
    }
  });

  return converted as T;
}

/**
 * Singleton-like access to Firestore
 */
let db: Firestore | null = null;
function getDB() {
  if (!db) {
    const sdks = initializeFirebase();
    db = sdks.firestore;
  }
  return db;
}

export async function getReports(limitCount?: number): Promise<Report[]> {
  const firestore = getDB();
  const auth = getAuth();
  const user = auth.currentUser;

  // Verifica se existe um usuário autenticado para cumprir a regra de segurança do Firestore
  if (!user) {
    console.warn("[Firestore] getReports chamado sem usuário autenticado. Retornando lista vazia.");
    return [];
  }

  // Caminho específico do usuário conforme exigido pelas regras de segurança
  const path = `users/${user.uid}/reports`;
  logFirestoreOp('QUERY', 'reports', path);

  try {
    // A consulta agora utiliza a coleção específica do usuário em vez de collectionGroup
    const reportsRef = collection(firestore, "users", user.uid, "reports");
    const reportsQuery = query(
      reportsRef,
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(reportsQuery);
    const results = snapshot.docs.map(doc => convertDoc<Report>(doc));
    
    return limitCount ? results.slice(0, limitCount) : results;
  } catch (error: any) {
    console.error(`[Firestore Error] Falha em getReports para o usuário ${user.uid}: ${error.message}`, { code: error.code });
    return [];
  }
}

export async function getReportById(id: string): Promise<Report | undefined> {
  const firestore = getDB();
  logFirestoreOp('QUERY', 'collectionGroup:reports', `id == ${id}`);
  try {
    const reportsQuery = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(reportsQuery);
    if (snapshot.empty) return undefined;
    return convertDoc<Report>(snapshot.docs[0]);
  } catch (error: any) {
    console.error(`[Firestore Error] Falha em getReportById (${id}): ${error.message}`);
    return undefined;
  }
}

export async function addReport(report: NewReport): Promise<Report> {
  const firestore = getDB();
  const id = doc(collection(firestore, "temp")).id;
  const path = `users/${report.userId}/reports/${id}`;
  
  const newReport: Report = {
    ...report,
    id,
    status: "UNDER_REVIEW",
    createdAt: new Date().toISOString(),
    upvotes: 0,
  };
  
  logFirestoreOp('SET', 'reports', path, newReport);
  
  try {
    const reportRef = doc(firestore, `users/${report.userId}/reports`, id);
    await setDoc(reportRef, newReport);
    return newReport;
  } catch (error: any) {
    console.error(`[Firestore Error] Falha em addReport no caminho ${path}: ${error.message}`);
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
  logFirestoreOp('QUERY/UPDATE', 'collectionGroup:reports', `id == ${id}`);
  try {
    const reportsQuery = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(reportsQuery);
    
    if (snapshot.empty) {
      console.warn(`[Firestore Warning] Relato ${id} não encontrado para atualização.`);
      return undefined;
    }
    
    const reportRef = snapshot.docs[0].ref;
    const updates: any = { status };
    if (photoAfterUrl) updates.photoAfterUrl = photoAfterUrl;
    if (extraData) {
      Object.keys(extraData).forEach(key => {
        if ((extraData as any)[key] !== undefined) {
          updates[key] = (extraData as any)[key];
        }
      });
    }
    
    logFirestoreOp('UPDATE', 'reports', reportRef.path, updates);
    await updateDoc(reportRef, updates);
    const updated = await getDoc(reportRef);
    return convertDoc<Report>(updated);
  } catch (error: any) {
    console.error(`[Firestore Error] Falha em updateReportStatus (${id}): ${error.message}`);
    return undefined;
  }
}

export async function upvoteReport(id: string): Promise<Report | undefined> {
  const firestore = getDB();
  try {
    const reportsQuery = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(reportsQuery);
    if (snapshot.empty) return undefined;

    const reportDoc = snapshot.docs[0];
    const currentUpvotes = reportDoc.data().upvotes || 0;
    
    logFirestoreOp('UPDATE (upvote)', 'reports', reportDoc.ref.path, { upvotes: currentUpvotes + 1 });
    await updateDoc(reportDoc.ref, { upvotes: currentUpvotes + 1 });
    
    const updated = await getDoc(reportDoc.ref);
    return convertDoc<Report>(updated);
  } catch (error: any) {
    console.error(`[Firestore Error] Falha no upvote (${id}): ${error.message}`);
    return undefined;
  }
}

export async function downvoteReport(id: string): Promise<Report | undefined> {
  const firestore = getDB();
  try {
    const reportsQuery = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(reportsQuery);
    if (snapshot.empty) return undefined;

    const reportDoc = snapshot.docs[0];
    const currentUpvotes = reportDoc.data().upvotes || 0;
    if (currentUpvotes <= 0) return convertDoc<Report>(reportDoc);

    logFirestoreOp('UPDATE (downvote)', 'reports', reportDoc.ref.path, { upvotes: currentUpvotes - 1 });
    await updateDoc(reportDoc.ref, { upvotes: currentUpvotes - 1 });
    const updated = await getDoc(reportDoc.ref);
    return convertDoc<Report>(updated);
  } catch (error: any) {
    console.error(`[Firestore Error] Falha no downvote (${id}): ${error.message}`);
    return undefined;
  }
}

export async function deleteReport(id: string, reason: string, employeeId: string): Promise<boolean> {
  const firestore = getDB();
  try {
    const reportsQuery = query(collectionGroup(firestore, "reports"), where("id", "==", id));
    const snapshot = await getDocs(reportsQuery);
    if (snapshot.empty) return false;
    
    const reportRef = snapshot.docs[0].ref;
    const updates = {
      status: 'EXCLUDED',
      exclusionReason: reason,
      excludedBy: employeeId,
      excludedAt: new Date().toISOString()
    };
    
    logFirestoreOp('UPDATE (delete)', 'reports', reportRef.path, updates);
    await updateDoc(reportRef, updates);
    return true;
  } catch (error: any) {
    console.error(`[Firestore Error] Falha ao marcar como excluído (${id}): ${error.message}`);
    return false;
  }
}

export async function saveUser(user: UserProfile): Promise<UserProfile> {
  const firestore = getDB();
  const role = isEmailEmployee(user.email) ? "EMPLOYEE" : "USER";
  const userToSave = { ...user, role };
  const path = `users/${user.id}`;
  
  logFirestoreOp('SET', 'users', path, userToSave);
  
  try {
    const userRef = doc(firestore, "users", user.id);
    await setDoc(userRef, userToSave, { merge: true });
    return userToSave;
  } catch (error: any) {
    console.error(`[Firestore Error] Falha ao salvar usuário no caminho ${path}: ${error.message}`);
    throw error;
  }
}

export async function getUserById(id: string): Promise<UserProfile | undefined> {
  const firestore = getDB();
  const path = `users/${id}`;
  logFirestoreOp('GET', 'users', path);
  try {
    const userRef = doc(firestore, "users", id);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return convertDoc<UserProfile>(snapshot);
    }
    return undefined;
  } catch (error: any) {
    console.error(`[Firestore Error] Falha ao buscar usuário no caminho ${path}: ${error.message}`);
    return undefined;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  const firestore = getDB();
  const path = `users/${id}`;
  logFirestoreOp('DELETE', 'users', path);
  try {
    const userRef = doc(firestore, "users", id);
    await deleteDoc(userRef);
    return true;
  } catch (error: any) {
    console.error(`[Firestore Error] Falha ao excluir perfil no caminho ${path}: ${error.message}`);
    return false;
  }
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const firestore = getDB();
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
    console.error(`[Firestore Error] Falha em getNotifications (${userId}): ${error.message}`);
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
  
  logFirestoreOp('ADD', 'notifications', 'notifications (auto-id)', notificationData);
  
  try {
    const docRef = await addDoc(collection(firestore, "notifications"), notificationData);
    return { ...notificationData, id: docRef.id };
  } catch (error: any) {
    console.error(`[Firestore Error] Falha ao adicionar notificação: ${error.message}`);
    throw error;
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const firestore = getDB();
  const path = `notifications/${id}`;
  logFirestoreOp('UPDATE', 'notifications', path, { isRead: true });
  try {
    const docRef = doc(firestore, "notifications", id);
    await updateDoc(docRef, { isRead: true });
    return true;
  } catch (error: any) {
    console.error(`[Firestore Error] Falha ao marcar notificação como lida (${id}): ${error.message}`);
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const firestore = getDB();
  logFirestoreOp('QUERY/UPDATE', 'notifications', `userId == ${userId} && isRead == false`);
  try {
    const q = query(collection(firestore, "notifications"), where("userId", "==", userId), where("isRead", "==", false));
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(d => updateDoc(d.ref, { isRead: true }));
    await Promise.all(promises);
  } catch (error: any) {
    console.error(`[Firestore Error] Falha ao marcar todas as notificações como lidas (${userId}): ${error.message}`);
  }
}

export async function addComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'status'>): Promise<Complaint> {
  const firestore = getDB();
  const complaintData: Omit<Complaint, 'id'> = {
    ...complaint,
    createdAt: new Date().toISOString(),
    status: 'PENDING'
  };
  logFirestoreOp('ADD', 'complaints', 'complaints (auto-id)', complaintData);
  try {
    const docRef = await addDoc(collection(firestore, "complaints"), complaintData);
    return { ...complaintData, id: docRef.id };
  } catch (error: any) {
    console.error(`[Firestore Error] Falha ao adicionar denúncia: ${error.message}`);
    throw error;
  }
}

export async function getComplaints(): Promise<Complaint[]> {
  const firestore = getDB();
  logFirestoreOp('QUERY', 'complaints', 'Global');
  try {
    const q = query(collection(firestore, "complaints"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertDoc<Complaint>(doc));
  } catch (error: any) {
    console.error(`[Firestore Error] Falha em getComplaints: ${error.message}`);
    return [];
  }
}