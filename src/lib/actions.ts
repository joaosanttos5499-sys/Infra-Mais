
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
      errors: {
          ...fieldErrors,
          location: fieldErrors.address,
      },
    };
  }
  
  if(validatedFields.data.latitude === 0 && validatedFields.data.longitude === 0) {
      return {
          errors: {
              _form: ["Por favor, selecione uma localização no mapa."]
          }
      }
  }

  const photoFile = formData.get("photo") as File;
  let photoDataUri = "";

  if (!photoFile || photoFile.size === 0) {
    return { errors: { photo: ["A foto do problema é obrigatória."] } };
  }

  // Limite de 5MB
  if (photoFile.size > 5 * 1024 * 1024) {
    return { errors: { photo: ["O tamanho da foto não pode exceder 5MB."] } };
  }
  photoDataUri = await fileToDataUri(photoFile);


  try {
    const { userId, category, problem, city, bairro, address, reference, description, latitude, longitude } = validatedFields.data;
    
    const location = reference ? `${address} (${reference})` : address;

    // Sumarização por IA
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
    
    // Revalida as rotas para garantir que os novos dados apareçam nos componentes de servidor
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/minha-conta");
    revalidatePath("/funcionarios");
    
    return { success: true };
  } catch (e) {
    console.error("Erro ao processar relatório:", e);
    return {
      errors: { _form: ["Ocorreu um erro ao processar seu relatório pela IA. Tente novamente."] },
    };
  }
}

type UpdateActionState = {
  success: boolean;
  message?: string;
};

export async function updateReportStatus(
  prevState: UpdateActionState,
  payload: { reportId: string, formData: FormData }
): Promise<UpdateActionState> {
  const { reportId, formData } = payload;
  const status = formData.get("status") as ReportStatus;
  const photoAfterFile = formData.get("photoAfter") as File | null;
  
  let photoAfterUrl: string | undefined = undefined;

  try {
    if (photoAfterFile && photoAfterFile.size > 0) {
      if (photoAfterFile.size > 5 * 1024 * 1024) {
         return { success: false, message: "A foto da solução deve ter menos de 5MB." };
      }
      photoAfterUrl = await fileToDataUri(photoAfterFile);
    }

    // Validação de foto obrigatória para status RESOLVED
    if (status === 'RESOLVED' && !photoAfterUrl) {
        return { success: false, message: "A foto da solução é obrigatória para finalizar este relato e comprovar o trabalho realizado." };
    }

    const updatedReport = await dbUpdateReportStatus(reportId, status, photoAfterUrl);
    
    if (updatedReport) {
        const statusLabel = statusConfig[status].label;
        await addNotification(
            updatedReport.userId,
            reportId,
            `O status do seu relato de ${updatedReport.category} foi alterado para: ${statusLabel}.`
        );
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/funcionarios");
    revalidatePath("/minha-conta");
    return { success: true, message: "Status do relatório atualizado com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Falha ao atualizar status." };
  }
}

export async function upvoteReportAction(reportId: string) {
    try {
        await dbUpvoteReport(reportId);
        revalidatePath("/");
        revalidatePath("/dashboard");
        revalidatePath("/funcionarios");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to upvote." };
    }
}

export async function downvoteReportAction(reportId: string) {
    try {
        await dbDownvoteReport(reportId);
        revalidatePath("/");
        revalidatePath("/dashboard");
        revalidatePath("/funcionarios");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to downvote." };
    }
}

export async function deleteReportAction(reportId: string) {
  try {
    const allReports = await getReports();
    const report = allReports.find(r => r.id === reportId);
    
    if (!report) {
      return { success: false, message: "Relatório não encontrado." };
    }

    if (report.status !== 'UNDER_REVIEW') {
      return { success: false, message: "Este relatório já foi validado e não pode mais ser excluído." };
    }

    const success = await dbDeleteReport(reportId);
    if (!success) {
      return { success: false, message: "Falha ao remover o registro." };
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/minha-conta");
    revalidatePath("/funcionarios");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete report:", error);
    return { success: false, message: "Erro ao excluir relatório." };
  }
}

export async function saveUserProfileAction(userProfile: Omit<UserProfile, 'photoURL' | 'role'> & { photoURL?: string }): Promise<{ success: boolean; error?: string; photoURL?: string; }> {
  try {
    const role = isEmailEmployee(userProfile.email) ? "EMPLOYEE" : "USER";
    
    // Forçamos a geração do avatar a partir do e-mail para garantir a letra correta (E para evidenciadetudo@gmail.com)
    const avatarSvg = createAvatarSvg(userProfile.email);
    
    const finalUserProfile: UserProfile = {
      ...userProfile,
      photoURL: avatarSvg, // Sempre sobrescreve com o SVG baseado no e-mail para garantir a lógica permanente
      role,
    };
    
    await saveUser(finalUserProfile);
    revalidatePath('/');
    revalidatePath('/minha-conta');
    return { success: true, photoURL: finalUserProfile.photoURL };
  } catch (error) {
    console.error("Failed to save user profile:", error);
    return { success: false, error: "Não foi possível salvar os dados do perfil." };
  }
}

export async function updateUserProfileAction(userId: string, data: { name: string }): Promise<{ success: boolean, error?: string }> {
  if (!userId) {
    return { success: false, error: "Usuário não autenticado." };
  }
  
  const validatedFields = UpdateProfileSchema.safeParse(data);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      success: false,
      error: fieldErrors.name?.[0] || "Dados inválidos."
    };
  }

  try {
    const existingProfile = await getUserById(userId);
    if (!existingProfile) {
      return { success: false, error: "Perfil do usuário não encontrado." };
    }

    const { name } = validatedFields.data;

    if (name !== existingProfile.name) {
      if (existingProfile.nameLastUpdatedAt) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const lastUpdateDate = new Date(existingProfile.nameLastUpdatedAt);

        if (lastUpdateDate > sevenDaysAgo) {
          return { success: false, error: "Você só pode alterar seu nome uma vez por semana." };
        }
      }
    }
    
    const updatedProfile: UserProfile = {
      ...existingProfile,
      name,
      // Mantém o avatar original (que já é garantido ser baseado no e-mail)
      nameLastUpdatedAt: name !== existingProfile.name ? new Date().toISOString() : existingProfile.nameLastUpdatedAt,
    };

    await saveUser(updatedProfile);
    revalidatePath('/minha-conta');
    return { success: true };

  } catch (error) {
    console.error("Failed to update user profile:", error);
    return { success: false, error: "Não foi possível atualizar os dados do perfil." };
  }
}

export async function fetchUserProfileAction(userId: string): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  if (!userId) {
    return { success: false, error: "O ID do usuário é obrigatório." };
  }
  try {
    const userProfile = await getUserById(userId);
    if (!userProfile) {
      return { success: false, error: "Perfil de usuário não encontrado." };
    }
    return { success: true, data: userProfile };
  } catch (error) {
    console.error("Falha ao buscar o perfil do usuário:", error);
    return { success: false, error: "Falha ao buscar o perfil do usuário." };
  }
}

export async function deleteAccountAction(userId: string) {
  try {
    const success = await dbDeleteUser(userId);
    if (!success) return { success: false, error: "Usuário não encontrado." };
    
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/minha-conta");
    revalidatePath("/funcionarios");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete account data:", error);
    return { success: false, error: "Erro ao excluir dados do servidor." };
  }
}

export async function getNotificationsAction(userId: string) {
    try {
        const data = await getNotifications(userId);
        return { success: true, data };
    } catch (error) {
        console.error("Failed to get notifications:", error);
        return { success: false, error: "Failed to load notifications." };
    }
}

export async function markAsReadAction(id: string) {
    try {
        await dbMarkAsRead(id);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function markAllAsReadAction(userId: string) {
    try {
        await dbMarkAllAsRead(userId);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function getAllReportsAction(): Promise<Report[]> {
  return await getReports();
}
