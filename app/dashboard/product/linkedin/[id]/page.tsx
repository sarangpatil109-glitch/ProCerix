import { createClient } from "@/lib/supabase/server";
import { LinkedInService } from "@/services/linkedin-service";
import { redirect, notFound } from "next/navigation";
import { LinkedInBuilderClient } from "@/components/linkedin/linkedin-builder-client";

export default async function LinkedInBuilderPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let profile;
  try {
    profile = await LinkedInService.getProfile(params.id, user.id);
  } catch {
    notFound();
  }

  return <LinkedInBuilderClient profile={profile} userId={user.id} />;
}
