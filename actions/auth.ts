"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

// ─── Friendly error mapping ───────────────────────────────────────────────────

function mapLoginError(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes("invalid login") || msg.includes("invalid credentials") || msg.includes("wrong password")) {
    return "Invalid email or password.";
  }
  if (msg.includes("email not confirmed")) {
    return "Your email is not yet confirmed. Please contact support.";
  }
  if (msg.includes("too many") || msg.includes("rate limit")) {
    return "Too many attempts. Please try again in a few minutes.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }
  return "Could not sign in. Please try again.";
}

function mapSignupError(raw: string): string {
  const msg = raw.toLowerCase();
  if (
    msg.includes("already registered") ||
    msg.includes("already exists") ||
    msg.includes("duplicate") ||
    msg.includes("unique") ||
    msg.includes("user already")
  ) {
    return "An account with this email already exists. Please log in instead.";
  }
  if (msg.includes("invalid email") || msg.includes("unable to validate email")) {
    return "Please enter a valid email address.";
  }
  if (msg.includes("password") && msg.includes("characters")) {
    return "Password must be at least 8 characters.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }
  return "Could not create account. Please try again.";
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function loginAction(data: LoginInput) {
  const result = loginSchema.safeParse(data);
  if (!result.success) return { error: result.error.issues[0]?.message || "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) return { error: mapLoginError(error.message) };

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Creates the user via the admin API with email_confirm: true so no
 * verification email is ever sent and the account is active immediately.
 */
export async function signupAction(data: SignupInput) {
  const result = signupSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Invalid input" };
  }

  const nameParts  = result.data.name.trim().split(/\s+/);
  const firstName  = nameParts[0] ?? "";
  const lastName   = nameParts.slice(1).join(" ") || "";

  const adminDb = createAdminClient();

  const { data: created, error } = await adminDb.auth.admin.createUser({
    email:         result.data.email,
    password:      result.data.password,
    email_confirm: true, // ← bypasses Supabase email verification
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  if (error) return { error: mapSignupError(error.message) };

  // Seed a profiles row so the rest of the app has it immediately
  if (created?.user?.id) {
    await (adminDb as any)
      .from("profiles")
      .upsert(
        { id: created.user.id, first_name: firstName, last_name: lastName },
        { onConflict: "id", ignoreDuplicates: true }
      )
      .catch(() => { /* non-fatal */ });
  }

  return { success: true };
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
