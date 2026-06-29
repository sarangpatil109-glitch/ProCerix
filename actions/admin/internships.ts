"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "./utils";

export async function updateSubmissionStatus(submissionId: string, status: "approved" | "rejected") {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("internship_submissions")
    .update({ status })
    .eq("id", submissionId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
