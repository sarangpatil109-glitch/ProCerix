import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseEditorClient } from "./CourseEditorClient";
import { LearningService } from "@/services/learning-service";

export default async function EditCoursePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", params.id).single();
  if (!course) notFound();

  // Fetch full curriculum (Modules & Lessons)
  const curriculum = await LearningService.getCourseContent(course.id);
  
  // Fetch quizzes/MCQs
  const moduleIds = curriculum.map((m: any) => m.id);
  let quizzes: any[] = [];
  if (moduleIds.length > 0) {
    const { data: qData } = await supabase.from("quizzes").select("*, questions(*, options(*))").in("module_id", moduleIds);
    quizzes = qData || [];
  }

  // Fetch internship tasks if applicable
  let tasks: any[] = [];
  if (course.course_type === "internship") {
     const { data: internshipData } = await supabase.from("internships").select("id").eq("title", `${course.title} Virtual Internship`).single();
     if (internshipData) {
       const { data: tasksData } = await supabase.from("internship_tasks").select("*").eq("internship_id", internshipData.id);
       tasks = tasksData || [];
     }
  }

  return (
    <div className="space-y-6">
      <CourseEditorClient 
        course={course} 
        curriculum={curriculum} 
        quizzes={quizzes} 
        tasks={tasks} 
      />
    </div>
  );
}
