import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const file = formData.get("resume") as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Resume must be under 10 MB" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
  }

  const filePath = `${user.id}/resume.pdf`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(filePath, arrayBuffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    console.error("[resume] upload failed:", uploadError);
    return NextResponse.json({ error: "Upload failed — please try again" }, { status: 500 });
  }

  // Signed URL valid for 1 year (stored as the resume_url)
  const { data: signedData, error: signError } = await supabase.storage
    .from("resumes")
    .createSignedUrl(filePath, 60 * 60 * 24 * 365);

  if (signError || !signedData?.signedUrl) {
    return NextResponse.json({ error: "Failed to generate resume link" }, { status: 500 });
  }

  await supabase.from("profiles").update({ resume_url: filePath } as any).eq("id", user.id);

  return NextResponse.json({ resumeUrl: signedData.signedUrl, path: filePath });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_url")
    .eq("id", user.id)
    .single();

  if (!(profile as any)?.resume_url) {
    return NextResponse.json({ resumeUrl: null });
  }

  const { data: signedData } = await supabase.storage
    .from("resumes")
    .createSignedUrl((profile as any).resume_url, 60 * 60); // 1 hour

  return NextResponse.json({ resumeUrl: signedData?.signedUrl ?? null });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.storage.from("resumes").remove([`${user.id}/resume.pdf`]);
  await supabase.from("profiles").update({ resume_url: null } as any).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
