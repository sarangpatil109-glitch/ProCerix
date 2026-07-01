import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "—";
  const [local, domain] = email.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

function formatSlug(slug: string | null | undefined): string {
  if (!slug) return "Certificate Course";
  return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminDb = createAdminClient();

  const { data: profile } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, commission_percentage, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "No active affiliate profile" }, { status: 403 });

  const { data: rawSales } = await (adminDb as any)
    .from("affiliate_sales")
    .select("*")
    .eq("affiliate_id", profile.id)
    .order("created_at", { ascending: false });

  const allSales: any[] = rawSales || [];
  if (allSales.length === 0) return NextResponse.json({ sales: [] });

  // ── Batch: payments ────────────────────────────────────────────────────────
  const paymentIds = allSales.map((s: any) => s.payment_id).filter(Boolean);
  const paymentsById: Record<string, any> = {};

  if (paymentIds.length > 0) {
    const { data: payments } = await (adminDb as any)
      .from("payments")
      .select("id, course_id, course_slug, skill_name, cashfree_order_id, user_id")
      .in("id", paymentIds);

    const paymentRows: any[] = payments || [];

    // ── Batch: courses by ID ──────────────────────────────────────────────────
    const courseIds = [...new Set(paymentRows.map(p => p.course_id).filter(Boolean))];
    const slugsWithoutId = [...new Set(
      paymentRows.filter(p => !p.course_id && p.course_slug).map(p => p.course_slug)
    )];
    const coursesById: Record<string, any> = {};
    const coursesBySlug: Record<string, any> = {};

    if (courseIds.length > 0) {
      const { data: byId } = await (adminDb as any)
        .from("courses")
        .select("id, slug, title, category, thumbnail")
        .in("id", courseIds);
      for (const c of (byId || [])) {
        coursesById[c.id] = c;
        coursesBySlug[c.slug] = c;
      }
    }
    if (slugsWithoutId.length > 0) {
      const { data: bySlug } = await (adminDb as any)
        .from("courses")
        .select("id, slug, title, category, thumbnail")
        .in("slug", slugsWithoutId);
      for (const c of (bySlug || [])) coursesBySlug[c.slug] = c;
    }

    // ── Batch: customer profiles + emails ─────────────────────────────────────
    const userIds = [...new Set(paymentRows.map(p => p.user_id).filter(Boolean))] as string[];
    const profilesById: Record<string, any> = {};
    const emailById: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: userProfiles } = await (adminDb as any)
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);
      for (const p of (userProfiles || [])) profilesById[p.id] = p;

      try {
        const { data: { users: authUsers } } = await adminDb.auth.admin.listUsers({ perPage: 1000 });
        for (const u of authUsers || []) {
          if (userIds.includes(u.id)) emailById[u.id] = u.email ?? "";
        }
      } catch { /* non-fatal */ }
    }

    // ── Merge ────────────────────────────────────────────────────────────────
    for (const p of paymentRows) {
      const course = coursesById[p.course_id] || coursesBySlug[p.course_slug];
      const up     = profilesById[p.user_id] || {};
      const email  = emailById[p.user_id] || "";

      paymentsById[p.id] = {
        cashfree_order_id:    p.cashfree_order_id || "",
        course_slug:          course?.slug || p.course_slug || "",
        course_title:         course?.title || formatSlug(p.course_slug || p.skill_name),
        course_category:      course?.category || p.skill_name || "",
        course_thumbnail:     course?.thumbnail || null,
        customer_name:        [up.first_name, up.last_name].filter(Boolean).join(" ") || "Customer",
        customer_email_raw:   email,
        customer_email:       maskEmail(email),
      };
    }
  }

  const enriched = allSales.map((s: any) => ({
    id:                  s.id,
    created_at:          s.created_at,
    order_id:            s.order_id || "",
    coupon_code:         s.coupon_code || "",
    purchase_amount:     s.purchase_amount,
    discount_amount:     s.discount_amount,
    final_amount:        s.final_amount,
    commission_amount:   s.commission_amount,
    commission_paid:     s.commission_paid,
    payment_status:      s.payment_status,
    commission_percentage: profile.commission_percentage,
    // enriched from payment → courses + profiles
    ...(paymentsById[s.payment_id] ?? {
      cashfree_order_id: "",
      course_slug:       "",
      course_title:      formatSlug(s.product_type),
      course_category:   "",
      course_thumbnail:  null,
      customer_name:     "Customer",
      customer_email:    "—",
      customer_email_raw:"",
    }),
  }));

  return NextResponse.json({ sales: enriched });
}
