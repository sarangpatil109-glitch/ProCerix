import { NextResponse } from "next/server";
import { StorageAdapter } from "@/engines/ai-generation/pipeline/storage-adapter";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCourseSlug } from "@/engines/course/utils";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data", "courses");
    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ error: "No data directory found" }, { status: 404 });
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));
    
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: any[] = [];

    const supabase = createAdminClient();

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const payload = JSON.parse(content);

        // Check if course already exists
        const { data: existing } = await supabase
          .from("courses")
          .select("id")
          .eq("title", payload.title)
          .single();

        if (existing) {
          // If it exists, perform an update to prevent duplicates (Upsert)
          const slug = generateCourseSlug(payload.title);
          const { error: updateErr } = await supabase
            .from("courses")
            .update({
              slug,
              description: payload.description,
              difficulty: payload.difficulty,
              course_type: payload.course_type,
              is_published: true,
            } as any)
            .eq("id", existing.id);

          if (updateErr) {
            skipped++;
            errors.push({ file, error: updateErr.message });
          } else {
            updated++;
          }
        } else {
          // Does not exist, insert via StorageAdapter then publish
          const course = await StorageAdapter.persistGeneratedCourse(payload.title, payload);
          await supabase.from("courses").update({ is_published: true } as any).eq("id", course.id);
          inserted++;
        }
      } catch (err: any) {
        skipped++;
        errors.push({ file, error: err.message });
      }
    }

    return NextResponse.json({ 
      inserted,
      updated,
      skipped,
      errors
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
