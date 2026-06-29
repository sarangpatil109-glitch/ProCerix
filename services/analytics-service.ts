import { createClient } from "@/lib/supabase/server";

export class AnalyticsService {
  static async getDashboardMetrics() {
    const supabase = await createClient();

    // Fire all queries concurrently for performance
    const [
      { count: totalUsers },
      { data: payments },
      { count: certificates },
      { count: internshipsCompleted },
      { count: pendingGenerations },
      { count: failedGenerations },
      { count: publishedCourses },
      { count: draftCourses },
      { data: recentActivity },
      { data: recentUsers }
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("*"), // Fetching all to calculate revenue
      supabase.from("certificates").select("*", { count: "exact", head: true }),
      supabase.from("internship_submissions").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("generation_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("generation_queue").select("*", { count: "exact", head: true }).eq("status", "failed"),
      supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_published", false),
      // Mocking recent activity query since it requires cross-table joins, we'll fetch recent payments and courses
      supabase.from("payments").select("*, profiles(first_name, last_name), courses(title)").order("created_at", { ascending: false }).limit(5),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5)
    ]);

    // Calculate Revenues
    const successfulPayments = payments?.filter(p => p.status === "success") || [];
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenue = successfulPayments
      .filter(p => new Date(p.created_at) >= today)
      .reduce((sum, p) => sum + Number(p.amount), 0);
      
    // Calculate Product purchases
    // We can infer resume and linkedin purchases from course_type in the future if we join, 
    // but for now, if they are fetched from courses, we count them if we had joined. 
    // Let's do a direct count from enrollments for those specific types.
    const [{ count: resumePurchases }, { count: linkedinPurchases }] = await Promise.all([
      supabase.from("enrollments").select("*, courses!inner(course_type)", { count: "exact", head: true }).eq("courses.course_type", "resume"),
      supabase.from("enrollments").select("*, courses!inner(course_type)", { count: "exact", head: true }).eq("courses.course_type", "linkedin"),
    ]);

    return {
      totalUsers: totalUsers || 0,
      totalRevenue,
      todayRevenue,
      certificates: certificates || 0,
      internshipsCompleted: internshipsCompleted || 0,
      resumePurchases: resumePurchases || 0,
      linkedinPurchases: linkedinPurchases || 0,
      pendingGenerations: pendingGenerations || 0,
      failedGenerations: failedGenerations || 0,
      publishedCourses: publishedCourses || 0,
      draftCourses: draftCourses || 0,
      successfulPaymentsCount: successfulPayments.length,
      failedPaymentsCount: payments?.filter(p => p.status === "failed").length || 0,
      recentActivity: recentActivity || [],
      recentUsers: recentUsers || []
    };
  }
}
