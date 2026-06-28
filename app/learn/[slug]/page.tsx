import { redirect, notFound } from "next/navigation";
import { CourseService } from "@/services/course-service";
import { LearningService } from "@/services/learning-service";

export default async function LearnRedirectPage({ params }: { params: { slug: string } }) {
  const courseRepo = await CourseService.getRepository();
  const course = await courseRepo.getCourseBySlug(params.slug).catch(() => null);

  if (!course) notFound();

  const curriculum = await LearningService.getCourseContent(course.id);
  
  const firstLesson = curriculum?.[0]?.lessons?.[0];

  if (firstLesson) {
    redirect(`/learn/${params.slug}/${firstLesson.id}`);
  } else {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-gray-500">
        This course doesn't have any lessons yet.
      </div>
    );
  }
}
