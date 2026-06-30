import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PRICING } from "@/lib/pricing/defaults";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const courses = [
    "Financial Accounting Fundamentals",
    "Tally Prime Complete Course",
    "GST Practitioner Basics",
    "Income Tax Fundamentals",
    "Personal Finance & Budgeting",
    "Stock Market for Beginners",
    "Mutual Funds Masterclass",
    "Investment Analysis Fundamentals",
    "Financial Statement Analysis",
    "Banking Operations Fundamentals",
    "HR Management Fundamentals",
    "Payroll Management",
    "Labour Law Essentials",
    "Performance Management",
    "Employee Engagement Strategies",
    "Recruitment Interview Skills",
    "ATS Resume Writing Masterclass",
    "Interview Preparation Masterclass",
    "Corporate Communication Skills",
    "Business Email Writing",
    "Canva for Business",
    "Figma UI Design Fundamentals",
    "Adobe Photoshop Basics",
    "UI/UX Design Fundamentals",
    "Design Thinking Fundamentals"
  ];

  try {
    for (const title of courses) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const { data: existing } = await supabase
        .from("courses")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        continue;
      }

      const courseId = crypto.randomUUID();

      const { error: courseError } = await supabase.from("courses").insert({
        id: courseId,
        title,
        slug,
        description: `Learn the essentials and advanced techniques of ${title}. This premium course provides hands-on practical experience for professionals looking to upskill rapidly in their career.`,
        course_type: "certificate",
        is_published: true,
        ...PRICING.certificate,
        difficulty: title.includes("Advanced") || title.includes("Masterclass") || title.includes("Complete Course") ? "advanced" : title.includes("Fundamentals") || title.includes("Basics") || title.includes("Beginners") ? "beginner" : "intermediate",
        category: title.includes("Financial") || title.includes("Accounting") || title.includes("Tax") || title.includes("Stock") || title.includes("Mutual Funds") || title.includes("Investment") || title.includes("Banking") || title.includes("Tally") ? "Finance & Accounting" : title.includes("HR") || title.includes("Payroll") || title.includes("Labour Law") || title.includes("Employee") || title.includes("Performance") ? "Human Resources" : title.includes("Recruitment") || title.includes("Interview") || title.includes("Resume") || title.includes("Communication") || title.includes("Email") ? "Career & Communication" : title.includes("Design") || title.includes("Canva") || title.includes("Figma") || title.includes("Photoshop") || title.includes("UI/UX") ? "Design & Creativity" : "Professional Skills"
      });

      if (courseError) {
        return NextResponse.json({ success: false, title, error: courseError });
      }

      for (let m = 1; m <= 6; m++) {
        const moduleId = crypto.randomUUID();
        const { error: modError } = await supabase.from("learning_modules").insert({
          id: moduleId,
          course_id: courseId,
          title: `Module ${m}: ${title} Concepts`,
          description: `Deep dive into module ${m} of ${title}.`,
          sequence_order: m
        });

        if (!modError) {
          for (let l = 1; l <= 4; l++) {
            await supabase.from("lessons").insert({
              id: crypto.randomUUID(),
              module_id: moduleId,
              title: `Lesson ${l}: Practical Application`,
              sequence_order: l
            });
          }
        } else {
          return NextResponse.json({ success: false, title, modError });
        }
      }
    }

    const { data: coursesData } = await supabase.from('courses').select('title');
    return NextResponse.json({ success: true, count: coursesData?.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
