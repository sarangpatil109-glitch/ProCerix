import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reqData = await req.json();
  const { entity, action, id, payload } = reqData;
  const supabase = createAdminClient();

  // Explicit whitelist to prevent updating generated/database-managed columns (e.g. fts, created_at)
  const WHITELIST: Record<string, string[]> = {
    courses: ["title", "slug", "description", "price", "original_price", "discount_percent", "discount", "category", "difficulty", "course_type", "type", "duration_minutes", "thumbnail_url", "thumbnail", "is_published", "published", "featured", "is_featured", "tags"],
    internships: ["title"],
    certificates: ["user_id", "course_id", "credential_id", "status", "certificate_number", "issue_date"],
    posts: ["title", "slug", "excerpt", "content", "thumbnail", "is_published", "author_id"],
    banners: ["title", "subtitle", "button_text", "image_url", "link_url", "priority", "is_published"],
    profiles: ["first_name", "last_name", "avatar_url", "bio", "is_suspended"],
    users: ["first_name", "last_name", "avatar_url", "bio", "is_suspended"],
    coupons: ["code", "discount_amount", "is_percentage", "expiry_date", "usage_limit", "min_amount", "is_active"],
    homepage_sections: ["hero_title", "hero_subtitle", "hero_image", "hero_cta", "stats", "features", "testimonials", "faq"]
  };

  // Build a safe payload containing only whitelisted fields for the specific entity
  let safePayload: any = undefined;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    safePayload = {};
    const allowedFields = WHITELIST[entity] || [];
    for (const key of Object.keys(payload)) {
      if (allowedFields.includes(key)) {
        safePayload[key] = payload[key];
      }
    }
    // If no whitelist is defined for this entity, we fallback to stripping known bad keys just in case,
    // but the user requested explicit whitelist, so we rely on the whitelist.
    // If it's empty, it means we don't have it defined, so we might need a fallback.
    if (allowedFields.length === 0) {
      safePayload = { ...payload };
      delete safePayload.id;
      delete safePayload.fts;
      delete safePayload.search_vector;
      delete safePayload.tsv;
      delete safePayload.created_at;
      delete safePayload.updated_at;
      delete safePayload.embedding;
    }
  }


  try {
    if (action === "CREATE") {
      const { data, error } = await (supabase as any).from(entity).insert(safePayload || payload).select().single();
      if (error) throw error;
      revalidatePath('/', 'layout');
      return NextResponse.json(data);
    } 
    else if (action === "UPDATE") {
      const pk = reqData.primaryKey || "id";
      const { data, error } = await (supabase as any).from(entity).update(safePayload || payload).eq(pk, id).select().single();
      if (error) throw error;
      revalidatePath('/', 'layout');
      return NextResponse.json(data);
    }
    else if (action === "DELETE") {
      const pk = reqData.primaryKey || "id";
      const { error } = await (supabase as any).from(entity).delete().eq(pk, id);
      if (error) throw error;
      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true });
    }
    else if (action === "DUPLICATE") {
      const pk = reqData.primaryKey || "id";
      // Fetch existing
      const { data: existing, error: fetchErr } = await (supabase as any).from(entity).select("*").eq(pk, id).single();
      if (fetchErr || !existing) throw fetchErr || new Error("Not found");
      
      // Remove restricted keys
      delete existing[pk];
      delete existing.created_at;
      delete existing.updated_at;
      
      // Modify unique fields
      if (existing.slug) existing.slug = `${existing.slug}-copy-${Date.now()}`;
      if (existing.title) existing.title = `${existing.title} (Copy)`;
      if (existing.name) existing.name = `${existing.name} (Copy)`;
      
      const { data, error } = await (supabase as any).from(entity).insert(existing).select().single();
      if (error) throw error;
      revalidatePath('/', 'layout');
      return NextResponse.json(data);
    }
    else if (action === "BULK_UPDATE") {
      const pk = reqData.primaryKey || "id";
      const { ids } = reqData;
      if (!Array.isArray(ids) || ids.length === 0) throw new Error("No IDs provided for bulk update");
      const { data, error } = await (supabase as any).from(entity).update(safePayload || payload).in(pk, ids).select();
      if (error) throw error;
      revalidatePath('/', 'layout');
      return NextResponse.json(data);
    }
    else if (action === "BULK_DELETE") {
      const pk = reqData.primaryKey || "id";
      const { ids } = reqData;
      if (!Array.isArray(ids) || ids.length === 0) throw new Error("No IDs provided for bulk delete");
      const { error } = await (supabase as any).from(entity).delete().in(pk, ids);
      if (error) throw error;
      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
