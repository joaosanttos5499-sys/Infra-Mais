
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { summarizeReport } from "@/ai/flows/summarize-report-for-city-employee";
import { 
    updateReportStatus as dbUpdateReportStatus, 
    upvoteReport as dbUpvoteReport, 
    downvoteReport as dbDownvoteReport, 
    saveUser, 
    getUserById, 
    deleteReport as dbDeleteReport, 
    deleteUser as dbDeleteUser, 
    addNotification,
    markNotificationAsRead as dbMarkAsRead,
    markAllNotificationsAsRead as dbMarkAllAsRead,
    addComplaint,
    getReportById
} from "@/lib/data";
import { type Report, type ReportStatus, type UserProfile, type Complaint } from "@/lib/types";
import { UpdateProfileSchema } from "./schemas";
import { createAvatarSvg } from "./avatar";
import { isEmailEmployee } from "./config";

export type FormState = {
  message?: string | null;
  success?: boolean;
  errors?: {
    category?: string[];
    problem?: string[];
    city?: string[];
    bairro?: string[];
    location?: string[];
    description?: string[];
    photo?: string[];
    latitude?: string[];
    longitude?: string[];
    address?: string[];
    _form?: string[];
  };
};

const fileToDataUri = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${file.type};base64,${base64}`;
};

type UpdateActionState = { success: boolean; message?: string; };

export async function updateReportStatus(
  prevState: UpdateActionState,
  payload: { reportId: string, formData: FormData }
): Promise<UpdateActionState> {
  const { reportId, formData } = payload;
  
  const oldReport = await getReportById(reportId);
  if (!oldReport) return { success: false, message: "Relato não encontrado." };

  const status = formData.get("status") as ReportStatus;
  const photoAfterFile = formData.get("photoAfter") as File | null;
  
  const category = formData.get("category") as string;
  const problem = formData.get("problem") as string;
  const bairro = formData.get("bairro") as string;
  const location = formData.get("location") as string;
  const description = formData.get("description") as string;
  const latitude = formData.get("latitude") ? Number(formData.get("latitude")) : undefined;
  const longitude = formData.get("longitude") ? Number(formData.get("longitude")) : undefined;

  let photoAfterUrl: string | undefined = undefined;

  try {
    if (photoAfterFile && photoAfterFile.size > 0) {
      photoAfterUrl = await fileToDataUri(photoAfterFile);
    }

    if (status === 'RESOLVED' && !photoAfterUrl && !oldReport.photoAfterUrl) {
        return { success: false, message: "A foto da solução é obrigatória." };
    }

    const updatedReport = await dbUpdateReportStatus(reportId, status, photoAfterUrl, {
        category, problem, bairro, location, description, latitude, longitude
    });
    
    if (updatedReport) {
        if (oldReport.status === 'UNDER_REVIEW' && status !== 'UNDER_REVIEW') {
            await addNotification(updatedReport.userId, reportId, 'APPROVED', 'Relato aprovado', 'Seu relato foi aprovado e agora está disponível para acompanhamento público.');
        } else if (status === 'RESOLVED' && oldReport.status !== 'RESOLVED') {
            await addNotification(updatedReport.userId, reportId, 'RESOLVED', 'Problema resolvido', 'Seu relato foi marcado como resolvido. Agradecemos por contribuir com a cidade.');
        }
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/funcionarios");
    revalidatePath("/minha-conta");
    return { success: true, message: "Relatório atualizado com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Falha ao atualizar relatório." };
  }
}

export async function upvoteReportAction(reportId: string) {
    try {
        await dbUpvoteReport(reportId);
        revalidatePath("/"); revalidatePath("/dashboard");
        return { success: true };
    } catch (error) { return { success: false }; }
}

export async function downvoteReportAction(reportId: string) {
    try {
        await dbDownvoteReport(reportId);
        revalidatePath("/"); revalidatePath("/dashboard");
        return { success: true };
    } catch (error) { return { success: false }; }
}

export async function deleteReportAction(reportId: string, reason: string, employeeId: string) {
  try {
    const report = await getReportById(reportId);
    if (!report) return { success: false, message: "Relato não encontrado." };

    const success = await dbDeleteReport(reportId, reason, employeeId);
    if (!success) return { success: false, message: "Falha ao remover." };
    
    await addNotification(report.userId, reportId, 'EXCLUDED', 'Relato removido', `Seu relato foi removido. Motivo: ${reason}`);

    revalidatePath("/"); revalidatePath("/dashboard"); revalidatePath("/minha-conta"); revalidatePath("/funcionarios");
    return { success: true };
  } catch (error) { return { success: false }; }
}

export async function saveUserProfileAction(userProfile: Omit<UserProfile, 'photoURL' | 'role'> & { photoURL?: string }): Promise<{ success: boolean; error?: string; photoURL?: string; }> {
  try {
    const role = isEmailEmployee(userProfile.email) ? "EMPLOYEE" : "USER";
    const avatarSvg = userProfile.photoURL || createAvatarSvg(userProfile.email);
    const finalUserProfile: UserProfile = { ...userProfile, photoURL: avatarSvg, role };
    await saveUser(finalUserProfile);
    revalidatePath('/'); revalidatePath('/minha-conta');
    return { success: true, photoURL: finalUserProfile.photoURL };
  } catch (error) { 
    console.error("[Actions] Erro ao salvar perfil:", error);
    return { success: false, error: "Erro ao salvar perfil no banco de dados." }; 
  }
}

export async function fetchUserProfileAction(userId: string): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const profile = await getUserById(userId);
    return { success: true, data: profile };
  } catch (error) {
    console.error("[Actions] Erro ao buscar perfil:", error);
    return { success: false, error: "Erro ao buscar perfil no banco de dados." };
  }
}

export async function updateUserProfileAction(userId: string, data: { name: string }): Promise<{ success: boolean, error?: string }> {
  const validatedFields = UpdateProfileSchema.safeParse(data);
  if (!validatedFields.success) return { success: false, error: "Nome inválido." };

  try {
    await saveUser({ id: userId, name: validatedFields.data.name } as any);
    revalidatePath('/minha-conta');
    return { success: true };
  } catch (error) { return { success: false, error: "Erro ao atualizar." }; }
}

export async function deleteAccountAction(userId: string) {
  try {
    await dbDeleteUser(userId);
    revalidatePath("/"); revalidatePath("/dashboard"); revalidatePath("/minha-conta");
    return { success: true };
  } catch { return { success: false }; }
}

export async function markAsReadAction(id: string) {
    try {
        await dbMarkAsRead(id); revalidatePath('/');
        return { success: true };
    } catch { return { success: false }; }
}

export async function markAllAsReadAction(userId: string) {
    try {
        await dbMarkAllAsRead(userId); revalidatePath('/');
        return { success: true };
    } catch { return { success: false }; }
}

export async function submitComplaintAction(complaintData: Omit<Complaint, 'id' | 'createdAt' | 'status'>) {
  try {
    const result = await addComplaint(complaintData);
    revalidatePath("/funcionarios");
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}
