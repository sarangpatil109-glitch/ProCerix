import { NextResponse } from "next/server";
import { SearchService } from "@/services/search-service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (!q || q.length < 2) {
    return NextResponse.json({ courses: [], internships: [] });
  }

  const [courseResult, internships] = await Promise.all([
    SearchService.searchCourses({ q, page: "1" }),
    SearchService.searchInternships(q, 2),
  ]);

  const courses = courseResult.courses.slice(0, 4);

  return NextResponse.json({ courses, internships });
}
