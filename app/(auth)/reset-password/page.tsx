import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Please enter your new password below.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
