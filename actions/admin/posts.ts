"use server";

import { verifyAdmin } from "./utils";
import { postSchema } from "@/validators/admin";
import { revalidatePath } from "next/cache";

export async function createPost(data: unknown) {
  try {
    const { supabase, user } = await verifyAdmin();
    const parsed = postSchema.parse(data);

    const payload = {
      ...parsed,
      author_id: user.id,
    };

    const { error } = await supabase.from("posts").insert(payload);
    if (error) throw error;

    revalidatePath("/blog");
    revalidatePath("/admin/blog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updatePost(id: string, data: unknown) {
  try {
    const { supabase, user } = await verifyAdmin();
    const parsed = postSchema.parse(data);

    const payload = {
      ...parsed,
      author_id: user.id,
    };

    const { error } = await supabase.from("posts").update(payload).eq("id", id);
    if (error) throw error;

    revalidatePath("/blog");
    revalidatePath(`/blog/${parsed.slug}`);
    revalidatePath("/admin/blog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deletePost(id: string) {
  try {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/blog");
    revalidatePath("/admin/blog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
