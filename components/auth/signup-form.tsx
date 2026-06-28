"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/validators/auth";
import { signupAction } from "@/actions/auth";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setError(null);
    setSuccess(null);
    const result = await signupAction(data);
    
    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(result.message || "Signed up successfully.");
    }
  };

  if (success) {
    return <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm">{success}</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
          <input
            {...register("firstName")}
            id="firstName"
            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
          <input
            {...register("lastName")}
            id="lastName"
            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>

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

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input
          {...register("password")}
          id="password"
          type="password"
          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>
      
      {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-4 py-2 disabled:opacity-50"
      >
        {isSubmitting ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
}
