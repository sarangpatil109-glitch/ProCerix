import { createAdminClient } from "@/lib/supabase/admin";
import { GeneratedCoursePayload } from "../interfaces/generation-payloads";
import { generateCourseSlug } from "@/engines/course/utils";
import { ProductRegistry } from "@/engines/registry/product-registry";

export class StorageAdapter {
  static async persistGeneratedCourse(skillName: string, payload: GeneratedCoursePayload) {
    const supabase = createAdminClient();

    // 1. Double check idempotency to avoid duplicates
    const { data: existing } = await supabase.from("courses").select("id").eq("title", payload.title).single();
    if (existing) throw new Error("Course already exists in database");

    const slug = generateCourseSlug(payload.title);

    // 2. Insert Course Transactionally via Supabase sequence
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .insert({
        title: payload.title,
        slug,
        description: payload.description,
        difficulty: payload.difficulty,
        course_type: payload.course_type,
        price: ProductRegistry.getProduct("certificate")!.defaultPrice,
        is_published: false // ALWAYS draft for CMS review
      } as any)
      .select().single();
    
    if (courseErr) throw courseErr;

    // 3. Insert Modules and Lessons
    for (const mod of payload.modules) {
      const { data: moduleData } = await supabase
        .from("learning_modules")
        .insert({
          course_id: course.id,
          title: mod.title,
          description: mod.description,
          sequence_order: mod.sequence_order
        } as any).select().single();

      if (moduleData) {
        const lessonsToInsert = mod.lessons.map(l => ({
          module_id: moduleData.id,
          title: l.title,
          content: l.content,
          sequence_order: l.sequence_order
        }));
        await supabase.from("lessons").insert(lessonsToInsert as any);
      }
    }

    // 4. Insert Assessment Engine Hooks (Quiz + MCQs)
    const { data: quizData } = await supabase
      .from("quizzes")
      .insert({
        title: `${payload.title} Final Assessment`,
        passing_score: 70
      } as any).select().single();

    if (quizData) {
      // Attach the quiz to the last module dynamically
      const { data: lastModule } = await (supabase as any).from("learning_modules").select("id").eq("course_id", course.id).order("sequence_order", { ascending: false }).limit(1).single();
      
      if (lastModule) {
        await supabase.from("quizzes").update({ module_id: lastModule.id } as any).eq("id", quizData.id);
      }

      for (let i = 0; i < payload.mcqs.length; i++) {
        const mcq = payload.mcqs[i];
        const { data: qData } = await supabase.from("questions").insert({
          quiz_id: quizData.id,
          content: mcq.question,
          type: "single_choice",
          points: mcq.points,
          sequence_order: i + 1
        } as any).select().single();

        if (qData) {
          const optionsToInsert = mcq.options.map(opt => ({
            question_id: qData.id,
            content: opt.content,
            is_correct: opt.is_correct
          }));
          await supabase.from("options").insert(optionsToInsert as any);
        }
      }
    }

    // 5. Insert Internship Tasks if applicable
    if (payload.course_type === "internship" && payload.tasks) {
      const { data: internshipData } = await supabase.from("internships").insert({
        title: `${payload.title} Virtual Internship`,
        company_name: "ProCerix Partners",
        description: `Practical application for ${payload.title}`,
        is_active: true
      } as any).select().single();

      if (internshipData) {
        const tasksToInsert = payload.tasks.map(t => ({
          internship_id: internshipData.id,
          title: t.title,
          description: t.description,
          sequence_order: t.sequence_order
        }));
        await supabase.from("internship_tasks").insert(tasksToInsert as any);
      }
    }

    return course;
  }
}
