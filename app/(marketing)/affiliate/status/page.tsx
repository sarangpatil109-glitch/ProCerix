import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Clock } from "lucide-react";
import Link from "next/link";

export default async function AffiliateStatusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/affiliate/status");
  }

  const adminDb = createAdminClient();

  // Check affiliate profile (approved)
  const { data: profile } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile && profile.status === "active") {
    redirect("/affiliate/dashboard");
  }

  // Check application status
  const { data: application } = await (adminDb as any)
    .from("affiliate_applications")
    .select("id, status, name, rejection_reason")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!application) {
    redirect("/affiliate");
  }

  if (application.status === "rejected") {
    redirect("/affiliate");
  }

  // Pending State
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Application Submitted Successfully</h1>
          <p className="text-gray-500 mt-2 font-semibold">Status: Pending Approval</p>
          <p className="text-gray-500 mt-2 text-sm">Your affiliate application has been submitted. We'll review it within 24–48 hours and notify you by email.</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 text-left space-y-2">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">What happens next?</p>
          <ul className="text-sm text-blue-600 dark:text-blue-500 space-y-1">
            <li>✓ Admin reviews your application</li>
            <li>✓ Coupon code generated on approval</li>
            <li>✓ Dashboard access enabled</li>
            <li>✓ Email notification sent</li>
          </ul>
        </div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm transition-colors">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
