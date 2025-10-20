"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { summarizeReport } from "@/ai/flows/summarize-report-for-city-employee";
import { addReport, updateReportStatus as dbUpdateReportStatus } from "@/lib/data";
import { type Report, type ReportStatus } from "@/lib/types";
import { categories } from "./categories";

const ReportSchema = z.object({
  category: z.string().refine(val => categories.some(c => c.value === val), {
    message: "Please select a valid category.",
  }),
  location: z.string().min(3, "Location must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
});

type FormState = {
  message?: string | null;
  errors?: {
    category?: string[];
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

    const { category, location, description } = validatedFields.data;

    const aiSummary = await summarizeReport({
      category,
      location,
      description,
      photoDataUri,
    });

    const newReport: Omit<Report, "id" | "createdAt" | "status"> = {
      category,
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
  status: ReportStatus
) {
  try {
    await dbUpdateReportStatus(reportId, status);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to update status." };
  }
}
