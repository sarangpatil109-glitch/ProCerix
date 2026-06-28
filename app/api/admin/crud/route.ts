import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
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
    
    return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
