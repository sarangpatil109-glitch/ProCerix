import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/dashboard/settings-client";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?returnTo=/dashboard/settings");

  // Fetch user profile with all settings columns
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Purchase + billing stats
  const [
    { count: totalPurchases },
    { count: certCount },
    { data: internshipPayments },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "success"),
    supabase
      .from("certificates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("payments")
      .select("id, course_id, courses(course_type)")
      .eq("user_id", user.id)
      .eq("status", "success"),
  ]);

  type P = { id: string; course_id: string | null; courses: { course_type: string | null } | null };
  const payments = (internshipPayments as unknown as P[]) ?? [];
  const internshipCount = payments.filter(p => p.courses?.course_type === "internship").length;

  // Affiliate earnings
  const adminDb = createAdminClient();
  let affiliateEarnings = 0;
  let isAffiliate = false;

  const { data: affiliateRow } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (affiliateRow?.id) {
    isAffiliate = true;
    const { data: salesData } = await (adminDb as any)
      .from("affiliate_sales")
      .select("commission_earned")
      .eq("affiliate_id", affiliateRow.id)
      .eq("status", "completed");
    affiliateEarnings = (salesData ?? []).reduce((s: number, r: any) => s + (r.commission_earned ?? 0), 0);
  }

  return (
    <SettingsClient
      data={profile as any ?? {}}
      email={user.email ?? ""}
      billingStats={{
        totalPurchases: totalPurchases  ?? 0,
        certificates:   certCount       ?? 0,
        internships:    internshipCount,
        affiliateEarnings,
        isAffiliate,
      }}
    />
  );
}
