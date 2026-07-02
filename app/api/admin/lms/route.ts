import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function checkAdmin(): Promise<{ ok: boolean; error?: NextResponse }> {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { ok: false, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (user.email !== process.env.ADMIN_EMAIL) return { ok: false, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { ok: true };
}

function revalidate() {
  revalidatePath("/admin/lms", "layout");
  revalidatePath("/", "layout");
}

export async function POST(req: NextRequest) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.error!;

  const body = await req.json();
  const { action } = body;
  const db = createAdminClient();

  try {
    // ─── Course / Product ────────────────────────────────────────────────────
    if (action === "CREATE_COURSE") {
      const { title, course_type, description, category, price, original_price } = body;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-5);
      const { data, error } = await db.from("courses").insert({
        title, slug, course_type, description: description || null,
        category: category || null, price: price || 0,
        original_price: original_price || 0, is_published: false,
      }).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "UPDATE_COURSE_INFO") {
      const { id, ...rest } = body;
      delete rest.action;
      const ALLOWED = [
        "title", "description", "category", "difficulty", "price", "original_price",
        "duration", "thumbnail_url", "thumbnail", "tags", "seo_title", "seo_description",
        "learning_outcomes", "requirements", "is_featured", "course_type",
        // certificate settings
        "validity_period", "badge_url", "certificate_template",
        // internship settings
        "company_name", "offer_letter_template", "completion_letter_template", "internship_letter_template",
      ];
      const payload: Record<string, unknown> = {};
      for (const k of ALLOWED) if (k in rest) payload[k] = rest[k];
      const { data, error } = await db.from("courses").update(payload).eq("id", id).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "PUBLISH_COURSE") {
      const { id, is_published } = body;
      const { data, error } = await db.from("courses").update({ is_published }).eq("id", id).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "DELETE_COURSE") {
      const { id } = body;
      const { error } = await db.from("courses").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      revalidate();
      return NextResponse.json({ success: true });
    }

    if (action === "DUPLICATE_COURSE") {
      const { id } = body;
      const { data: src } = await db.from("courses").select("*").eq("id", id).single();
      if (!src) throw new Error("Not found");
      const { id: _id, created_at, updated_at, ...rest } = src;
      const newSlug = `${src.slug}-copy-${Date.now().toString().slice(-5)}`;
      const { data, error } = await db.from("courses").insert({ ...rest, title: `${src.title} (Copy)`, slug: newSlug, is_published: false }).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    // ─── Modules ─────────────────────────────────────────────────────────────
    if (action === "CREATE_MODULE") {
      const { courseId, title, description } = body;
      const { data: last } = await db.from("learning_modules").select("sequence_order").eq("course_id", courseId).is("deleted_at", null).order("sequence_order", { ascending: false }).limit(1);
      const nextOrder = ((last?.[0] as any)?.sequence_order ?? 0) + 1;
      const { data, error } = await db.from("learning_modules").insert({ course_id: courseId, title, description: description || null, sequence_order: nextOrder } as any).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "UPDATE_MODULE") {
      const { id, title, description } = body;
      const { data, error } = await db.from("learning_modules").update({ title, description, updated_at: new Date().toISOString() } as any).eq("id", id).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "DELETE_MODULE") {
      const { id } = body;
      const { error } = await db.from("learning_modules").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
      revalidate();
      return NextResponse.json({ success: true });
    }

    if (action === "REORDER_MODULES") {
      const { items } = body; // [{ id, sequence_order }]
      for (const m of items) {
        await db.from("learning_modules").update({ sequence_order: m.sequence_order, updated_at: new Date().toISOString() } as any).eq("id", m.id);
      }
      revalidate();
      return NextResponse.json({ success: true });
    }

    if (action === "DUPLICATE_MODULE") {
      const { id } = body;
      const { data: src } = await db.from("learning_modules").select("*").eq("id", id).single();
      if (!src) throw new Error("Module not found");
      const { data: last } = await db.from("learning_modules").select("sequence_order").eq("course_id", (src as any).course_id).is("deleted_at", null).order("sequence_order", { ascending: false }).limit(1);
      const nextOrder = ((last?.[0] as any)?.sequence_order ?? 0) + 1;
      const { id: _id, created_at, updated_at, ...rest } = src as any;
      const { data: newMod, error } = await db.from("learning_modules").insert({ ...rest, title: `${(src as any).title} (Copy)`, sequence_order: nextOrder, deleted_at: null } as any).select().single();
      if (error) throw error;
      // Copy lessons
      const { data: lessons } = await db.from("lessons").select("*").eq("module_id", id).is("deleted_at", null).order("sequence_order");
      if (lessons && lessons.length > 0) {
        const copiedLessons = lessons.map(({ id: _lid, created_at: _ca, updated_at: _ua, ...l }: any) => ({ ...l, module_id: (newMod as any).id }));
        await db.from("lessons").insert(copiedLessons as any);
      }
      revalidate();
      return NextResponse.json(newMod);
    }

    // ─── Lessons ─────────────────────────────────────────────────────────────
    if (action === "CREATE_LESSON") {
      const { moduleId, title } = body;
      const { data: last } = await db.from("lessons").select("sequence_order").eq("module_id", moduleId).is("deleted_at", null).order("sequence_order", { ascending: false }).limit(1);
      const nextOrder = ((last?.[0] as any)?.sequence_order ?? 0) + 1;
      const { data, error } = await db.from("lessons").insert({ module_id: moduleId, title, content: "", sequence_order: nextOrder, is_article: true, estimated_reading_time: 5 } as any).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "UPDATE_LESSON") {
      const { id, ...rest } = body;
      delete rest.action;
      const ALLOWED = ["title", "content", "estimated_reading_time", "is_article"];
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const k of ALLOWED) if (k in rest) payload[k] = rest[k];
      const { data, error } = await db.from("lessons").update(payload as any).eq("id", id).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "DELETE_LESSON") {
      const { id } = body;
      const { error } = await db.from("lessons").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
      revalidate();
      return NextResponse.json({ success: true });
    }

    if (action === "REORDER_LESSONS") {
      const { items } = body; // [{ id, sequence_order }]
      for (const l of items) {
        await db.from("lessons").update({ sequence_order: l.sequence_order, updated_at: new Date().toISOString() } as any).eq("id", l.id);
      }
      revalidate();
      return NextResponse.json({ success: true });
    }

    if (action === "DUPLICATE_LESSON") {
      const { id } = body;
      const { data: src } = await db.from("lessons").select("*").eq("id", id).single();
      if (!src) throw new Error("Lesson not found");
      const { data: last } = await db.from("lessons").select("sequence_order").eq("module_id", (src as any).module_id).is("deleted_at", null).order("sequence_order", { ascending: false }).limit(1);
      const nextOrder = ((last?.[0] as any)?.sequence_order ?? 0) + 1;
      const { id: _id, created_at, updated_at, ...rest } = src as any;
      const { data, error } = await db.from("lessons").insert({ ...rest, title: `${(src as any).title} (Copy)`, sequence_order: nextOrder, deleted_at: null } as any).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    // ─── Quizzes ─────────────────────────────────────────────────────────────
    if (action === "CREATE_QUIZ") {
      const { moduleId, title, passing_score } = body;
      const { data, error } = await db.from("quizzes").insert({ module_id: moduleId, title: title || "Final Assessment", passing_score: passing_score ?? 70 } as any).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "UPDATE_QUIZ") {
      const { id, title, passing_score } = body;
      const { data, error } = await db.from("quizzes").update({ title, passing_score } as any).eq("id", id).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "DELETE_QUIZ") {
      const { id } = body;
      const { error } = await db.from("quizzes").delete().eq("id", id);
      if (error) throw error;
      revalidate();
      return NextResponse.json({ success: true });
    }

    // ─── Questions ───────────────────────────────────────────────────────────
    if (action === "CREATE_QUESTION") {
      const { quizId, content, type, points, explanation, options } = body;
      const { data: last } = await db.from("questions").select("sequence_order").eq("quiz_id", quizId).is("deleted_at", null).order("sequence_order", { ascending: false }).limit(1);
      const nextOrder = ((last?.[0] as any)?.sequence_order ?? 0) + 1;
      const { data: question, error: qErr } = await db.from("questions").insert({ quiz_id: quizId, content, type: type || "single_choice", points: points || 1, sequence_order: nextOrder, explanation: explanation || null } as any).select().single();
      if (qErr) throw qErr;
      if (options?.length) {
        const rows = options.map((o: any) => ({ question_id: (question as any).id, content: o.content, is_correct: o.is_correct ?? false }));
        const { error: oErr } = await db.from("options").insert(rows as any);
        if (oErr) throw oErr;
      }
      const { data: full } = await db.from("questions").select("*, options(*)").eq("id", (question as any).id).single();
      revalidate();
      return NextResponse.json(full);
    }

    if (action === "UPDATE_QUESTION") {
      const { id, content, type, points, explanation, options } = body;
      const { error: qErr } = await db.from("questions").update({ content, type, points, explanation, updated_at: new Date().toISOString() } as any).eq("id", id);
      if (qErr) throw qErr;
      if (options) {
        await db.from("options").delete().eq("question_id", id);
        if (options.length) {
          const rows = options.map((o: any) => ({ question_id: id, content: o.content, is_correct: o.is_correct ?? false }));
          const { error: oErr } = await db.from("options").insert(rows as any);
          if (oErr) throw oErr;
        }
      }
      const { data: full } = await db.from("questions").select("*, options(*)").eq("id", id).single();
      revalidate();
      return NextResponse.json(full);
    }

    if (action === "DELETE_QUESTION") {
      const { id } = body;
      const { error } = await db.from("questions").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
      revalidate();
      return NextResponse.json({ success: true });
    }

    if (action === "REORDER_QUESTIONS") {
      const { items } = body;
      for (const q of items) {
        await db.from("questions").update({ sequence_order: q.sequence_order } as any).eq("id", q.id);
      }
      return NextResponse.json({ success: true });
    }

    // ─── Categories ──────────────────────────────────────────────────────────
    if (action === "CREATE_CATEGORY") {
      const { name, description, icon, color } = body;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { data: last } = await db.from("lms_categories").select("sequence_order").order("sequence_order", { ascending: false }).limit(1);
      const nextOrder = ((last?.[0] as any)?.sequence_order ?? 0) + 1;
      const { data, error } = await db.from("lms_categories" as any).insert({ name, slug, description, icon: icon || "📚", color: color || "#3B82F6", sequence_order: nextOrder }).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "UPDATE_CATEGORY") {
      const { id, name, description, icon, color, is_active, sequence_order } = body;
      const { data, error } = await db.from("lms_categories" as any).update({ name, description, icon, color, is_active, sequence_order, updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "DELETE_CATEGORY") {
      const { id } = body;
      const { error } = await db.from("lms_categories" as any).delete().eq("id", id);
      if (error) throw error;
      revalidate();
      return NextResponse.json({ success: true });
    }

    // ─── Media Library ───────────────────────────────────────────────────────
    if (action === "CREATE_MEDIA") {
      const { name, url, type, size_bytes, mime_type, alt_text, folder, tags } = body;
      const { data, error } = await db.from("media_library" as any).insert({ name, url, type: type || "image", size_bytes, mime_type, alt_text, folder: folder || "general", tags: tags || [] }).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (action === "UPDATE_MEDIA") {
      const { id, name, alt_text, tags, folder } = body;
      const { data, error } = await db.from("media_library" as any).update({ name, alt_text, tags, folder }).eq("id", id).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (action === "DELETE_MEDIA") {
      const { id } = body;
      const { error } = await db.from("media_library" as any).delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // ─── Templates ───────────────────────────────────────────────────────────
    if (action === "CREATE_TEMPLATE") {
      const { name, type, content, variables, preview_url } = body;
      const { data, error } = await db.from("lms_templates" as any).insert({ name, type, content, variables: variables || [], preview_url }).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "UPDATE_TEMPLATE") {
      const { id, name, content, variables, preview_url, is_default } = body;
      if (is_default) {
        await db.from("lms_templates" as any).update({ is_default: false }).eq("type", body.type);
      }
      const { data, error } = await db.from("lms_templates" as any).update({ name, content, variables, preview_url, is_default, updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "DELETE_TEMPLATE") {
      const { id } = body;
      const { error } = await db.from("lms_templates" as any).delete().eq("id", id);
      if (error) throw error;
      revalidate();
      return NextResponse.json({ success: true });
    }

    // ─── Schedule Publish ─────────────────────────────────────────────────────
    if (action === "SCHEDULE_PUBLISH") {
      const { id, scheduled_publish_at } = body;
      const { data, error } = await db.from("courses").update({ lms_status: "scheduled", scheduled_publish_at } as any).eq("id", id).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "ARCHIVE_COURSE") {
      const { id } = body;
      const { data, error } = await db.from("courses").update({ lms_status: "archived", is_published: false } as any).eq("id", id).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    if (action === "SET_STATUS") {
      const { id, lms_status } = body;
      const isPublished = lms_status === "published";
      const { data, error } = await db.from("courses").update({ lms_status, is_published: isPublished } as any).eq("id", id).select().single();
      if (error) throw error;
      revalidate();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[LMS API]", action, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
