
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { summarizeReport } from "@/ai/flows/summarize-report-for-city-employee";
import { addReport, updateReportStatus as dbUpdateReportStatus, upvoteReport as dbUpvoteReport, downvoteReport as dbDownvoteReport, saveUser, getUserById } from "@/lib/data";
import { type Report, type ReportStatus, type NewReport, type UserProfile } from "@/lib/types";
import { ReportSchema, UpdateProfileSchema } from "./schemas";


export type FormState = {
  message?: string | null;
  success?: boolean;
  errors?: {
    category?: string[];
    problem?: string[];
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

  if (photoFile && photoFile.size > 0) {
    // Limit file size to 4MB
    if (photoFile.size > 4 * 1024 * 1024) {
      return { errors: { photo: ["O tamanho da foto deve ser menor que 4MB."] } };
    }
    photoDataUri = await fileToDataUri(photoFile);
  } else {
    // Use a placeholder if no photo is uploaded
    photoDataUri = "https://picsum.photos/seed/placeholder/400/300";
  }

  try {
    const { userId, category, problem, bairro, address, reference, description, latitude, longitude } = validatedFields.data;
    
    const location = reference ? `${address} (${reference})` : address;

    const aiSummary = await summarizeReport({
      category,
      problem,
      bairro,
      location,
      description,
      photoDataUri,
    });

    const newReport: Omit<Report, "id" | "createdAt" | "status" | "upvotes" | "photoAfterUrl"> = {
      userId,
      category,
      problem,
      bairro,
      location,
      description,
      summary: aiSummary.summary,
      photoUrl: photoDataUri,
      latitude,
      longitude,
    };

    addReport(newReport);

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error(e);
    return {
      errors: { _form: ["Ocorreu um erro inesperado. Por favor, tente novamente."] },
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
      if (photoAfterFile.size > 4 * 1024 * 1024) {
         return { success: false, message: "A foto da solução deve ter menos de 4MB." };
      }
      photoAfterUrl = await fileToDataUri(photoAfterFile);
    }

    await dbUpdateReportStatus(reportId, status, photoAfterUrl);
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/funcionarios");
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

const defaultAvatarColors = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#ec4899', // pink
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#ef4444', // red
  '#78716c', // stone
  '#f97316', // orange
];

const stringToHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const createAvatarSvg = (name: string): string => {
  const hash = stringToHash(name);
  const color = defaultAvatarColors[hash % defaultAvatarColors.length];
  const firstLetter = name.charAt(0).toUpperCase();
  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="${color}" /><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-size="50" fill="white">${firstLetter}</text></svg>`;
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
};

export async function saveUserProfileAction(userProfile: Omit<UserProfile, 'photoURL'> & { photoURL?: string }): Promise<{ success: boolean; error?: string; photoURL?: string; }> {
  try {
    let finalUserProfile: UserProfile;

    if (!userProfile.photoURL) {
      const avatarSvg = createAvatarSvg(userProfile.name);
      finalUserProfile = {
        ...userProfile,
        photoURL: avatarSvg,
      };
    } else {
        finalUserProfile = userProfile as UserProfile;
    }
    
    await saveUser(finalUserProfile);
    revalidatePath('/');
    return { success: true, photoURL: finalUserProfile.photoURL };
  } catch (error) {
    console.error("Failed to save user profile:", error);
    return { success: false, error: "Não foi possível salvar os dados do perfil." };
  }
}

export async function updateUserProfileAction(userId: string, formData: FormData): Promise<{ success: boolean, error?: string, photoURL?: string }> {
  if (!userId) {
    return { success: false, error: "Usuário não autenticado." };
  }
  
  const validatedFields = UpdateProfileSchema.safeParse({
    name: formData.get("name"),
    photo: formData.get("photo"),
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      success: false,
      error: fieldErrors.name?.[0] || fieldErrors.photo?.[0] || "Dados inválidos."
    };
  }

  try {
    const existingProfile = await getUserById(userId);
    if (!existingProfile) {
      return { success: false, error: "Perfil do usuário não encontrado." };
    }

    const { name } = validatedFields.data;
    const photoFile = formData.get("photo") as File;
    let photoDataUri = existingProfile.photoURL;

    if (photoFile && photoFile.size > 0) {
      if (photoFile.size > 2 * 1024 * 1024) { // 2MB
        return { success: false, error: "A foto deve ter no máximo 2MB." };
      }
      photoDataUri = await fileToDataUri(photoFile);
    }

    const updatedProfile: UserProfile = {
      ...existingProfile,
      name,
      photoURL: photoDataUri,
    };

    await saveUser(updatedProfile);
    
    revalidatePath('/minha-conta');
    
    return { success: true, photoURL: photoDataUri };

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
