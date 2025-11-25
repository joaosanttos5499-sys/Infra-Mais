
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { summarizeReport } from "@/ai/flows/summarize-report-for-city-employee";
import { addReport, updateReportStatus as dbUpdateReportStatus, upvoteReport as dbUpvoteReport, downvoteReport as dbDownvoteReport, saveUser } from "@/lib/data";
import { type Report, type ReportStatus } from "@/lib/types";
import { categories } from "./categories";
import { getAuth } from "firebase-admin/auth";
import { getApp } from "firebase-admin/app";
import { differenceInYears, parse } from "date-fns";

const ReportSchema = z.object({
  userId: z.string(),
  category: z.string().refine(val => categories.some(c => c.value === val), {
    message: "Please select a valid category.",
  }),
  problem: z.string().min(1, "Please select a specific problem."),
  bairro: z.string().min(3, "Bairro must be at least 3 characters."),
  address: z.string().min(3, "Address must be at least 3 characters."),
  reference: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters."),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

type FormState = {
  message?: string | null;
  errors?: {
    category?: string[];
    problem?: string[];
    bairro?: string[];
    location?: string[];
    description?: string[];
    photo?: string[];
    latitude?: string[];
    longitude?: string[];
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

   const userId = formData.get('userId') as string;
   if (!userId) {
    return {
      errors: { _form: ["Você precisa estar logado para criar um relatório."] },
    };
  }

  const validatedFields = ReportSchema.safeParse({
    userId: userId,
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
          location: fieldErrors.address, // map address error to location
      },
    };
  }
  
  if(validatedFields.data.latitude === 0 && validatedFields.data.longitude === 0) {
      return {
          errors: {
              _form: ["Please select a location on the map."]
          }
      }
  }

  const photoFile = formData.get("photo") as File;
  let photoDataUri = "";

  if (photoFile && photoFile.size > 0) {
    // Limit file size to 4MB
    if (photoFile.size > 4 * 1024 * 1024) {
      return { errors: { photo: ["Photo size must be less than 4MB."] } };
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
  } catch (e) {
    console.error(e);
    return {
      errors: { _form: ["An unexpected error occurred. Please try again."] },
    };
  }

  redirect("/dashboard");
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


const SignupSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  dateOfBirth: z.string().refine((dob) => {
    try {
      const date = parse(dob, 'dd/MM/yyyy', new Date());
      return differenceInYears(new Date(), date) >= 18;
    } catch {
      return false;
    }
  }, {
    message: "Você deve ter pelo menos 18 anos e a data deve estar no formato DD/MM/AAAA.",
  }),
});


type SignupFormState = {
  success?: boolean;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    dateOfBirth?: string[];
    _form?: string[];
  };
};

export async function signupUser(
  prevState: SignupFormState | undefined,
  formData: FormData
): Promise<SignupFormState> {
  const validatedFields = SignupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password, name, dateOfBirth } = validatedFields.data;

  try {
    const auth = getAuth(getApp());
    const userCredential = await auth.createUser({ email, password, displayName: name });

    const newUser = {
      id: userCredential.uid,
      name,
      email,
      dateOfBirth,
    };
    
    await saveUser(newUser);

    revalidatePath('/');
    return { success: true };

  } catch (error: any) {
    let errorMessage = "Ocorreu um erro inesperado.";
    if (error.code === 'auth/email-already-exists') {
      errorMessage = "Este e-mail já está em uso por outra conta.";
    }
    return { errors: { _form: [errorMessage] } };
  }
}
