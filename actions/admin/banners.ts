"use server";

import { verifyAdmin } from "./utils";
import { bannerSchema } from "@/validators/admin";
import { revalidatePath } from "next/cache";

export async function createBanner(data: unknown) {
  try {
    const { supabase } = await verifyAdmin();
    const parsed = bannerSchema.parse(data);

    const { error } = await supabase.from("banners").insert(parsed);
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateBanner(id: string, data: unknown) {
  try {
    const { supabase } = await verifyAdmin();
    const parsed = bannerSchema.parse(data);

    const { error } = await supabase.from("banners").update(parsed).eq("id", id);
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteBanner(id: string) {
  try {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
