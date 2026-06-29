"use server";

import { verifyAdmin } from "./utils";
import { siteSettingsSchema, homepageSectionsSchema, certificateSettingsSchema } from "@/validators/admin";
import { revalidatePath } from "next/cache";

export async function updateSiteSettings(data: unknown) {
  try {
    const { supabase } = await verifyAdmin();
    const parsed = siteSettingsSchema.parse(data);

    // Fetch existing settings
    const { data: existing } = await supabase.from("site_settings").select("id").single();

    if (existing) {
      await supabase.from("site_settings").update(parsed).eq("id", existing.id);
    } else {
      await supabase.from("site_settings").insert(parsed);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateHomepageSections(data: unknown) {
  try {
    const { supabase } = await verifyAdmin();
    const parsed = homepageSectionsSchema.parse(data);

    const { data: existing } = await supabase.from("homepage_sections").select("id").single();

    if (existing) {
      await supabase.from("homepage_sections").update(parsed).eq("id", existing.id);
    } else {
      await supabase.from("homepage_sections").insert(parsed);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateCertificateSettings(data: unknown) {
  try {
    const { supabase } = await verifyAdmin();
    const parsed = certificateSettingsSchema.parse(data);

    const { data: existing } = await supabase.from("certificate_settings").select("id").single();

    if (existing) {
      await supabase.from("certificate_settings").update(parsed).eq("id", existing.id);
    } else {
      await supabase.from("certificate_settings").insert(parsed);
    }

    revalidatePath("/admin/certificates");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
