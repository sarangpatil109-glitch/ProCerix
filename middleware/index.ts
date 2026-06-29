import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function handleMiddleware(request: NextRequest) {
  // Common middleware logic can be added here
  return await updateSession(request);
}
