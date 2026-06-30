import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPartnerEmail, PARTNER_EMAIL_TEMPLATES } from "@/lib/partner";

async function assertAdmin(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await props.params;
  const body = await req.json().catch(() => ({}));
  const { status, rejection_reason, referral_code, commission_rate } = body;

  const adminDb = createAdminClient();

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updatePayload.status = status;
  if (rejection_reason !== undefined) updatePayload.rejection_reason = rejection_reason;
  if (referral_code) updatePayload.referral_code = referral_code.toUpperCase();
  if (commission_rate !== undefined) updatePayload.commission_rate = commission_rate;

  const { data: partner, error } = await (adminDb as any)
    .from("partners")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send email on approval
  if (status === "approved") {
    const tpl = PARTNER_EMAIL_TEMPLATES.approved(partner.full_name, partner.referral_code);
    await sendPartnerEmail(partner.email, tpl.subject, tpl.html);
  }

  return NextResponse.json({ partner });
}
