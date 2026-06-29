"use server";

import { verifyAdmin } from "./utils";
import { revalidatePath } from "next/cache";

export async function suspendUser(userId: string) {
  try {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: true })
      .eq("id", userId);

    if (error) throw error;
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function activateUser(userId: string) {
  try {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: false })
      .eq("id", userId);

    if (error) throw error;
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
