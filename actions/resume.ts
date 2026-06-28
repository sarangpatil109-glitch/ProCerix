"use server";
import { ResumeService } from "@/services/resume-service";
import { revalidatePath } from "next/cache";

export async function createResumeAction(userId: string, title?: string) {
  try {
    const resume = await ResumeService.createResume(userId, title);
    revalidatePath("/dashboard/product/resume");
    return { success: true, resume };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateResumeAction(id: string, userId: string, updates: any) {
  try {
    const resume = await ResumeService.updateResume(id, userId, updates);
    revalidatePath(`/dashboard/product/resume/${id}`);
    return { success: true, resume };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteResumeAction(id: string, userId: string) {
  try {
    await ResumeService.deleteResume(id, userId);
    revalidatePath("/dashboard/product/resume");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function aiRewriteResumeAction(text: string, type: "summary" | "bullet") {
  try {
    const { GenerationService } = await import("@/services/generation-service");
    // Pseudo AI call using the provider abstraction:
    // In a real scenario, this would use a specific prompt from PromptManager
    // For this implementation, we return a mock enhanced version.
    return { success: true, text: `[AI Enhanced] ${text}` };
  } catch (error: any) {
    return { error: error.message };
  }
}
