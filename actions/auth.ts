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
  type ResetPasswordInput
} from "@/validators/auth";
import { revalidatePath } from "next/cache";

export async function loginAction(data: LoginInput) {
  const result = loginSchema.safeParse(data);
  
  if (!result.success) {
    return { error: "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signupAction(data: SignupInput) {
  const result = signupSchema.safeParse(data);
  
  if (!result.success) {
    return { error: "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        first_name: result.data.firstName,
        last_name: result.data.lastName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Check your email for confirmation." };
}

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function forgotPasswordAction(data: ForgotPasswordInput, siteUrl: string) {
  const result = forgotPasswordSchema.safeParse(data);
  
  if (!result.success) {
    return { error: "Invalid email" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Password reset link sent to your email." };
}

export async function resetPasswordAction(data: ResetPasswordInput) {
  const result = resetPasswordSchema.safeParse(data);
  
  if (!result.success) {
    return { error: "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Password updated successfully." };
}
