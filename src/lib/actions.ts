
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { summarizeReport } from "@/ai/flows/summarize-report-for-city-employee";
import { 
    addReport, 
    updateReportStatus as dbUpdateReportStatus, 
    upvoteReport as dbUpvoteReport, 
    downvoteReport as dbDownvoteReport, 
    saveUser, 
    getUserById, 
    deleteReport as dbDeleteReport, 
    deleteUser as dbDeleteUser, 
    getReports,
    addNotification,
    getNotifications,
    markNotificationAsRead as dbMarkAsRead,
    markAllNotificationsAsRead as dbMarkAllAsRead
} from "@/lib/data";
import { type Report, type ReportStatus, type NewReport, type UserProfile } from "@/lib/types";
import { ReportSchema, UpdateProfileSchema } from "./schemas";
import { createAvatarSvg } from "./avatar";
import { isEmailEmployee } from "./config";
import { statusConfig } from "@/components/status-badge";

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

export async function submitReport(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const validatedFields = ReportSchema.safeParse({
    userId: formData.get("userId"),
    category: formData.get("category"),
    problem: formData.get("problem"),
    city: formData.get("city"),
    bairro: formData.get("bairro"),
    address: formData.get("address"),
    reference: formData.get("reference"),
    description: formData.get("description"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      errors: { ...fieldErrors, location: fieldErrors.address },
    };
  }
  
  if(validatedFields.data.latitude === 0 && validatedFields.data.longitude === 0) {
      return { errors: { _form: ["Por favor, selecione uma localização no mapa."] } };
  }

  try {
    const user = await getUserById(validatedFields.data.userId);
    if (!user) return { errors: { _form: ["Usuário não encontrado."] } };

    const photoFile = formData.get("photo") as File;
    if (!photoFile || photoFile.size === 0) {
      return { errors: { photo: ["A foto do problema é obrigatória."] } };
    }
    if (photoFile.size > 5 * 1024 * 1024) {
      return { errors: { photo: ["O tamanho da foto não pode exceder 5MB."] } };
    }
    const photoDataUri = await fileToDataUri(photoFile);

    const { userId, category, problem, city, bairro, address, reference, description, latitude, longitude } = validatedFields.data;
    const location = reference ? `${address} (${reference})` : address;

    const aiSummary = await summarizeReport({
      category,
      problem,
      city,
      bairro,
      location,
      description: description || "Nenhuma descrição fornecida.",
      photoDataUri,
    });

    const newReport: NewReport = {
      userId,
      relatorEmail: user.email,
      category,
      problem,
      city,
      bairro,
      location,
      description: description || "",
      summary: aiSummary.summary,
      photoUrl: photoDataUri,
      latitude,
      longitude,
    };

    addReport(newReport);
    
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/minha-conta");
    revalidatePath("/funcionarios");
    
    return { success: true };
  } catch (e) {
    console.error("Erro ao processar relatório:", e);
    return {
      errors: { _form: ["Erro ao processar relatório. Tente novamente."] },
    };
  }
}

type UpdateActionState = { success: boolean; message?: string; };

export async function updateReportStatus(
  prevState: UpdateActionState,
  payload: { reportId: string, formData: FormData }
): Promise<UpdateActionState> {
  const { reportId, formData } = payload;
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
      if (photoAfterFile.size > 5 * 1024 * 1024) return { success: false, message: "A foto deve ter menos de 5MB." };
      photoAfterUrl = await fileToDataUri(photoAfterFile);
    }

    if (status === 'RESOLVED' && !photoAfterUrl) {
        return { success: false, message: "A foto da solução é obrigatória." };
    }

    const updatedReport = await dbUpdateReportStatus(reportId, status, photoAfterUrl, {
        category, problem, bairro, location, description, latitude, longitude
    });
    
    if (updatedReport) {
        const statusLabel = statusConfig[status].label;
        await addNotification(
            updatedReport.userId,
            reportId,
            `Seu relato sobre ${updatedReport.category} foi atualizado para: ${statusLabel}.`
        );
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

export async function deleteReportAction(reportId: string) {
  try {
    const success = await dbDeleteReport(reportId);
    if (!success) return { success: false, message: "Falha ao remover." };
    revalidatePath("/"); revalidatePath("/dashboard"); revalidatePath("/minha-conta");
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
  } catch (error) { return { success: false, error: "Erro ao salvar perfil." }; }
}

export async function updateUserProfileAction(userId: string, data: { name: string }): Promise<{ success: boolean, error?: string }> {
  const validatedFields = UpdateProfileSchema.safeParse(data);
  if (!validatedFields.success) return { success: false, error: "Nome inválido." };

  try {
    const existingProfile = await getUserById(userId);
    if (!existingProfile) return { success: false, error: "Perfil não encontrado." };

    const { name } = validatedFields.data;
    if (name !== existingProfile.name && existingProfile.nameLastUpdatedAt) {
        const lastUpdateDate = new Date(existingProfile.nameLastUpdatedAt);
        const diff = Date.now() - lastUpdateDate.getTime();
        if (diff < 7 * 24 * 60 * 60 * 1000) return { success: false, error: "Nome alterável apenas uma vez por semana." };
    }
    
    await saveUser({ ...existingProfile, name, nameLastUpdatedAt: name !== existingProfile.name ? new Date().toISOString() : existingProfile.nameLastUpdatedAt });
    revalidatePath('/minha-conta');
    return { success: true };
  } catch (error) { return { success: false, error: "Erro ao atualizar." }; }
}

export async function fetchUserProfileAction(userId: string) {
  try {
    const userProfile = await getUserById(userId);
    if (!userProfile) return { success: false };
    return { success: true, data: userProfile };
  } catch { return { success: false }; }
}

export async function deleteAccountAction(userId: string) {
  try {
    await dbDeleteUser(userId);
    revalidatePath("/"); revalidatePath("/dashboard"); revalidatePath("/minha-conta");
    return { success: true };
  } catch { return { success: false }; }
}

export async function getNotificationsAction(userId: string) {
    try {
        const data = await getNotifications(userId);
        return { success: true, data };
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

export async function getAllReportsAction(): Promise<Report[]> {
  return await getReports();
}
