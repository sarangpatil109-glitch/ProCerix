import { createAdminClient } from "@/lib/supabase/admin";

// Safe helper: resolves to value or fallback — never throws, never hangs the page.
async function safeQuery<T>(
  label: string,
  fn: () => PromiseLike<{ data: T | null; error: unknown; count?: number | null }> | any
): Promise<{ data: T | null; count: number }> {
  console.time(`[admin] ${label}`);
  try {
    const result = await fn();
    console.timeEnd(`[admin] ${label}`);
    if (result.error) {
      console.error(`[admin] ${label} ERROR:`, result.error);
    }
    return { data: result.data ?? null, count: result.count ?? 0 };
  } catch (err) {
    console.timeEnd(`[admin] ${label}`);
    console.error(`[admin] ${label} THREW:`, err);
    return { data: null, count: 0 };
  }
}

export class AnalyticsService {
  static async getDashboardMetrics() {
    // Use service-role client so RLS never blocks admin analytics queries.
    const supabase = createAdminClient();

    console.log("[admin] getDashboardMetrics: starting all queries");
    console.time("[admin] getDashboardMetrics TOTAL");

    const [
      usersResult,
      paymentsResult,
      certificatesResult,
      internshipsResult,
      pendingGenResult,
      failedGenResult,
      publishedCoursesResult,
      draftCoursesResult,
      recentActivityResult,
      recentUsersResult,
      resumePurchasesResult,
      linkedinPurchasesResult,
    ] = await Promise.all([
      safeQuery("profiles count", () =>
        supabase.from("profiles").select("*", { count: "exact", head: true })
      ),
      safeQuery("payments all", () =>
        supabase.from("payments").select("id, amount, status, created_at")
      ),
      safeQuery("certificates count", () =>
        supabase.from("certificates").select("*", { count: "exact", head: true })
      ),
      safeQuery("internships approved count", () =>
        supabase.from("internship_submissions").select("*", { count: "exact", head: true }).eq("status", "approved")
      ),
      safeQuery("course_generation_requests pending count", () =>
        supabase.from("course_generation_requests").select("*", { count: "exact", head: true }).eq("status", "pending")
      ),
      safeQuery("course_generation_requests failed count", () =>
        supabase.from("course_generation_requests").select("*", { count: "exact", head: true }).eq("status", "failed")
      ),
      safeQuery("courses published count", () =>
        supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_published", true)
      ),
      safeQuery("courses draft count", () =>
        supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_published", false)
      ),
      safeQuery("recent payments", () =>
        supabase.from("payments").select("id, amount, status, created_at, profiles(first_name, last_name)").order("created_at", { ascending: false }).limit(5)
      ),
      safeQuery("recent users", () =>
        supabase.from("profiles").select("id, first_name, last_name, created_at").order("created_at", { ascending: false }).limit(5)
      ),
      safeQuery("resume enrollments count", () =>
        supabase.from("enrollments").select("id, courses!inner(course_type)", { count: "exact", head: true }).eq("courses.course_type", "resume")
      ),
      safeQuery("linkedin enrollments count", () =>
        supabase.from("enrollments").select("id, courses!inner(course_type)", { count: "exact", head: true }).eq("courses.course_type", "linkedin")
      ),
    ]);

    console.timeEnd("[admin] getDashboardMetrics TOTAL");

    const payments: any[] = (paymentsResult.data as any[]) ?? [];
    const successfulPayments = payments.filter((p) => p.status === "success");
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenue = successfulPayments
      .filter((p) => new Date(p.created_at) >= today)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalUsers: usersResult.count,
      totalRevenue,
      todayRevenue,
      certificates: certificatesResult.count,
      internshipsCompleted: internshipsResult.count,
      resumePurchases: resumePurchasesResult.count,
      linkedinPurchases: linkedinPurchasesResult.count,
      pendingGenerations: pendingGenResult.count,
      failedGenerations: failedGenResult.count,
      publishedCourses: publishedCoursesResult.count,
      draftCourses: draftCoursesResult.count,
      successfulPaymentsCount: successfulPayments.length,
      failedPaymentsCount: payments.filter((p) => p.status === "failed").length,
      recentActivity: recentActivityResult.data ?? [],
      recentUsers: recentUsersResult.data ?? [],
    };
  }
}
