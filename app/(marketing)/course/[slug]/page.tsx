import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCachedCourseBySlug } from "@/engines/course/cache";
import { generateVirtualCourseFromSlug } from "@/engines/generation/virtual";
import { CourseHero } from "@/components/course/course-hero";
import { CourseStickyCard } from "@/components/course/course-sticky-card";
import { generateCourseMetadata } from "@/engines/course/metadata";
import { ProductRegistry, ProductType } from "@/engines/registry/product-registry";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, Star, Award, Briefcase, Zap, Smartphone, Users, ChevronDown, Clock, Shield } from "lucide-react";
import Image from "next/image";
import { CertificatePreview } from "@/components/course/CertificatePreview";
import { CourseMobileCTA } from "@/components/course/course-mobile-cta";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const realCourse = await getCachedCourseBySlug(params.slug).catch(() => null);
  const course = realCourse || generateVirtualCourseFromSlug(params.slug);
  return generateCourseMetadata(course as any);
}

const WHY_CHOOSE = [
  { title: "Industry-ready curriculum", icon: <Briefcase className="w-6 h-6 text-blue-500" /> },
  { title: "Beginner friendly", icon: <Users className="w-6 h-6 text-indigo-500" /> },
  { title: "Practical projects", icon: <Zap className="w-6 h-6 text-yellow-500" /> },
  { title: "Lifetime access", icon: <Clock className="w-6 h-6 text-green-500" /> },
  { title: "Certificate included", icon: <Award className="w-6 h-6 text-purple-500" /> },
  { title: "Mobile & Desktop access", icon: <Smartphone className="w-6 h-6 text-pink-500" /> }
];

const WHO_ENROLL = [
  { title: "Students", desc: "Gain practical skills to stand out." },
  { title: "Freshers", desc: "Land your first job confidently." },
  { title: "Working Professionals", desc: "Upskill for faster promotions." },
  { title: "Career Switchers", desc: "Transition into a high-growth role." }
];

const CAREER_OUTCOMES = [
  { title: "Job Ready", icon: <Briefcase className="w-8 h-8 text-blue-500 mb-3" /> },
  { title: "Resume Boost", icon: <Star className="w-8 h-8 text-yellow-500 mb-3" /> },
  { title: "Certificate", icon: <Award className="w-8 h-8 text-purple-500 mb-3" /> },
  { title: "Interview Prep", icon: <Users className="w-8 h-8 text-green-500 mb-3" /> }
];

const FAQS = [
  { q: "Do I get a certificate upon completion?", a: "Yes, you will receive a verifiable digital certificate that you can share on LinkedIn." },
  { q: "Is this course beginner-friendly?", a: "Absolutely. We start from the basics and progressively move to advanced topics." },
  { q: "How long do I have access to the materials?", a: "You get lifetime access to all course materials, including future updates." },
  { q: "Can I access the course on my mobile?", a: "Yes, the platform is fully optimized for mobile, tablet, and desktop viewing." },
  { q: "Are there any prerequisites?", a: "No prior experience is strictly required, though a basic understanding of computers helps." },
  { q: "Is there a refund policy?", a: "We offer a 7-day money-back guarantee if you are not satisfied with the course content." },
  { q: "Will I build real-world projects?", a: "Yes, our curriculum heavily focuses on hands-on practical projects to build your portfolio." },
  { q: "How do I get help if I am stuck?", a: "We provide dedicated community support where you can ask questions and get answers from experts." }
];

export default async function CourseDetailsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let course: any;
  const realCourse = await getCachedCourseBySlug(params.slug).catch(() => null);

  if (realCourse) {
    course = realCourse;
  } else {
    course = generateVirtualCourseFromSlug(params.slug);
  }

  if (!course) notFound();

  const registryProduct = ProductRegistry.getProduct(course.course_type as ProductType);
  if (registryProduct) {
    course = { ...course, price: registryProduct.defaultPrice };
  }

  const generatedLearnings = [
    `Understand the fundamentals of ${course.category || course.title}`,
    "Build real-world projects from scratch",
    "Master industry-standard tools and techniques",
    "Learn best practices for professional development",
    "Develop a portfolio to showcase your skills",
    "Prepare for technical interviews with confidence",
    "Apply problem-solving strategies to complex scenarios",
    "Gain hands-on experience with modern frameworks",
    "Understand advanced concepts and architectures",
    "Receive a verified certificate of completion"
  ];
  const learningOutcomes = course.learning_outcomes?.length > 0 ? course.learning_outcomes : generatedLearnings;
  
  const generatedSkills = course.title.split(" ").filter((w: string) => w.length > 3).slice(0, 6);
  const skills = course.tags?.length > 0 ? course.tags : generatedSkills.length > 0 ? generatedSkills : ["Fundamentals", "Practical Application", "Problem Solving"];

  return (
    <>
      <CourseHero course={course} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative pb-32">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-20 order-2 lg:order-1">
            
            {/* Overview */}
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">About this course</h2>
              <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
                <p>{course.description}</p>
                <p>
                  Whether you are looking to start a new career or advance your current skills, this comprehensive {course.course_type || "program"} is designed to provide you with industry-aligned expertise and real-world experience.
                </p>
              </div>
            </section>

            {/* Why Choose This Course */}
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Why Choose This Course?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {WHY_CHOOSE.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-800">
                      {item.icon}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* What You'll Learn */}
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">What You'll Learn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {learningOutcomes.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills You'll Gain */}
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Skills You'll Gain</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, i: number) => (
                  <span key={i} className="px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-sm border border-blue-100 dark:border-blue-800">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* Who Should Enroll */}
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Who Should Enroll?</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {WHO_ENROLL.map((item, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-800 text-center flex flex-col items-center justify-center">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Career Outcomes */}
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Career Outcomes</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {CAREER_OUTCOMES.map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:-translate-y-1 transition-transform">
                    {item.icon}
                    <span className="font-bold text-gray-900 dark:text-white">{item.title}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Certificate Preview */}
            <section className="space-y-8 bg-gray-900 text-white p-8 md:p-12 rounded-3xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Earn Your Certificate</h2>
                  <p className="text-gray-300 mb-6">Showcase your skills with a verifiable digital certificate. Share it on LinkedIn and add it to your resume.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400" /> Verifiable link</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400" /> High-resolution PDF</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400" /> Official ProCerix Credential</li>
                  </ul>
                </div>
                <CertificatePreview />
              </div>
            </section>

            {/* Student Reviews */}
            <section className="space-y-8">
              <div className="flex items-end justify-between">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Student Reviews</h2>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current opacity-80" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">4.8 Average Rating</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: "Rahul S.", role: "Software Engineer", text: "This course completely changed my career trajectory. The practical projects were exactly what I needed." },
                  { name: "Priya M.", role: "Data Analyst", text: "Incredibly well-structured. The instructor breaks down complex topics effortlessly. Highly recommend!" },
                  { name: "Amit K.", role: "Student", text: "The lifetime access is a game-changer. I keep coming back to reference the materials." },
                  { name: "Sneha R.", role: "Career Switcher", text: "I landed my first job within 2 months of completing this course. The certificate really helped!" }
                ].map((review, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-1 text-yellow-500 mb-4">
                      <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 italic mb-6">"{review.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{review.name}</h4>
                        <p className="text-xs text-gray-500">{review.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section className="space-y-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {FAQS.map((faq, i) => (
                  <details key={i} className="group p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between cursor-pointer font-bold text-gray-900 dark:text-white text-lg">
                      {faq.q}
                      <span className="transition group-open:rotate-180">
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      </span>
                    </summary>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
            
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2 relative z-20">
            <div className="lg:sticky lg:top-[100px] space-y-6">
              <CourseStickyCard course={course} userId={user?.id} />
              
              {/* Urgency Section */}
              <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
                <div className="flex items-center gap-3 mb-4">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-100">523+ students enrolled recently</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <Shield className="w-4 h-4 text-green-500" /> 7-Day Money-Back Guarantee
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Clock className="w-4 h-4 text-orange-500" /> Recently Updated Content
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Mobile Sticky CTA */}
      <CourseMobileCTA course={course} userId={user?.id} />
    </>
  );
}
