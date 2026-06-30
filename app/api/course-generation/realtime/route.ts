import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDefaultPricing, PRICING } from "@/lib/pricing/defaults";

const systemPrompt = `You are an expert AI curriculum designer. Generate a highly detailed, premium course in strictly valid JSON format.
The user will provide a topic.

Your JSON output MUST match this exact structure:
{
  "course": {
    "title": "A premium, catchy title",
    "slug": "url-friendly-slug",
    "description": "2-3 sentences of highly engaging description",
    "category": "A relevant category (e.g., Programming, Design, Business)",
    "difficulty": "Beginner, Intermediate, or Advanced",
    "duration": "e.g., 4 Weeks",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "What this module covers",
      "order_index": 1,
      "lessons": [
        { "title": "Lesson 1", "description": "Details", "order_index": 1 }
      ]
    }
  ],
  "faqs": [
    { "question": "Q1", "answer": "A1" }
  ]
}

Ensure the course is comprehensive (at least 3 modules, 3 lessons each).
DO NOT include markdown block markers (like json). Output raw JSON.`;

export async function POST(req: Request) {
  try {
    const { query, type = "certificate" } = await req.json();
    if (!query) {
      return NextResponse.json({ success: false, error: "Missing query" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const isInternship = type === "internship";

    // 1. Check if content already exists to prevent duplicate generation
    const slugQuery = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (isInternship) {
      const { data: existing } = await adminClient
        .from("internships")
        .select("slug")
        .ilike("title", `%${query}%`)
        .limit(1)
        .maybeSingle();
      if (existing?.slug) {
        return NextResponse.json({ success: true, slug: existing.slug, type: "internship" });
      }
    } else {
      const { data: existing } = await adminClient
        .from("courses")
        .select("slug")
        .ilike("title", `%${query}%`)
        .limit(1)
        .maybeSingle();
      if (existing?.slug) {
        return NextResponse.json({ success: true, slug: existing.slug, type: "certificate" });
      }
    }

    // 2. Generate Content JSON via Gemini REST API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nTopic: ${query}\nTarget Type: ${isInternship ? "Virtual Internship with practical tasks" : "Online Course"}` }] }
        ],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      throw new Error("Gemini API failed");
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      console.error("Gemini API returned invalid data structure:", JSON.stringify(data));
      throw new Error("Invalid AI response");
    }

    const cleanedContent = rawContent.replace(/^\s*```(?:json)?/, "").replace(/```\s*$/, "").trim();
    let generated;
    try {
      generated = JSON.parse(cleanedContent);
    } catch (parseError: any) {
      console.error("Failed to parse JSON:", parseError.message);
      throw new Error("Failed to parse AI output as JSON");
    }

    const uniqueSlug = `${generated.course.slug}-${Date.now().toString().slice(-4)}`;

    // 3A. Internship → save to internships table only
    if (isInternship) {
      const { data: newInternship, error: internshipError } = await adminClient
        .from("internships")
        .insert({
          title: generated.course.title,
          slug: uniqueSlug,
          description: generated.course.description,
          company_name: "ProCerix",
          category: generated.course.category,
          ...PRICING.internship,
          is_published: true,
        })
        .select()
        .single();

      if (internshipError) {
        console.error("Supabase Internship Insert Error:", internshipError);
        throw internshipError;
      }

      return NextResponse.json({ success: true, slug: newInternship.slug, type: "internship" });
    }

    // 3B. Certificate → save to courses table
    const { data: newCourse, error: courseError } = await adminClient
      .from("courses")
      .insert({
        title: generated.course.title,
        slug: uniqueSlug,
        description: generated.course.description,
        course_type: "certificates",
        ...getDefaultPricing("certificates"),
        is_published: true,
      })
      .select()
      .single();

    if (courseError) {
      console.error("Supabase Course Insert Error:", courseError);
      throw courseError;
    }

    // 4. Insert modules for certificate courses
    if (generated.modules && Array.isArray(generated.modules)) {
      for (const mod of generated.modules) {
        await adminClient
          .from("modules")
          .insert({
            course_id: newCourse.id,
            title: mod.title,
            description: mod.description,
            order_index: mod.order_index
          });
      }
    }

    return NextResponse.json({ success: true, slug: newCourse.slug, type: "certificate" });
  } catch (error: any) {
    console.error("AI Generation API Error Stack:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
