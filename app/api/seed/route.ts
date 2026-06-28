import { NextResponse } from "next/server";
import { StorageAdapter } from "@/engines/ai-generation/pipeline/storage-adapter";
import { createClient } from "@/lib/supabase/server";
import { generateCourseSlug } from "@/engines/course/utils";
import fs from "fs";
import path from "path";

const FOLDER_MAPPING = [
  { folder: "courses", key: "courses" },
  { folder: "internships", key: "internships" },
  { folder: "certificates", key: "certificates" },
  { folder: "resume-templates", key: "resumeTemplates" },
  { folder: "linkedin-templates", key: "linkedinTemplates" },
  { folder: "interview-questions", key: "interviewQuestions" },
  { folder: "career-roadmaps", key: "careerRoadmaps" }
];

export async function GET() {
  try {
    const supabase = await createClient();
    const responseSummary: any = {};

    // Initialize the response structure
    for (const mapping of FOLDER_MAPPING) {
      responseSummary[mapping.key] = { inserted: 0, updated: 0, skipped: 0 };
    }

    for (const mapping of FOLDER_MAPPING) {
      const dataDir = path.join(process.cwd(), "data", mapping.folder);
      
      if (!fs.existsSync(dataDir)) {
        continue;
      }

      const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));

      for (const file of files) {
        const filePath = path.join(dataDir, file);
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const payload = JSON.parse(content);

          // Check if it already exists
          const { data: existing } = await supabase
            .from("courses")
            .select("id")
            .eq("title", payload.title)
            .single();

          if (existing) {
            // Upsert (Update)
            const slug = generateCourseSlug(payload.title);
            const { error: updateErr } = await supabase
              .from("courses")
              .update({
                slug,
                description: payload.description,
                difficulty: payload.difficulty,
                course_type: payload.course_type
              } as any)
              .eq("id", existing.id);
              
            if (updateErr) {
              responseSummary[mapping.key].skipped++;
              console.log(`[Seed Engine] Failed to update: ${file} in ${mapping.folder}. Error: ${updateErr.message}`);
            } else {
              responseSummary[mapping.key].updated++;
              console.log(`[Seed Engine] Updated: ${file} in ${mapping.folder}`);
            }
          } else {
            // Insert
            const course = await StorageAdapter.persistGeneratedCourse(payload.title, payload);
            responseSummary[mapping.key].inserted++;
            console.log(`[Seed Engine] Inserted: ${file} in ${mapping.folder} (ID: ${course.id})`);
          }
        } catch (err: any) {
          responseSummary[mapping.key].skipped++;
          console.log(`[Seed Engine] Skipped/Error: ${file} in ${mapping.folder}. Error: ${err.message}`);
        }
      }
    }

    return NextResponse.json(responseSummary);
  } catch (error: any) {
    console.error("[Seed Engine] Critical Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
