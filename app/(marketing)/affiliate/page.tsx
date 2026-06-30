import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AffiliateApplyForm } from "@/components/affiliate/affiliate-apply-form";


export default async function AffiliatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Case 1: Not logged in → redirect to login
  if (!user) {
    redirect("/login?next=/affiliate");
  }

  const adminDb = createAdminClient();

  // Check affiliate profile (approved)
  const { data: profile } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  // Case 3: Approved affiliate → dashboard
  if (profile && profile.status === "active") {
    redirect("/affiliate/dashboard");
  }

  // Check application status
  const { data: application } = await (adminDb as any)
    .from("affiliate_applications")
    .select("id, status, name, rejection_reason")
    .eq("user_id", user.id)
    .maybeSingle();

  // Show pending state
  if (application?.status === "pending") {
    redirect("/affiliate/status");
  }

  // Case 2: Not an affiliate (or rejected) → show Become Affiliate page
  const isRejected = application?.status === "rejected";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
      <div className="flex justify-center items-center">
        {/* Form container */}
        <div className="w-full max-w-[700px]">
          {isRejected && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              <strong>Your previous application was rejected.</strong>
              {application?.rejection_reason && <p className="mt-1 text-red-600">{application.rejection_reason}</p>}
              <p className="mt-1">You may submit a new application below.</p>
            </div>
          )}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 text-center">Apply to Become a ProCerix Affiliate</h2>
            <p className="text-sm text-gray-500 mb-6 text-center">Fill in your details and we'll review your application.</p>
            <AffiliateApplyForm />
          </div>
        </div>
      </div>
    </div>
  );
}
