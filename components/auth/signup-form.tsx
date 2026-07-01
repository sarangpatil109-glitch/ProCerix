"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/validators/auth";
import { signupAction } from "@/actions/auth";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, Mail } from "lucide-react";
import { completeRegistration } from "@/lib/meta-pixel";
import { analyticsSignUp } from "@/lib/analytics";
import { trackEvent } from "@/lib/clarity";

function getStrength(password: string): { score: number; label: string; colorClass: string; barClass: string } {
  if (!password) return { score: 0, label: "", colorClass: "", barClass: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", colorClass: "text-red-500", barClass: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", colorClass: "text-yellow-500", barClass: "bg-yellow-500" };
  if (score <= 3) return { score, label: "Good", colorClass: "text-blue-500", barClass: "bg-blue-500" };
  return { score, label: "Strong", colorClass: "text-green-500", barClass: "bg-green-500" };
}

export function SignupForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || searchParams.get("next") || "/dashboard";

  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const watchedPassword = watch("password", "");
  const strength = getStrength(watchedPassword);

  const onSubmit = async (data: SignupInput) => {
    setError(null);
    const siteUrl = window.location.origin;
    const destination = returnTo !== "/dashboard" ? returnTo : undefined;
    const result = await signupAction(data, siteUrl, destination);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      completeRegistration({ em: data.email });
      analyticsSignUp();
      trackEvent("signup");
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Check your inbox</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
            We've sent a confirmation link to your email. Click it to activate your account
            {returnTo !== "/dashboard" ? " and return to your destination" : ""}.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
            Didn't receive it? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Full Name */}
      <div className="space-y-1.5">
        <label htmlFor="signup-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Full Name
        </label>
        <input
          {...register("name")}
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="signup-email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Email address
        </label>
        <input
          {...register("email")}
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      {/* Password + strength */}
      <div className="space-y-1.5">
        <label htmlFor="signup-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Password
        </label>
        <div className="relative">
          <input
            {...register("password")}
            id="signup-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 pr-12 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {watchedPassword.length > 0 && (
          <div className="space-y-1 pt-0.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i <= strength.score ? strength.barClass : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs font-semibold ${strength.colorClass}`}>{strength.label} password</p>
          </div>
        )}
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label htmlFor="signup-confirm" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Confirm Password
        </label>
        <div className="relative">
          <input
            {...register("confirmPassword")}
            id="signup-confirm"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 pr-12 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2.5">
        <input
          id="signup-terms"
          type="checkbox"
          required
          className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 shrink-0"
        />
        <label htmlFor="signup-terms" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer leading-relaxed select-none">
          I agree to the{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
            Privacy Policy
          </a>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating account…
          </>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}
