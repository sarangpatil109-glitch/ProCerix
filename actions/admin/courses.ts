"use server";

import { verifyAdmin } from "./utils";
import { adminCourseSchema } from "@/validators/admin";
import { revalidatePath, revalidateTag } from "next/cache";

export async function createAdminCourse(data: unknown) {
  try {
    const { supabase } = await verifyAdmin();
    const parsed = adminCourseSchema.parse(data);

    // Create the tags array if passed as comma-separated string
    let tagsArray: string[] = [];
    if (parsed.tags) {
      tagsArray = parsed.tags.split(",").map(t => t.trim()).filter(Boolean);
    }

    const payload = {
      ...parsed,
      tags: tagsArray,
    };

    const { error } = await supabase.from("courses").insert(payload);
    if (error) throw error;

    revalidateTag("courses", "default");
    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateAdminCourse(id: string, data: unknown) {
  try {
    const { supabase } = await verifyAdmin();
    const parsed = adminCourseSchema.parse(data);

    let tagsArray: string[] = [];
    if (parsed.tags) {
      tagsArray = parsed.tags.split(",").map(t => t.trim()).filter(Boolean);
    }

    const payload = {
      ...parsed,
      tags: tagsArray,
    };

    const { error } = await supabase.from("courses").update(payload).eq("id", id);
    if (error) throw error;

    revalidateTag("courses", "default");
    revalidatePath("/admin/courses");
    revalidatePath(`/courses/${parsed.slug}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteAdminCourse(id: string) {
  try {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) throw error;

    revalidateTag("courses", "default");
    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
