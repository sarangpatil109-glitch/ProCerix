import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { ResumeService } from "@/services/resume-service";

async function getResumesHandler(req: any, ctx: any, auth: any) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const resumes = await ResumeService.getUserResumes(userId);
  return NextResponse.json({ data: resumes });
}

export const GET = withApiAuth(getResumesHandler);
