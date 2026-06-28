import { createClient } from "@/lib/supabase/server";
import { ResumeService } from "@/services/resume-service";
import { redirect, notFound } from "next/navigation";
import { ResumeBuilderClient } from "@/components/resume/resume-builder-client";

export default async function ResumeBuilderPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let resume;
  try {
    resume = await ResumeService.getResume(params.id, user.id);
  } catch {
    notFound();
  }

  return <ResumeBuilderClient resume={resume} userId={user.id} />;
}
