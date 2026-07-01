import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const file = formData.get("avatar") as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP or GIF allowed" }, { status: 400 });
  }

  const filePath = `${user.id}/avatar.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("[avatar] upload failed:", uploadError);
    return NextResponse.json({ error: "Upload failed — please try again" }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  await supabase.from("profiles").update({ avatar_url: avatarUrl } as any).eq("id", user.id);

  return NextResponse.json({ avatarUrl });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.storage.from("avatars").remove([
    `${user.id}/avatar.jpg`,
    `${user.id}/avatar.jpeg`,
    `${user.id}/avatar.png`,
    `${user.id}/avatar.webp`,
    `${user.id}/avatar.gif`,
  ]);

  await supabase.from("profiles").update({ avatar_url: null } as any).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
