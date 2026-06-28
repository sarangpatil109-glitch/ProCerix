import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

async function getInternshipsHandler(req: any, ctx: any, auth: any) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("internship_submissions")
    .select("*, tasks(*)")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return NextResponse.json({ data });
}

export const GET = withApiAuth(getInternshipsHandler);
