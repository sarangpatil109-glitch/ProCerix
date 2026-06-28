import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { LinkedInService } from "@/services/linkedin-service";

async function getLinkedInHandler(req: any, ctx: any, auth: any) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const profiles = await LinkedInService.getUserProfiles(userId);
  return NextResponse.json({ data: profiles });
}

export const GET = withApiAuth(getLinkedInHandler);
