import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AffiliateDashboardShell } from "@/components/affiliate/affiliate-dashboard-shell";
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
    <>
      <AffiliateDashboardShell name={profile.name} coupon={profile.coupon_code}>
        {children}
      </AffiliateDashboardShell>
      <Toaster position="top-center" richColors />
    </>
  );
}
