import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AffiliateSidebar } from "@/components/affiliate/affiliate-sidebar";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

export default async function AffiliateDashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/dashboard");

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, name, coupon_code, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") {
    redirect("/affiliate");
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      <AffiliateSidebar name={profile.name} coupon={profile.coupon_code} />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
