import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const db = createAdminClient();
  const { data } = await db.from("courses").select("id, slug, is_published, course_type");
  return NextResponse.json(data);
}
