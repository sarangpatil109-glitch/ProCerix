import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminUser } = await supabase.from("admin_users").select("id").eq("id", user.id).single();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const reqData = await req.json();
  const { entity, action, id, payload } = reqData;

  try {
    if (action === "CREATE") {
      const { data, error } = await (supabase as any).from(entity).insert(payload).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    } 
    else if (action === "UPDATE") {
      const pk = reqData.primaryKey || "id";
      const { data, error } = await (supabase as any).from(entity).update(payload).eq(pk, id).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }
    else if (action === "DELETE") {
      const pk = reqData.primaryKey || "id";
      const { error } = await (supabase as any).from(entity).delete().eq(pk, id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    else if (action === "BULK_UPDATE") {
      const pk = reqData.primaryKey || "id";
      const { ids } = reqData;
      if (!Array.isArray(ids) || ids.length === 0) throw new Error("No IDs provided for bulk update");
      const { data, error } = await (supabase as any).from(entity).update(payload).in(pk, ids).select();
      if (error) throw error;
      return NextResponse.json(data);
    }
    else if (action === "BULK_DELETE") {
      const pk = reqData.primaryKey || "id";
      const { ids } = reqData;
      if (!Array.isArray(ids) || ids.length === 0) throw new Error("No IDs provided for bulk delete");
      const { error } = await (supabase as any).from(entity).delete().in(pk, ids);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
