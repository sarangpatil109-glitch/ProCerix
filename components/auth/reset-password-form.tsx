"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/validators/auth";
import { resetPasswordAction } from "@/actions/auth";
import { useRouter } from "next/navigation";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    setSuccess(null);
    const result = await resetPasswordAction(data);
    
    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess("Password updated successfully.");
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  if (success) {
    return <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm">{success}</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">New Password</label>
        <input
          {...register("password")}
          id="password"
          type="password"
          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
        <input
          {...register("confirmPassword")}
          id="confirmPassword"
          type="password"
          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
      </div>
      
      {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-4 py-2 disabled:opacity-50"
      >
        {isSubmitting ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}
