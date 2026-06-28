import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>
        <ForgotPasswordForm />
        <div className="text-center">
          <Link href="/login" className="text-sm font-medium text-primary hover:text-primary/90">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
