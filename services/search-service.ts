import { CourseService } from "@/services/course-service";
import { generateVirtualCourse } from "@/engines/generation/virtual";
import { ProductRegistry } from "@/engines/registry/product-registry";
import { SemanticSearchEngine } from "@/engines/search/semantic-engine";

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
    const repo = await CourseService.getRepository();

    // 1. If searching for specific course types or no specific type
    if (!searchParams.type || searchParams.type === "certificate" || searchParams.type === "internship") {
      const dbCourses = await repo.getCourses({
        status: "published",
        search: searchParams.q,
        category: searchParams.category,
        courseType: searchParams.type as any,
        difficulty: searchParams.difficulty,
        isFree: searchParams.free === "true" ? true : (searchParams.free === "false" ? false : undefined),
        sort: searchParams.sort,
        limit: searchParams.q ? 1000 : limit,
        offset: searchParams.q ? 0 : offset,
      });
      courses = [...(dbCourses || [])];
    }



    // Apply Scoring
    if (searchParams.q) {
      const query = searchParams.q.toLowerCase().trim();
      const queryWords = query.split(/\s+/).filter(w => w.length > 0);

      const calculateScore = (course: any, q: string) => {
        let score = 0;
        const title = (course.title || course.name || "").toLowerCase().trim();
        const category = (course.category || "").toLowerCase();
        const tags = Array.isArray(course.tags) ? course.tags.join(" ").toLowerCase() : (course.tags || "").toLowerCase();
        const description = (course.description || "").toLowerCase();

        if (title === q) score += 10000;
        if (title.startsWith(q)) score += 8000;
        
        if (queryWords.length > 0 && queryWords.every(word => title.includes(word))) {
          score += 7000;
        }
        
        if (title.includes(q)) score += 5000;
        if (category.includes(q)) score += 3000;
        if (tags.includes(q)) score += 2500;
        if (description.includes(q)) score += 1000;

        return score;
      };

      courses = courses.map(course => ({
        ...course,
        _score: calculateScore(course, query)
      })).sort((a, b) => {
        if (a._score !== b._score) return b._score - a._score;
        const popA = a.enrolled_count || a.students || 0;
        const popB = b.enrolled_count || b.students || 0;
        return popB - popA;
      });

      courses = courses.slice(offset, offset + limit);
    }

    console.log("SEARCH SERVICE USED");
    console.log(courses.map(c => c.title));

    return {
      courses,
      pagination: {
        page,
        limit,
        hasMore: courses && courses.length === limit
      }
    };
  }
}
