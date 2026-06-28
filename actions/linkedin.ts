"use server";
import { LinkedInService } from "@/services/linkedin-service";
import { revalidatePath } from "next/cache";

export async function createLinkedInAction(userId: string, title?: string) {
  try {
    const profile = await LinkedInService.createProfile(userId, title);
    revalidatePath("/dashboard/product/linkedin");
    return { success: true, profile };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateLinkedInAction(id: string, userId: string, updates: any) {
  try {
    const profile = await LinkedInService.updateProfile(id, userId, updates);
    revalidatePath(`/dashboard/product/linkedin/${id}`);
    return { success: true, profile };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteLinkedInAction(id: string, userId: string) {
  try {
    await LinkedInService.deleteProfile(id, userId);
    revalidatePath("/dashboard/product/linkedin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function aiRewriteLinkedInAction(text: string, type: "headline" | "about" | "experience" | "project") {
  try {
    // Pseudo AI call using the provider abstraction:
    return { success: true, text: `[AI Optimized] ${text}` };
  } catch (error: any) {
    return { error: error.message };
  }
}
