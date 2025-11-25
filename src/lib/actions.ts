
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { summarizeReport } from "@/ai/flows/summarize-report-for-city-employee";
import { addReport, updateReportStatus as dbUpdateReportStatus, upvoteReport as dbUpvoteReport, downvoteReport as dbDownvoteReport } from "@/lib/data";
import { type Report, type ReportStatus } from "@/lib/types";
import { categories } from "./categories";

const ReportSchema = z.object({
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
  const validatedFields = ReportSchema.safeParse({
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
    const { category, problem, bairro, address, reference, description, latitude, longitude } = validatedFields.data;
    
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

export async function downvoteReportAction(reportId: string) {
    try {
        await dbDownvoteReport(reportId);
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to downvote." };
    }
}
