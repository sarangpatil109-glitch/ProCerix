"use server";

import { verifyAdmin } from "./utils";
import { couponSchema } from "@/validators/admin";
import { revalidatePath } from "next/cache";

export async function createCoupon(data: unknown) {
  try {
    const { supabase } = await verifyAdmin();
    const parsed = couponSchema.parse(data);

    const { error } = await supabase.from("coupons").insert(parsed);
    if (error) throw error;

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateCoupon(id: string, data: unknown) {
  try {
    const { supabase } = await verifyAdmin();
    const parsed = couponSchema.parse(data);

    const { error } = await supabase.from("coupons").update(parsed).eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteCoupon(id: string) {
  try {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
