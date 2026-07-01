"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Account (name, phone, location, timezone, language) ─────────────────────

export async function updateAccountAction(data: {
  first_name: string;
  last_name: string;
  mobile?: string;
  country?: string;
  state?: string;
  city?: string;
  timezone?: string;
  language?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!data.first_name?.trim()) return { error: "First name is required." };

  const { error } = await supabase.from("profiles").update({
    first_name:  data.first_name.trim(),
    last_name:   data.last_name?.trim() || null,
    mobile:      data.mobile?.trim()    || null,
    country:     data.country?.trim()   || null,
    state:       data.state?.trim()     || null,
    city:        data.city?.trim()      || null,
    timezone:    data.timezone?.trim()  || null,
    language:    data.language?.trim()  || "en",
    updated_at:  new Date().toISOString(),
  } as any).eq("id", user.id);

  if (error) return { error: "Failed to save. Please try again." };
  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Appearance (theme + accent color) ───────────────────────────────────────

export async function updateAppearanceAction(data: {
  theme: string;
  accent_color: string;
}) {
  const validThemes  = ["light", "dark", "system"];
  const validAccents = ["blue", "purple", "green", "orange"];
  if (!validThemes.includes(data.theme))   return { error: "Invalid theme."        };
  if (!validAccents.includes(data.accent_color)) return { error: "Invalid accent color." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("profiles").update({
    theme:        data.theme,
    accent_color: data.accent_color,
    updated_at:   new Date().toISOString(),
  } as any).eq("id", user.id);

  if (error) return { error: "Failed to save appearance." };
  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Privacy ─────────────────────────────────────────────────────────────────

export async function updatePrivacyAction(data: {
  public_profile: boolean;
  show_linkedin: boolean;
  show_portfolio: boolean;
  receive_product_updates: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("profiles").update({
    public_profile:          data.public_profile,
    show_linkedin:           data.show_linkedin,
    show_portfolio:          data.show_portfolio,
    receive_product_updates: data.receive_product_updates,
    updated_at:              new Date().toISOString(),
  } as any).eq("id", user.id);

  if (error) return { error: "Failed to save privacy settings." };
  revalidatePath("/dashboard/settings");
  return { success: true };
}
