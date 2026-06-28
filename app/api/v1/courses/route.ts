import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

async function getCoursesHandler(req: any, ctx: any, auth: any) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");
  
  const supabase = await createClient();
  const { data: courses, error, count } = await supabase
    .from("courses")
    .select("id, title, slug, description, course_type, is_published, created_at", { count: "exact" })
    .eq("is_published", true)
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return NextResponse.json({
    data: courses,
    meta: { total: count, limit, offset }
  });
}

export const GET = withApiAuth(getCoursesHandler);
