import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ProfileSettingsPage } from "@/components/profile/settings-page";

export const metadata = { title: "Account Settings" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?returnTo=/dashboard/profile");

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Purchase stats
  const [
    { count: totalPurchases },
    { count: certCount },
    { data: coursePayments },
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

  type CoursePayment = { id: string; course_id: string | null; courses: { course_type: string | null } | null };
  const typedPayments = ((coursePayments as unknown) ?? []) as CoursePayment[];

  const purchaseStats = {
    total:         totalPurchases   ?? 0,
    certificates:  certCount        ?? 0,
    internships:   typedPayments.filter(p => p.courses?.course_type === "internship").length,
    resumeBuilds:  typedPayments.filter(p => p.courses?.course_type === "resume").length,
    linkedinOpts:  typedPayments.filter(p => p.courses?.course_type === "linkedin").length,
    atsReports:    typedPayments.filter(p => p.courses?.course_type === "hr").length,
    memberSince:   user.created_at
      ? new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long" })
      : "—",
  };

  // Bank details — only if user is an affiliate
  const adminDb = createAdminClient();
  const { data: affiliateRow } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("account_holder, bank_name, account_number, ifsc_code, branch_name, upi_id, phone, bank_verified, bank_verified_at")
    .eq("user_id", user.id)
    .maybeSingle();

  function maskAccountNumber(raw: string) {
    if (raw.length <= 4) return raw;
    return "X".repeat(raw.length - 4) + raw.slice(-4);
  }

  const bankDetails = affiliateRow
    ? {
        account_holder:        affiliateRow.account_holder  ?? null,
        bank_name:             affiliateRow.bank_name        ?? null,
        account_number_masked: affiliateRow.account_number  ? maskAccountNumber(affiliateRow.account_number) : null,
        ifsc_code:             affiliateRow.ifsc_code        ?? null,
        branch_name:           affiliateRow.branch_name      ?? null,
        upi_id:                affiliateRow.upi_id           ?? null,
        phone:                 affiliateRow.phone            ?? null,
        bank_verified:         affiliateRow.bank_verified    ?? false,
        bank_verified_at:      affiliateRow.bank_verified_at ?? null,
      }
    : null;

  return (
    <ProfileSettingsPage
      profile={profile as any}
      email={user.email ?? ""}
      purchaseStats={purchaseStats}
      bankDetails={bankDetails}
      isAffiliate={!!affiliateRow}
    />
  );
}
