import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PartnerSidebar } from "@/components/partner/partner-sidebar";
import { Toaster } from "sonner";

export default async function PartnerLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/partner/login");

  const adminDb = createAdminClient();
  const { data: partner } = await (adminDb as any)
    .from("partners")
    .select("id, status, full_name, referral_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!partner) redirect("/partner/register");

  if (partner.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-black px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-full flex items-center justify-center mx-auto text-2xl">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Pending</h1>
          <p className="text-gray-500">Your partner application is under review. You&apos;ll receive an email once approved.</p>
        </div>
      </div>
    );
  }

  if (partner.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-black px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">✗</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Rejected</h1>
          <p className="text-gray-500">Unfortunately your partner application was not approved. Contact support for more information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-black overflow-hidden">
      <PartnerSidebar partnerName={partner.full_name} referralCode={partner.referral_code} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 shrink-0 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Partner Dashboard</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
