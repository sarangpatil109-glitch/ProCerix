"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/validators/auth";
import { forgotPasswordAction } from "@/actions/auth";

export function ForgotPasswordForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    setSuccess(null);
    const result = await forgotPasswordAction(data, window.location.origin);
    
    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(result.message || "Reset link sent");
    }
  };

  if (success) {
    return <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm">{success}</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input
          {...register("email")}
          id="email"
          type="email"
          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>
      
      {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-4 py-2 disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}
