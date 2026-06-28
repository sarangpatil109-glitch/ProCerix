import { CourseService } from "@/services/course-service";
import { generateVirtualCourse } from "@/engines/generation/virtual";
import { ProductRegistry } from "@/engines/registry/product-registry";

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
        limit,
        offset,
      });
      courses = [...(dbCourses || [])];
    }

    // 2. Search Registry Products (Resume, LinkedIn, HR)
    if (page === 1) { // Only append products on first page
      const registryProducts = ProductRegistry.getAllProducts().filter(p => p.id !== "certificate" && p.id !== "internship");
      
      let matchedProducts = registryProducts;
      
      if (searchParams.type) {
        matchedProducts = matchedProducts.filter(p => p.id === searchParams.type);
      }
      
      if (searchParams.q) {
        const q = searchParams.q.toLowerCase();
        matchedProducts = matchedProducts.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.features.some(f => f.toLowerCase().includes(q))
        );
      }

      // Map products to look somewhat like courses for UI compatibility
      const formattedProducts = matchedProducts.map(p => ({
        id: p.id,
        title: p.name,
        slug: p.slug,
        description: p.features.join(", "),
        course_type: p.id,
        price: p.defaultPrice,
        currency: "INR",
        is_published: true,
        isVirtualProduct: true, // Flag for UI
        marketing_route: p.routes.marketing
      }));
      
      courses = [...formattedProducts, ...courses];
    }

    // 3. FEATURE 10: Dynamic Course Discovery (Only if no results and searching for courses/internships)
    if (courses.length === 0 && searchParams.q && page === 1 && (!searchParams.type || searchParams.type === "certificate" || searchParams.type === "internship")) {
      const virtualCourse = generateVirtualCourse(searchParams.q);
      courses = [virtualCourse as any];
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
}
