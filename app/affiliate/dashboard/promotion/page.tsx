import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CouponCard } from "@/components/partner/coupon-card";

export default async function AffiliatePromotionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/dashboard/promotion");

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any).from("affiliate_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile || profile.status !== "active") redirect("/affiliate");

  const { data: sales } = await (adminDb as any).from("affiliate_sales").select("commission_amount, payment_status").eq("affiliate_id", profile.id);
  const completed = (sales || []).filter((s: any) => s.payment_status === "completed");
  const totalEarned = completed.reduce((sum: number, s: any) => sum + Number(s.commission_amount), 0);

  // Map affiliate_profile to the shape CouponCard expects
  const partnerShape = {
    full_name: profile.name,
    referral_code: profile.coupon_code,
    discount_type: profile.discount_type,
    discount_value: profile.discount_value,
    commission_percentage: profile.commission_percentage,
    status: profile.status === "active" ? "approved" : profile.status,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Promotion Center</h2>
        <p className="text-gray-500 mt-1">Share your coupon and earn commissions on every sale.</p>
      </div>
      <CouponCard partner={partnerShape} totalSales={completed.length} totalEarned={totalEarned} />
    </div>
  );
}
