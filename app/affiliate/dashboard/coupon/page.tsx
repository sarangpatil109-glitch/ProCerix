import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tag, Info } from "lucide-react";

export default async function AffiliateCouponPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/dashboard/coupon");

  const adminDb = createAdminClient();
  const { data: profile } = await (adminDb as any).from("affiliate_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile || profile.status !== "active") redirect("/affiliate");

  const promoLink = `https://procerix.com?coupon=${profile.coupon_code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(promoLink)}&size=300x300&margin=10`;

  const rows = [
    { label: "Coupon Code", value: profile.coupon_code, mono: true },
    { label: "Discount Type", value: profile.discount_type === "flat" ? "Flat (₹)" : "Percentage (%)" },
    { label: "Discount Value", value: profile.discount_type === "flat" ? `₹${profile.discount_value}` : `${profile.discount_value}%` },
    { label: "Commission", value: `${profile.commission_percentage}%` },
    { label: "Status", value: profile.status },
    { label: "Promotion Link", value: promoLink, mono: true, truncate: true },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">My Coupon</h2>
        <p className="text-gray-500 mt-1">Your unique coupon code and discount details.</p>
      </div>

      {/* Code card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white text-center shadow-2xl shadow-blue-500/30">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Tag className="w-5 h-5 opacity-80" />
          <span className="text-sm font-semibold opacity-80 uppercase tracking-widest">Your Coupon Code</span>
        </div>
        <p className="font-mono text-5xl font-black tracking-[0.2em]">{profile.coupon_code}</p>
        <p className="mt-3 text-blue-100 text-sm">
          {profile.discount_type === "flat" ? `₹${profile.discount_value} flat off` : `${profile.discount_value}% off`}
          {" · "}{profile.commission_percentage}% commission per sale
        </p>
      </div>

      {/* QR */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="QR code" width={140} height={140} className="rounded-xl border border-gray-100 dark:border-gray-800 shrink-0" />
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <p className="font-semibold text-gray-900 dark:text-white">QR Code</p>
          <p className="text-sm text-gray-500">Students can scan this to auto-apply your coupon instantly.</p>
          <a href={qrUrl} download={`${profile.coupon_code}-qr.png`} className="inline-block mt-2 text-sm text-blue-600 hover:underline font-medium">
            Download QR Code
          </a>
        </div>
      </div>

      {/* Details table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Info className="w-4 h-4" /> Coupon Details</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map(r => (
            <div key={r.label} className="px-6 py-3.5 flex items-center justify-between gap-4">
              <span className="text-sm text-gray-500 shrink-0">{r.label}</span>
              <span className={`text-sm font-medium text-gray-900 dark:text-white text-right ${r.mono ? "font-mono" : ""} ${r.truncate ? "truncate max-w-[200px]" : ""}`}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
