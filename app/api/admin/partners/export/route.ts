import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
}

async function assertAdmin(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!await assertAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const type = req.nextUrl.searchParams.get("type") || "partners";
  const adminDb = createAdminClient();
  let csv = "";

  if (type === "partners") {
    const { data } = await (adminDb as any).from("partners").select("full_name,college_name,designation,email,phone,referral_code,commission_percentage,discount_type,discount_value,status,created_at").order("created_at", { ascending: false });
    csv = toCSV(data || []);
  } else if (type === "sales" || type === "commissions") {
    const { data } = await (adminDb as any).from("partner_sales").select("*, partners(full_name, email, referral_code)").order("created_at", { ascending: false });
    csv = toCSV((data || []).map((s: any) => ({
      partner_name: s.partners?.full_name,
      partner_email: s.partners?.email,
      coupon_code: s.coupon_code,
      product_type: s.product_type,
      purchase_amount: s.purchase_amount,
      discount_amount: s.discount_amount,
      commission_amount: s.commission_amount,
      payment_status: s.payment_status,
      created_at: s.created_at,
    })));
  } else if (type === "withdrawals") {
    const { data } = await (adminDb as any).from("withdraw_requests").select("*, partners(full_name, email)").order("created_at", { ascending: false });
    csv = toCSV((data || []).map((w: any) => ({
      partner_name: w.partners?.full_name,
      partner_email: w.partners?.email,
      amount: w.amount,
      status: w.status,
      payment_reference: w.payment_reference,
      requested_at: w.requested_at,
      paid_at: w.paid_at,
    })));
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${Date.now()}.csv"`,
    },
  });
}
