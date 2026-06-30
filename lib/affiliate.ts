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
};
