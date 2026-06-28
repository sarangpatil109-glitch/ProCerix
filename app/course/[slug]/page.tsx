import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCachedCourseBySlug } from "@/engines/course/cache";
import { LearningService } from "@/services/learning-service";
import { generateVirtualCourseFromSlug, generateVirtualCurriculum } from "@/engines/generation/virtual";
import { CourseHero } from "@/components/course/course-hero";
import { CourseCurriculum } from "@/components/course/course-curriculum";
import { CourseStickyCard } from "@/components/course/course-sticky-card";
import { generateCourseMetadata } from "@/engines/course/metadata";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const realCourse = await getCachedCourseBySlug(params.slug).catch(() => null);
  const course = realCourse || generateVirtualCourseFromSlug(params.slug);
  return generateCourseMetadata(course as any);
}

import { createClient } from "@/lib/supabase/server";

export default async function CourseDetailsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let course: any;
  let curriculum: any = [];
  
  const realCourse = await getCachedCourseBySlug(params.slug).catch(() => null);

  if (realCourse) {
    course = realCourse;
    curriculum = await LearningService.getCourseContent(realCourse.id).catch(() => []);
  } else {
    // Virtual Dynamic Discovery
    course = generateVirtualCourseFromSlug(params.slug);
    curriculum = generateVirtualCurriculum(course.title);
  }

  if (!course) {
    notFound(); 
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black selection:bg-blue-500/30">
      <CourseHero course={course} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-16">
            
            {/* Overview */}
            <section className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">About this course</h2>
              <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
                <p>{course.description}</p>
                <p>
                  Whether you are looking to start a new career or advance your current skills, this comprehensive {course.course_type || "program"} is designed to provide you with industry-aligned expertise and real-world experience.
                </p>
              </div>
            </section>

            {/* Curriculum */}
            <section className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Curriculum</h2>
              <CourseCurriculum modules={curriculum} />
            </section>

            {/* Instructor */}
            <section className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Instructor</h2>
              <div className="flex items-start gap-6 p-6 md:p-8 bg-white dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg">
                  P
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">ProCerix Expert Team</h3>
                  <p className="text-blue-600 dark:text-blue-400 font-medium">Industry Professionals</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our curriculum is crafted by leading experts in the industry, ensuring you learn the most current and sought-after skills with practical applications.
                  </p>
                </div>
              </div>
            </section>
            
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CourseStickyCard course={course} userId={user?.id} email={user?.email} />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
