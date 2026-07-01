"use server";

import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type SignupInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/validators/auth";
import { revalidatePath } from "next/cache";

export async function loginAction(data: LoginInput) {
  const result = loginSchema.safeParse(data);
  if (!result.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * @param siteUrl  - window.location.origin from the client
 * @param returnTo - path to redirect to after email confirmation (e.g. /verify/ABC123)
 */
export async function signupAction(data: SignupInput, siteUrl: string, returnTo?: string) {
  const result = signupSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Invalid input" };
  }

  const nameParts = result.data.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Build the confirmation redirect URL so users land back where they started
  const callbackUrl = new URL("/auth/callback", siteUrl);
  if (returnTo) callbackUrl.searchParams.set("next", returnTo);

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: { first_name: firstName, last_name: lastName },
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (error) return { error: error.message };

  return { success: true, message: "Check your email to confirm your account." };
}

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function forgotPasswordAction(data: ForgotPasswordInput, siteUrl: string) {
  const result = forgotPasswordSchema.safeParse(data);
  if (!result.success) return { error: "Invalid email" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };

  return { success: true, message: "Password reset link sent to your email." };
}

export async function resetPasswordAction(data: ResetPasswordInput) {
  const result = resetPasswordSchema.safeParse(data);
  if (!result.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) return { error: error.message };

  return { success: true, message: "Password updated successfully." };
}
