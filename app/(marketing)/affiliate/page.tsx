import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AffiliateApplyForm } from "@/components/affiliate/affiliate-apply-form";
import { CheckCircle2, TrendingUp, ShoppingBag, Wallet, MessageCircle, Star, Clock } from "lucide-react";
import Link from "next/link";

const BENEFITS = [
  { icon: TrendingUp, text: "Up to 50% commission per sale" },
  { icon: ShoppingBag, text: "Instant coupon tracking" },
  { icon: Wallet, text: "Withdraw earnings anytime" },
  { icon: MessageCircle, text: "WhatsApp sharing tools" },
  { icon: Star, text: "Marketing kit included" },
  { icon: CheckCircle2, text: "Real-time dashboard" },
];

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
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Application Under Review</h1>
            <p className="text-gray-500 mt-2">Your affiliate application has been submitted. We'll review it within 24–48 hours and notify you by email.</p>
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

  // Case 2: Not an affiliate (or rejected) → show Become Affiliate page
  const isRejected = application?.status === "rejected";

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: pitch */}
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-bold mb-6">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> Affiliate Program
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              Become a<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">ProCerix Affiliate</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
              Earn money by referring students to premium certificates and internships. Share your unique coupon code and earn a commission on every sale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BENEFITS.map(b => (
              <div key={b.text} className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <b.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{b.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 text-center">
            {[
              { value: "50%", label: "Commission" },
              { value: "₹0", label: "Joining Fee" },
              { value: "24h", label: "Approval Time" },
            ].map(s => (
              <div key={s.label} className="flex-1 py-4 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
                <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{s.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Apply form */}
        <div>
          {isRejected && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              <strong>Your previous application was rejected.</strong>
              {application?.rejection_reason && <p className="mt-1 text-red-600">{application.rejection_reason}</p>}
              <p className="mt-1">You may submit a new application below.</p>
            </div>
          )}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Apply Now</h2>
            <p className="text-sm text-gray-500 mb-6">Fill in your details and we'll review your application.</p>
            <AffiliateApplyForm />
          </div>
        </div>
      </div>
    </div>
  );
}
