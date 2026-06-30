import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    // 1. Verify Environment Variables
    const missingVars = [];
    if (!process.env.SUPABASE_URL) missingVars.push("SUPABASE_URL");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
    
    if (missingVars.length > 0) {
      console.error("Missing Environment Variables:", missingVars);
      return NextResponse.json({
        success: false,
        code: "MISSING_ENV",
        message: "Server is missing required environment variables",
        details: missingVars,
        hint: "Check your .env.local file"
      }, { status: 500 });
    }

    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({
        success: false,
        code: "MISSING_QUERY",
        message: "Missing query parameter",
        details: null,
        hint: "Provide a valid topic in the request body"
      }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "User must be logged in to request course generation",
        details: null,
        hint: "Pass valid authentication cookies"
      }, { status: 401 });
    }

    const adminClient = createAdminClient();
    
    // Generate a unique slug based on query and timestamp to prevent unique constraint errors
    const baseSlug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    // Compare inserted field with the real database columns from generation_queue.sql
    // Table: course_generation_requests
    // Columns: id, skill_name, slug, status, payment_count, requested_by, course_id, started_at, completed_at, failed_reason, created_at, updated_at
    const { error } = await adminClient.from("course_generation_requests").insert({
      skill_name: query,
      slug: uniqueSlug,
      requested_by: user.id,
      status: "pending"
    });

    if (error) {
      console.error("Course Generation Insert Error:");
      console.error("error.code:", error.code);
      console.error("error.message:", error.message);
      console.error("error.details:", error.details);
      console.error("error.hint:", error.hint);
      
      return NextResponse.json({ 
        success: false,
        code: error.code || "DB_ERROR",
        message: error.message || "Failed to create course generation request",
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Server Error:", e);
    return NextResponse.json({ 
      success: false,
      code: "INTERNAL_ERROR",
      message: e.message || "Internal server error occurred",
      details: e.toString(),
      hint: "Check server logs for more details"
    }, { status: 500 });
  }
}
