import { CourseService } from "@/services/course-service";
import { createClient } from "@/lib/supabase/server";

export class SearchService {
  static async searchCourses(searchParams: {
    q?: string;
    category?: string;
    type?: "certificate" | "internship" | "resume" | "linkedin" | "hr";
    difficulty?: "beginner" | "intermediate" | "advanced";
    free?: string;
    sort?: "newest" | "popular" | "alphabetical";
    page?: string;
  }) {
    const page = parseInt(searchParams.page || "1", 10);
    const limit = 12;
    const offset = (page - 1) * limit;

    let courses: any[] = [];

    // ── Internship search → query internships table ──────────────────────────
    if (searchParams.type === "internship") {
      const supabase = await createClient();
      let query = supabase
        .from("internships")
        .select("*")
        .eq("is_published", true);

      if (searchParams.category) query = query.eq("category", searchParams.category);

      const { data } = await query.order("created_at", { ascending: false });

      if (data) {
        courses = data.map(i => ({ ...i, course_type: "internship" }));
      }
    } else {
      // ── Certificate / general search → query courses table ──────────────────
      const repo = await CourseService.getRepository();
      const dbCourses = await repo.getCourses({
        status: "published",
        search: searchParams.q,
        category: searchParams.category,
        difficulty: searchParams.difficulty,
        isFree: searchParams.free === "true" ? true : (searchParams.free === "false" ? false : undefined),
        sort: searchParams.sort,
        limit: searchParams.q ? 1000 : limit,
        offset: searchParams.q ? 0 : offset,
      });
      courses = [...(dbCourses || [])];
    }

    // Apply relevance scoring when a query is present
    if (searchParams.q) {
      const query = searchParams.q.toLowerCase().trim();
      const queryWords = query.split(/\s+/).filter(w => w.length > 0);

      const calculateScore = (course: any, q: string) => {
        let score = 0;
        const title = (course.title || "").toLowerCase().trim();
        const category = (course.category || "").toLowerCase();
        const tags = Array.isArray(course.tags) ? course.tags.join(" ").toLowerCase() : (course.tags || "").toLowerCase();
        const description = (course.description || "").toLowerCase();

        if (title === q) score += 10000;
        if (title.startsWith(q)) score += 8000;
        if (queryWords.length > 0 && queryWords.every(word => title.includes(word))) score += 7000;
        if (title.includes(q)) score += 5000;
        if (category.includes(q)) score += 3000;
        if (tags.includes(q)) score += 2500;
        if (description.includes(q)) score += 1000;

        return score;
      };

      courses = courses
        .map(course => ({ ...course, _score: calculateScore(course, query) }))
        .sort((a, b) => b._score - a._score || (b.enrolled_count || 0) - (a.enrolled_count || 0));

      courses = courses.slice(offset, offset + limit);
    }

    return {
      courses,
      pagination: {
        page,
        limit,
        hasMore: courses && courses.length === limit
      }
    };
  }

  // Separate helper for search suggestions bar
  static async searchInternships(q: string, limit = 2): Promise<any[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("internships")
      .select("id, title, slug, price, original_price, description")
      .eq("is_published", true)
      .ilike("title", `%${q}%`)
      .limit(limit);
    return (data || []).map(i => ({ ...i, course_type: "internship" }));
  }
}
