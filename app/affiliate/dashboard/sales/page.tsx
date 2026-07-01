import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SalesClient } from "./sales-client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "—";
  const [local, domain] = email.split("@");
  const show = Math.min(3, local.length);
  return `${local.slice(0, show)}${"*".repeat(Math.max(2, local.length - show))}@${domain}`;
}

function titleFromSlugOrSkill(slug?: string | null, skill?: string | null): string {
  const raw = slug || skill;
  if (!raw) return "Certificate Course";
  return raw
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Page (server component) ─────────────────────────────────────────────────

export default async function AffiliateSalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?returnTo=/affiliate/dashboard/sales");

  const adminDb = createAdminClient();

  // Affiliate profile
  const { data: profile } = await (adminDb as any)
    .from("affiliate_profiles")
    .select("id, commission_percentage")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!profile) redirect("/affiliate");

  // All sales for this affiliate
  const { data: rawSales } = await (adminDb as any)
    .from("affiliate_sales")
    .select("*")
    .eq("affiliate_id", profile.id)
    .order("created_at", { ascending: false });

  const allSales: any[] = rawSales ?? [];

  // ── Step 1: payments ────────────────────────────────────────────────────────
  const paymentIds = allSales.map((s: any) => s.payment_id).filter(Boolean);
  const paymentsById: Record<string, any> = {};

  if (paymentIds.length > 0) {
    const { data: paymentRows } = await (adminDb as any)
      .from("payments")
      .select("id, course_id, course_slug, skill_name, cashfree_order_id, user_id")
      .in("id", paymentIds);

    const payments: any[] = paymentRows ?? [];

    // ── Step 2: courses ──────────────────────────────────────────────────────
    const courseIds  = [...new Set(payments.map(p => p.course_id).filter(Boolean))];
    const slugsOnly  = [...new Set(
      payments.filter(p => !p.course_id && p.course_slug).map(p => p.course_slug as string)
    )];

    const coursesById:   Record<string, any> = {};
    const coursesBySlug: Record<string, any> = {};

    if (courseIds.length > 0) {
      const { data: byId } = await (adminDb as any)
        .from("courses")
        .select("id, slug, title, category, thumbnail")
        .in("id", courseIds);
      for (const c of byId ?? []) {
        coursesById[c.id]    = c;
        coursesBySlug[c.slug] = c;
      }
    }
    if (slugsOnly.length > 0) {
      const { data: bySlug } = await (adminDb as any)
        .from("courses")
        .select("id, slug, title, category, thumbnail")
        .in("slug", slugsOnly);
      for (const c of bySlug ?? []) coursesBySlug[c.slug] = c;
    }

    // ── Step 3: customer name + email ────────────────────────────────────────
    const userIds = [...new Set(payments.map(p => p.user_id).filter(Boolean))] as string[];
    const profilesById: Record<string, any> = {};
    const emailById:    Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: ups } = await (adminDb as any)
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);
      for (const p of ups ?? []) profilesById[p.id] = p;

      try {
        const { data: { users: authUsers } } = await adminDb.auth.admin.listUsers({ perPage: 1000 });
        for (const u of authUsers ?? []) {
          if (userIds.includes(u.id)) emailById[u.id] = u.email ?? "";
        }
      } catch { /* non-fatal — email masking falls back to "—" */ }
    }

    // ── Build enriched payments map ──────────────────────────────────────────
    for (const p of payments) {
      const course  = coursesById[p.course_id] ?? coursesBySlug[p.course_slug];
      const up      = profilesById[p.user_id] ?? {};
      const rawEmail = emailById[p.user_id] ?? "";

      paymentsById[p.id] = {
        cashfree_order_id: p.cashfree_order_id ?? "",
        course_title:      course?.title   ?? titleFromSlugOrSkill(p.course_slug, p.skill_name),
        course_category:   course?.category ?? p.skill_name ?? "",
        course_thumbnail:  course?.thumbnail ?? null,
        course_slug:       course?.slug ?? p.course_slug ?? "",
        customer_name:     [up.first_name, up.last_name].filter(Boolean).join(" ") || "Customer",
        customer_email:    maskEmail(rawEmail),
      };
    }
  }

  // ── Serialisable sale objects (no Dates / BigInts) ───────────────────────
  const enrichedSales = allSales.map((s: any) => ({
    id:                    s.id,
    created_at:            s.created_at,
    order_id:              s.order_id ?? "",
    coupon_code:           s.coupon_code ?? "",
    purchase_amount:       Number(s.purchase_amount  ?? 0),
    discount_amount:       Number(s.discount_amount  ?? 0),
    final_amount:          Number(s.final_amount     ?? 0),
    commission_amount:     Number(s.commission_amount ?? 0),
    commission_paid:       Boolean(s.commission_paid),
    payment_status:        s.payment_status ?? "pending",
    commission_percentage: Number(profile.commission_percentage ?? 0),
    // enriched fields:
    cashfree_order_id: paymentsById[s.payment_id]?.cashfree_order_id ?? "",
    course_title:      paymentsById[s.payment_id]?.course_title      ?? titleFromSlugOrSkill(null, null),
    course_category:   paymentsById[s.payment_id]?.course_category   ?? "",
    course_thumbnail:  paymentsById[s.payment_id]?.course_thumbnail  ?? null,
    course_slug:       paymentsById[s.payment_id]?.course_slug       ?? "",
    customer_name:     paymentsById[s.payment_id]?.customer_name     ?? "Customer",
    customer_email:    paymentsById[s.payment_id]?.customer_email    ?? "—",
  }));

  return <SalesClient sales={enrichedSales} />;
}
