import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { withDefaultPricing, PRICING } from "@/lib/pricing/defaults";

// Explicit whitelist to prevent updating generated/database-managed columns (e.g. fts, created_at)
const WHITELIST: Record<string, string[]> = {
  courses: ["title", "slug", "description", "price", "original_price", "discount_percent", "discount", "category", "difficulty", "course_type", "type", "duration_minutes", "thumbnail_url", "thumbnail", "is_published", "published", "featured", "is_featured", "tags"],
  internships: ["title", "slug", "company_name", "description", "category", "price", "original_price", "is_published", "is_active", "thumbnail_url"],
  certificates: ["user_id", "course_id", "credential_id", "status", "certificate_number", "issue_date"],
  posts: ["title", "slug", "excerpt", "content", "thumbnail", "is_published", "author_id"],
  banners: ["title", "subtitle", "button_text", "image_url", "link_url", "priority", "is_published"],
  profiles: ["first_name", "last_name", "avatar_url", "bio", "is_suspended"],
  users: ["first_name", "last_name", "avatar_url", "bio", "is_suspended"],
  coupons: ["code", "discount_amount", "is_percentage", "expiry_date", "usage_limit", "min_amount", "is_active"],
  homepage_sections: ["hero_title", "hero_subtitle", "hero_image", "hero_cta", "stats", "features", "testimonials", "faq"]
};

function buildSafePayload(entity: string, payload: any): any {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;

  const allowedFields = WHITELIST[entity] || [];
  if (allowedFields.length === 0) {
    // No whitelist: strip known system columns only
    const safe = { ...payload };
    delete safe.id; delete safe.fts; delete safe.search_vector;
    delete safe.tsv; delete safe.created_at; delete safe.updated_at; delete safe.embedding;
    return safe;
  }

  const safe: any = {};
  for (const key of Object.keys(payload)) {
    if (allowedFields.includes(key)) safe[key] = payload[key];
  }
  return safe;
}

// Checks if an error is a PostgREST schema-cache miss and returns the missing column name.
function extractMissingColumn(error: any): string | null {
  const msg: string = error?.message || error?.details || "";
  const match = msg.match(/Could not find the '([^']+)' column/i);
  return match ? match[1] : null;
}

// Runs fn(); if it fails with a schema-cache column error, strips that column and retries once.
async function withColumnFallback<T>(
  payload: any,
  fn: (p: any) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any; skippedColumns?: string[] }> {
  const result = await fn(payload);
  if (!result.error) return result;

  const missingCol = extractMissingColumn(result.error);
  if (!missingCol) return result; // Different error — propagate as-is

  console.warn(`[crud] Schema cache miss: column '${missingCol}' not found. Retrying without it.`);
  const trimmed = { ...payload };
  delete trimmed[missingCol];

  if (Object.keys(trimmed).length === 0) return result; // Nothing left to update

  const retry = await fn(trimmed);
  return { ...retry, skippedColumns: [missingCol] };
}

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

  const safePayload = buildSafePayload(entity, payload);

  try {
    if (action === "CREATE") {
      // Enforce canonical pricing on every course or internship creation.
      let insertPayload = safePayload;
      if (entity === "courses") {
        insertPayload = withDefaultPricing(safePayload, safePayload?.course_type);
      } else if (entity === "internships") {
        // Auto-generate slug from title if not provided
        if (!insertPayload?.slug && insertPayload?.title) {
          insertPayload = {
            ...insertPayload,
            slug: insertPayload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4)
          };
        }
        insertPayload = { ...insertPayload, ...PRICING.internship };
      }
      const { data, error } = await (supabase as any).from(entity).insert(insertPayload).select().single();
      if (error) throw error;
      revalidatePath('/', 'layout');
      return NextResponse.json(data);
    }

    else if (action === "UPDATE") {
      const pk = reqData.primaryKey || "id";
      const result = await withColumnFallback(safePayload, (p) =>
        (supabase as any).from(entity).update(p).eq(pk, id).select().single()
      );
      if (result.error) throw result.error;
      revalidatePath('/', 'layout');
      const response: any = result.data;
      if (result.skippedColumns?.length) response._skippedColumns = result.skippedColumns;
      return NextResponse.json(response);
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
      const { data: existing, error: fetchErr } = await (supabase as any).from(entity).select("*").eq(pk, id).single();
      if (fetchErr || !existing) throw fetchErr || new Error("Not found");

      delete existing[pk];
      delete existing.created_at;
      delete existing.updated_at;

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

      const result = await withColumnFallback(safePayload, (p) =>
        (supabase as any).from(entity).update(p).in(pk, ids).select()
      );
      if (result.error) throw result.error;
      revalidatePath('/', 'layout');
      const response: any = { data: result.data };
      if (result.skippedColumns?.length) response.skippedColumns = result.skippedColumns;
      return NextResponse.json(response);
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
    const missingCol = extractMissingColumn(error);
    if (missingCol) {
      return NextResponse.json(
        { error: `Column '${missingCol}' not found in schema cache. A database migration may be pending. Run: npx supabase db push --linked` },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
