"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { summarizeReport } from "@/ai/flows/summarize-report-for-city-employee";
import { addReport, updateReportStatus as dbUpdateReportStatus, upvoteReport as dbUpvoteReport } from "@/lib/data";
import { type Report, type ReportStatus } from "@/lib/types";
import { categories } from "./categories";

const ReportSchema = z.object({
  category: z.string().refine(val => categories.some(c => c.value === val), {
    message: "Please select a valid category.",
  }),
  bairro: z.string().min(3, "Bairro must be at least 3 characters."),
  location: z.string().min(3, "Location must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
});

type FormState = {
  message?: string | null;
  errors?: {
    category?: string[];
    bairro?: string[];
    location?: string[];
    description?: string[];
    photo?: string[];
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
    category: formData.get("category"),
    bairro: formData.get("bairro"),
    location: formData.get("location"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const photoFile = formData.get("photo") as File;
  if (!photoFile || photoFile.size === 0) {
    return { errors: { photo: ["A photo of the issue is required."] } };
  }

  // Limit file size to 4MB
  if (photoFile.size > 4 * 1024 * 1024) {
    return { errors: { photo: ["Photo size must be less than 4MB."] } };
  }

  try {
    const photoDataUri = await fileToDataUri(photoFile);

    const { category, bairro, location, description } = validatedFields.data;

    const aiSummary = await summarizeReport({
      category,
      bairro,
      location,
      description,
      photoDataUri,
    });

    const newReport: Omit<Report, "id" | "createdAt" | "status" | "upvotes" | "photoAfterUrl"> = {
      category,
      bairro,
      location,
      description,
      summary: aiSummary.summary,
      photoUrl: photoDataUri,
    };

    addReport(newReport);

    revalidatePath("/dashboard");
  } catch (e) {
    console.error(e);
    return {
      errors: { _form: ["An unexpected error occurred. Please try again."] },
    };
  }

  redirect("/dashboard");
}

export async function updateReportStatus(
  reportId: string,
  formData: FormData,
) {
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
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Falha ao atualizar status." };
  }
}

export async function upvoteReportAction(reportId: string) {
    try {
        await dbUpvoteReport(reportId);
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to upvote." };
    }
}