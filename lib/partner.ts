export function calcDiscount(
  amount: number,
  discountType: "percentage" | "flat",
  discountValue: number
): { discountAmount: number; finalAmount: number } {
  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = parseFloat(((amount * discountValue) / 100).toFixed(2));
  } else {
    discountAmount = Math.min(discountValue, amount);
  }
  const finalAmount = parseFloat(Math.max(1, amount - discountAmount).toFixed(2));
  return { discountAmount, finalAmount };
}

export function generateReferralCode(name: string, collegeName?: string): string {
  const seed = collegeName
    ? collegeName.replace(/\s+/g, "").toUpperCase().slice(0, 4)
    : name.replace(/\s+/g, "").toUpperCase().slice(0, 5);
  const suffix = Math.floor(10 + Math.random() * 90).toString();
  return `${seed}${suffix}`;
}

export function calcCommission(amount: number, rate: number): number {
  return parseFloat(((amount * rate) / 100).toFixed(2));
}

export async function sendPartnerEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "ProCerix <partners@procerix.com>",
        to,
        subject,
        html,
      }),
    });
  } catch {
    // non-blocking
  }
}

export const PARTNER_EMAIL_TEMPLATES = {
  approved: (name: string, code: string) => ({
    subject: "🎉 You're now a ProCerix Partner!",
    html: `<p>Hi ${name},</p><p>Your partner application has been <strong>approved</strong>!</p><p>Your referral code is: <strong>${code}</strong></p><p>Share it with students to start earning commissions. Log in to your partner dashboard at <a href="https://procerix.com/partner/dashboard">procerix.com/partner/dashboard</a></p>`,
  }),
  purchase: (name: string, amount: number, commission: number) => ({
    subject: "💰 New commission earned on ProCerix!",
    html: `<p>Hi ${name},</p><p>A student just purchased using your referral code.</p><p>Purchase: ₹${amount} — Commission: <strong>₹${commission}</strong></p><p>View your dashboard at <a href="https://procerix.com/partner/dashboard">procerix.com/partner/dashboard</a></p>`,
  }),
  withdrawalApproved: (name: string, amount: number) => ({
    subject: "✅ Withdrawal Approved",
    html: `<p>Hi ${name},</p><p>Your withdrawal request of <strong>₹${amount}</strong> has been <strong>approved</strong> and will be processed shortly.</p>`,
  }),
  withdrawalPaid: (name: string, amount: number, ref?: string) => ({
    subject: "💸 Payment Sent",
    html: `<p>Hi ${name},</p><p>₹${amount} has been transferred to your account. Reference: ${ref || "N/A"}</p><p>Thank you for being a ProCerix Partner!</p>`,
  }),
};
