import { NextResponse } from "next/server";
import { SearchService } from "@/services/search-service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  
  if (!q || q.length < 2) {
    return NextResponse.json({ courses: [], internships: [] });
  }

  // We reuse the existing search service which now uses Semantic Engine
  const result = await SearchService.searchCourses({ q, page: "1" });
  
  const courses = result.courses.filter((c: any) => c.course_type !== "internship").slice(0, 4);
  const internships = result.courses.filter((c: any) => c.course_type === "internship").slice(0, 2);

  return NextResponse.json({ courses, internships });
}
