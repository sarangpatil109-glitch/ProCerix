import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminDb = createAdminClient();

  const { data: profile } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "Not an active affiliate" }, { status: 403 });
  }

  // Sales stats
  const { data: sales } = await (adminDb as any)
    .from("affiliate_sales")
    .select("commission_amount, purchase_amount, discount_amount, payment_status, created_at, coupon_code, product_type")
    .eq("affiliate_id", profile.id);

  const { count: clicks } = await (adminDb as any)
    .from("affiliate_clicks")
    .select("id", { count: "exact", head: true })
    .eq("affiliate_id", profile.id);

  // Withdrawal stats
  const { data: withdrawals } = await (adminDb as any)
    .from("affiliate_withdraw_requests")
    .select("amount, status")
    .eq("affiliate_id", profile.id);

  const allSales = (sales || []);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const completedSales = allSales.filter((s: any) => s.payment_status === "completed");
  const sumComm = (arr: any[]) => arr.reduce((sum: number, s: any) => sum + Number(s.commission_amount), 0);

  const totalEarned = sumComm(completedSales);
  const pendingWdAmt = (withdrawals || []).filter((w: any) => ["pending", "approved"].includes(w.status)).reduce((s: number, w: any) => s + Number(w.amount), 0);
  const paidWdAmt = (withdrawals || []).filter((w: any) => w.status === "paid").reduce((s: number, w: any) => s + Number(w.amount), 0);
  const withdrawable = Math.max(0, totalEarned - pendingWdAmt - paidWdAmt);

  const filterSales = (from: Date) => completedSales.filter((s: any) => new Date(s.created_at) >= from);

  return NextResponse.json({
    profile,
    stats: {
      clicks: clicks ?? 0,
      totalSales: completedSales.length,
      totalEarned,
      withdrawable,
      pendingEarned: sumComm(allSales.filter((s: any) => s.payment_status === "pending")),
      pendingWdAmt,
      paidWdAmt,
      today: { sales: filterSales(startOfDay).length, commission: sumComm(filterSales(startOfDay)) },
      week: { sales: filterSales(startOfWeek).length, commission: sumComm(filterSales(startOfWeek)) },
      month: { sales: filterSales(startOfMonth).length, commission: sumComm(filterSales(startOfMonth)) },
    },
    recentSales: allSales.slice(0, 10),
    withdrawals: withdrawals || [],
  });
}
