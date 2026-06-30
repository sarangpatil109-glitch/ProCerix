import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductRegistry } from "@/engines/registry/product-registry";

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
    "price": 499,
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
DO NOT include markdown block markers (like \`\`\`json). Output raw JSON.`;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ success: false, error: "Missing query" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Check if course already exists to prevent duplicate generation
    const slugQuery = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const { data: existing } = await adminClient
      .from("courses")
      .select("slug")
      .ilike("title", `%${query}%`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, slug: existing.slug });
    }

    // 2. Generate Course JSON via Gemini REST API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nTopic: ${query}` }] }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error("Gemini API failed");
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawContent) {
      throw new Error("Invalid AI response");
    }

    const generated = JSON.parse(rawContent);

    // 3. Save to Supabase
    // A. Course
    const uniqueSlug = `${generated.course.slug}-${Date.now().toString().slice(-4)}`;
    
    // Auto-generate placeholder banner
    const placeholderThumbnail = `https://placehold.co/1200x600/1E3A8A/FFFFFF?text=${encodeURIComponent(generated.course.title)}`;
    
    const { data: newCourse, error: courseError } = await adminClient
      .from("courses")
      .insert({
        title: generated.course.title,
        slug: uniqueSlug,
        description: generated.course.description,
        category: generated.course.category,
        difficulty: generated.course.difficulty,
        duration: generated.course.duration,
        price: generated.course.price || 499,
        tags: generated.course.tags || [],
        thumbnail: placeholderThumbnail,
        course_type: "certificates",
        is_published: true // Immediately publish as per requirements
      })
      .select()
      .single();

    if (courseError) throw courseError;

    // B. Modules and Lessons
    if (generated.modules && Array.isArray(generated.modules)) {
      for (const mod of generated.modules) {
        const { data: newMod } = await adminClient
          .from("modules")
          .insert({
            course_id: newCourse.id,
            title: mod.title,
            description: mod.description,
            order_index: mod.order_index
          })
          .select()
          .single();

        // If your schema has lessons table, you'd insert them here, else ignore
        // Assuming no complex lesson nesting for now if table doesn't exist
      }
    }

    // C. You can store FAQs or metadata in a JSONB column or separate table if it exists.

    return NextResponse.json({ success: true, slug: newCourse.slug });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
