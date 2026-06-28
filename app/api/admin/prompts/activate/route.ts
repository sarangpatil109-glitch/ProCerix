import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { version_id, template_id } = await req.json();

  try {
    // Deactivate all versions for this template
    const { error: err1 } = await supabase
      .from("prompt_versions")
      .update({ is_active: false })
      .eq("template_id", template_id);
    
    if (err1) throw err1;

    // Activate the selected version
    const { error: err2 } = await supabase
      .from("prompt_versions")
      .update({ is_active: true })
      .eq("id", version_id);

    if (err2) throw err2;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
