import { createAdminClient } from "@/lib/supabase/admin";

export function calcAffiliateDiscount(amount: number, type: string, value: number) {
  if (type === "flat") {
    const discountAmount = Math.min(value, amount);
    return { discountAmount, finalAmount: Math.max(0, amount - discountAmount) };
  }
  const discountAmount = Math.round((amount * value) / 100);
  return { discountAmount, finalAmount: Math.max(0, amount - discountAmount) };
}

export function generateAffiliateCoupon(name: string): string {
  const clean = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 6).padEnd(3, "A");
  const suffix = Math.floor(Math.random() * 90 + 10).toString();
  return `${clean}${suffix}`;
}

export async function getAffiliateSettings() {
  const adminDb = createAdminClient();
  const { data } = await (adminDb as any)
    .from("affiliate_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return data ?? {
    default_commission_percentage: 50,
    default_discount_type: "percentage",
    default_discount_value: 10,
    minimum_withdrawal: 500,
    coupon_expiry_days: null,
    coupon_usage_limit: null,
    auto_approve: false,
  };
}

export async function sendAffiliateEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ProCerix <noreply@procerix.com>",
        to,
        subject,
        html,
      }),
    });
  } catch {}
}

/** Recomputes wallet totals from source tables and upserts the wallet row. */
export async function syncAffiliateWallet(adminDb: any, affiliateId: string) {
  const [salesRes, payoutsRes] = await Promise.all([
    (adminDb as any)
      .from("affiliate_sales")
      .select("commission_amount")
      .eq("affiliate_id", affiliateId)
      .eq("payment_status", "completed"),
    (adminDb as any)
      .from("affiliate_weekly_payouts")
      .select("amount")
      .eq("affiliate_id", affiliateId)
      .eq("status", "paid"),
  ]);

  const totalEarned = (salesRes.data ?? []).reduce(
    (s: number, x: any) => s + Number(x.commission_amount), 0
  );
  const totalPaid = (payoutsRes.data ?? []).reduce(
    (s: number, x: any) => s + Number(x.amount), 0
  );
  const availableBalance = Math.max(0, totalEarned - totalPaid);

  await (adminDb as any).from("affiliate_wallets").upsert(
    {
      affiliate_id: affiliateId,
      total_earned: totalEarned,
      total_paid: totalPaid,
      available_balance: availableBalance,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "affiliate_id" }
  );

  return { totalEarned, totalPaid, availableBalance };
}

export const AFFILIATE_EMAIL_TEMPLATES = {
  applicationSubmitted: (name: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>Application Received 🎉</h2>
      <p>Hi ${name},</p>
      <p>Your affiliate application has been submitted. We'll review it within 24–48 hours.</p>
      <p>We'll notify you once a decision is made.</p>
      <br><p>— ProCerix Team</p>
    </div>`,
  applicationApproved: (name: string, coupon: string, commission: number) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>🎉 Welcome to the ProCerix Affiliate Program!</h2>
      <p>Hi ${name},</p>
      <p>Your affiliate application has been <strong>approved!</strong></p>
      <p><strong>Your Coupon Code:</strong> <code style="background:#f0f0f0;padding:4px 8px;border-radius:4px;font-size:18px;">${coupon}</code></p>
      <p><strong>Commission:</strong> ${commission}% on every sale</p>
      <p><a href="https://procerix.com/affiliate" style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">Open Your Dashboard →</a></p>
      <br><p>— ProCerix Team</p>
    </div>`,
  applicationRejected: (name: string, reason?: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>Application Update</h2>
      <p>Hi ${name},</p>
      <p>Unfortunately, your affiliate application was not approved at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>You may re-apply after 30 days.</p>
      <br><p>— ProCerix Team</p>
    </div>`,
  commissionEarned: (name: string, amount: string, coupon: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>💰 Commission Earned!</h2>
      <p>Hi ${name},</p>
      <p>You just earned <strong>₹${amount}</strong> via coupon <strong>${coupon}</strong>.</p>
      <p><a href="https://procerix.com/affiliate" style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">View Dashboard →</a></p>
      <br><p>— ProCerix Team</p>
    </div>`,
  withdrawalApproved: (name: string, amount: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>💳 Withdrawal Approved</h2>
      <p>Hi ${name},</p>
      <p>Your withdrawal request of <strong>₹${amount}</strong> has been approved and is being processed.</p>
      <br><p>— ProCerix Team</p>
    </div>`,
  weeklyPayoutSuccess: (name: string, amount: number, transferId: string, weekStart: string, weekEnd: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#111;">💰 Weekly Payout Transferred!</h2>
      <p>Hi ${name},</p>
      <p>Your weekly affiliate payout of <strong>₹${amount.toFixed(2)}</strong> for the week of <strong>${weekStart} – ${weekEnd}</strong> has been successfully initiated to your bank account.</p>
      <table style="margin:16px 0;border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px 0;color:#555;font-size:14px;">Amount</td><td style="padding:8px 0;font-weight:bold;">₹${amount.toFixed(2)}</td></tr>
        <tr><td style="padding:8px 0;color:#555;font-size:14px;">Transfer ID</td><td style="padding:8px 0;font-family:monospace;">${transferId}</td></tr>
        <tr><td style="padding:8px 0;color:#555;font-size:14px;">Week</td><td style="padding:8px 0;">${weekStart} – ${weekEnd}</td></tr>
      </table>
      <p style="color:#555;font-size:14px;">The amount will reflect in your bank account within 24–48 hours depending on your bank.</p>
      <a href="https://procerix.com/affiliate/dashboard/payouts" style="display:inline-block;margin-top:16px;background:#2563eb;color:white;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:600;">View Payout History →</a>
      <br><br><p style="color:#888;font-size:13px;">— ProCerix Team</p>
    </div>`,
  weeklyPayoutFailed: (name: string, amount: number, weekStart: string, weekEnd: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#dc2626;">⚠️ Payout Transfer Failed</h2>
      <p>Hi ${name},</p>
      <p>Unfortunately, your weekly payout of <strong>₹${amount.toFixed(2)}</strong> for the week of <strong>${weekStart} – ${weekEnd}</strong> could not be processed at this time.</p>
      <p>Our team has been notified and will retry the transfer or contact you if additional information is needed.</p>
      <p>Please ensure your bank account details on your profile are correct and up to date.</p>
      <a href="https://procerix.com/affiliate/dashboard/profile" style="display:inline-block;margin-top:16px;background:#2563eb;color:white;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:600;">Update Bank Details →</a>
      <br><br><p style="color:#888;font-size:13px;">— ProCerix Team</p>
    </div>`,
};
