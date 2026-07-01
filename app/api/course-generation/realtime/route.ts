import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDefaultPricing, PRICING } from "@/lib/pricing/defaults";

// ─── Prompts ──────────────────────────────────────────────────────────────────

const CERT_PROMPT = `You are an expert curriculum designer for a premium online certification platform.
Generate a complete, professional certification course with rich article content.

Output ONLY valid JSON matching this exact structure (no markdown, no code fences):

{
  "course": {
    "title": "Precise, professional course title",
    "slug": "url-friendly-slug",
    "description": "2-3 sentences of engaging, benefit-driven description",
    "category": "Relevant category (Programming, Design, Business, Marketing, etc.)",
    "difficulty": "Beginner | Intermediate | Advanced",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "modules": [
    {
      "title": "Module 1: <descriptive title>",
      "description": "One sentence on what this module covers",
      "order_index": 1,
      "lesson": {
        "title": "Article title matching the module",
        "content": "<full HTML article, 800–1200 words, with <h2> subheadings, <p> paragraphs, <ul>/<ol> lists, <strong> emphasis, <blockquote> for key insights. Professional, educational tone.>",
        "estimated_reading_time": 8
      }
    }
  ],
  "final_quiz": {
    "title": "Final Assessment",
    "passing_score": 70,
    "questions": [
      {
        "content": "Question text ending with ?",
        "sequence_order": 1,
        "options": [
          { "content": "Option A", "is_correct": false },
          { "content": "Option B", "is_correct": true },
          { "content": "Option C", "is_correct": false },
          { "content": "Option D", "is_correct": false }
        ]
      }
    ]
  },
  "faqs": [
    { "question": "Relevant FAQ question?", "answer": "Detailed answer." }
  ]
}

Rules:
- Generate exactly 4 modules (or 5 for a rich topic), each with exactly 1 lesson article
- Each article MUST be 800–1200 words of real educational content in valid HTML
- Generate exactly 10 MCQ questions in final_quiz, each with exactly 4 options, exactly 1 correct
- DO NOT include video_url anywhere
- DO NOT include markdown code fences`;

const INTERNSHIP_PROMPT = `You are an expert curriculum designer for a premium virtual internship platform.
Generate a complete virtual internship program with rich article modules and practical tasks.

Output ONLY valid JSON matching this exact structure (no markdown, no code fences):

{
  "course": {
    "title": "Professional internship program title",
    "slug": "url-friendly-slug",
    "description": "2-3 sentences describing the internship experience and what the intern will achieve",
    "category": "Relevant category",
    "difficulty": "Beginner | Intermediate | Advanced",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "modules": [
    {
      "title": "Module 1: Introduction & Overview",
      "description": "One sentence on what this module covers",
      "order_index": 1,
      "lesson": {
        "title": "Article title matching the module",
        "content": "<full HTML article, 800–1200 words, with <h2> subheadings, <p> paragraphs, <ul>/<ol> lists, <strong> emphasis. Educational, practical tone.>",
        "estimated_reading_time": 8
      }
    }
  ],
  "final_quiz": {
    "title": "Final Assessment Quiz",
    "passing_score": 70,
    "questions": [
      {
        "content": "Question text ending with ?",
        "sequence_order": 1,
        "options": [
          { "content": "Option A", "is_correct": false },
          { "content": "Option B", "is_correct": true },
          { "content": "Option C", "is_correct": false },
          { "content": "Option D", "is_correct": false }
        ]
      }
    ]
  },
  "faqs": [
    { "question": "Relevant FAQ question?", "answer": "Detailed answer." }
  ]
}

Rules:
- Generate exactly 5 modules: Introduction, then 4 domain-specific modules
- Each module must have exactly 1 lesson article of 800–1200 words of real HTML content
- Generate exactly 10 MCQ questions in final_quiz
- DO NOT include video_url anywhere
- DO NOT include markdown code fences`;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { query, type = "certificate" } = await req.json();
    if (!query) {
      return NextResponse.json({ success: false, error: "Missing query" }, { status: 400 });
    }

    const adminClient  = createAdminClient();
    const isInternship = type === "internship";

    // Check for existing content to prevent duplicates
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

    // ── Call Gemini ────────────────────────────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing");

    const systemPrompt = isInternship ? INTERNSHIP_PROMPT : CERT_PROMPT;
    const userMessage  = `Topic: ${query}\nType: ${isInternship ? "Virtual Internship" : "Certification Course"}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }],
          generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      throw new Error("Gemini API failed");
    }

    const data       = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      console.error("Gemini invalid response:", JSON.stringify(data));
      throw new Error("Invalid AI response");
    }

    const cleaned = rawContent.replace(/^\s*```(?:json)?/, "").replace(/```\s*$/, "").trim();
    let generated: any;
    try {
      generated = JSON.parse(cleaned);
    } catch (e: any) {
      console.error("JSON parse error:", e.message);
      throw new Error("Failed to parse AI output as JSON");
    }

    const uniqueSlug = `${generated.course.slug}-${Date.now().toString().slice(-4)}`;

    // ── Internship → internships table only ───────────────────────────────
    if (isInternship) {
      const { data: newInternship, error: intErr } = await adminClient
        .from("internships")
        .insert({
          title:        generated.course.title,
          slug:         uniqueSlug,
          description:  generated.course.description,
          company_name: "ProCerix",
          category:     generated.course.category,
          ...PRICING.internship,
          is_published: true,
        })
        .select()
        .single();

      if (intErr) throw intErr;

      // Insert modules + lessons
      await insertModulesAndLessons(adminClient, newInternship.id, generated.modules ?? []);

      // Insert final quiz
      if (generated.final_quiz) {
        await insertQuiz(adminClient, newInternship.id, generated.final_quiz, generated.modules ?? []);
      }

      return NextResponse.json({ success: true, slug: newInternship.slug, type: "internship" });
    }

    // ── Certificate → courses table ────────────────────────────────────────
    const { data: newCourse, error: courseErr } = await adminClient
      .from("courses")
      .insert({
        title:       generated.course.title,
        slug:        uniqueSlug,
        description: generated.course.description,
        course_type: "certificates",
        ...getDefaultPricing("certificates"),
        is_published: true,
      })
      .select()
      .single();

    if (courseErr) throw courseErr;

    // Insert modules + lessons
    await insertModulesAndLessons(adminClient, newCourse.id, generated.modules ?? []);

    // Insert final quiz on the last module
    if (generated.final_quiz) {
      await insertQuiz(adminClient, newCourse.id, generated.final_quiz, generated.modules ?? []);
    }

    return NextResponse.json({ success: true, slug: newCourse.slug, type: "certificate" });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function insertModulesAndLessons(
  adminClient: any,
  courseId: string,
  modules: any[],
) {
  for (const mod of modules) {
    // Insert module into learning_modules (correct table name)
    const { data: newModule, error: modErr } = await adminClient
      .from("learning_modules")
      .insert({
        course_id:      courseId,
        title:          mod.title,
        description:    mod.description ?? null,
        sequence_order: mod.order_index ?? 1,
      })
      .select("id")
      .single();

    if (modErr) {
      console.error("Module insert error:", modErr);
      continue;
    }

    // Insert the single article lesson for this module
    const lesson = mod.lesson;
    if (lesson) {
      const { error: lessonErr } = await adminClient
        .from("lessons")
        .insert({
          module_id:              newModule.id,
          title:                  lesson.title,
          content:                lesson.content ?? null,
          estimated_reading_time: lesson.estimated_reading_time ?? 5,
          sequence_order:         1,
        });
      if (lessonErr) {
        console.error("Lesson insert error:", lessonErr);
      }
    }
  }
}

async function insertQuiz(
  adminClient: any,
  courseId: string,
  finalQuiz: any,
  modules: any[],
) {
  // Attach quiz to the last module in the course
  const { data: lastModule } = await adminClient
    .from("learning_modules")
    .select("id")
    .eq("course_id", courseId)
    .order("sequence_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastModule?.id) return;

  const { data: quiz, error: quizErr } = await adminClient
    .from("quizzes")
    .insert({
      module_id:     lastModule.id,
      title:         finalQuiz.title ?? "Final Assessment",
      passing_score: finalQuiz.passing_score ?? 70,
    })
    .select("id")
    .single();

  if (quizErr) {
    console.error("Quiz insert error:", quizErr);
    return;
  }

  const questions: any[] = finalQuiz.questions ?? [];
  for (const [qIdx, q] of questions.entries()) {
    const { data: question, error: qErr } = await adminClient
      .from("questions")
      .insert({
        quiz_id:        quiz.id,
        content:        q.content,
        type:           "single_choice",
        points:         1,
        sequence_order: q.sequence_order ?? qIdx + 1,
      })
      .select("id")
      .single();

    if (qErr) {
      console.error("Question insert error:", qErr);
      continue;
    }

    const options: any[] = q.options ?? [];
    for (const opt of options) {
      const { error: optErr } = await adminClient
        .from("options")
        .insert({
          question_id: question.id,
          content:     opt.content,
          is_correct:  opt.is_correct ?? false,
        });
      if (optErr) {
        console.error("Option insert error:", optErr);
      }
    }
  }
}
