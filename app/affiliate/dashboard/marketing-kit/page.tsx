import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AffiliateMarketingKit } from "@/components/affiliate/affiliate-marketing-kit";

export default async function AffiliateMarketingKitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/dashboard/marketing-kit");

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any).from("affiliate_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile || profile.status !== "active") redirect("/affiliate");

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Marketing Kit</h2>
        <p className="text-gray-500 mt-1">Ready-to-use messages and templates for promoting ProCerix.</p>
      </div>
      <AffiliateMarketingKit coupon={profile.coupon_code} name={profile.name} discountLabel={profile.discount_type === "flat" ? `₹${profile.discount_value} off` : `${profile.discount_value}% off`} />
    </div>
  );
}
