"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// ─── Personal Information ─────────────────────────────────────────────────────

export async function updatePersonalInfoAction(data: {
  first_name: string;
  last_name: string;
  mobile?: string;
  date_of_birth?: string;
  gender?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  pincode?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("profiles").update({
    first_name:    data.first_name.trim(),
    last_name:     data.last_name.trim(),
    mobile:        data.mobile?.trim()        || null,
    date_of_birth: data.date_of_birth?.trim() || null,
    gender:        data.gender?.trim()        || null,
    country:       data.country?.trim()       || null,
    state:         data.state?.trim()         || null,
    city:          data.city?.trim()          || null,
    address:       data.address?.trim()       || null,
    pincode:       data.pincode?.trim()       || null,
    updated_at:    new Date().toISOString(),
  } as any).eq("id", user.id);

  if (error) return { error: "Failed to save changes. Please try again." };
  revalidatePath("/dashboard/profile");
  return { success: true };
}

// ─── Professional Information ─────────────────────────────────────────────────

export async function updateProfessionalInfoAction(data: {
  college?: string;
  degree?: string;
  current_year?: string;
  company?: string;
  designation?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("profiles").update({
    college:       data.college?.trim()       || null,
    degree:        data.degree?.trim()        || null,
    current_year:  data.current_year?.trim()  || null,
    company:       data.company?.trim()       || null,
    designation:   data.designation?.trim()   || null,
    linkedin_url:  data.linkedin_url?.trim()  || null,
    github_url:    data.github_url?.trim()    || null,
    portfolio_url: data.portfolio_url?.trim() || null,
    updated_at:    new Date().toISOString(),
  } as any).eq("id", user.id);

  if (error) return { error: "Failed to save changes. Please try again." };
  revalidatePath("/dashboard/profile");
  return { success: true };
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function updatePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  if (data.newPassword.length < 8) return { error: "Password must be at least 8 characters." };
  if (data.newPassword !== data.confirmPassword) return { error: "New passwords do not match." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify current password first
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: data.currentPassword,
  });
  if (signInError) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: data.newPassword });
  if (error) return { error: "Failed to update password. Please try again." };
  return { success: true };
}

// ─── Notification Preferences ─────────────────────────────────────────────────

export async function updateNotificationsAction(data: {
  notif_email: boolean;
  notif_purchases: boolean;
  notif_certificates: boolean;
  notif_internships: boolean;
  notif_affiliate_payout: boolean;
  notif_marketing: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("profiles").update({
    notif_email:            data.notif_email,
    notif_purchases:        data.notif_purchases,
    notif_certificates:     data.notif_certificates,
    notif_internships:      data.notif_internships,
    notif_affiliate_payout: data.notif_affiliate_payout,
    notif_marketing:        data.notif_marketing,
    updated_at:             new Date().toISOString(),
  } as any).eq("id", user.id);

  if (error) return { error: "Failed to save preferences. Please try again." };
  revalidatePath("/dashboard/profile");
  return { success: true };
}

// ─── Danger Zone ──────────────────────────────────────────────────────────────

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { error: "Failed to sign out." };
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteAccountAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const adminDb = createAdminClient();
  const { error } = await adminDb.auth.admin.deleteUser(user.id);
  if (error) return { error: "Failed to delete account. Please contact support." };

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { success: true };
}
