import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { CertificateService } from "@/services/certificate-service";

async function getCertificatesHandler(req: any, ctx: any, auth: any) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const certificates = await CertificateService.getUserCertificates(userId);
  return NextResponse.json({ data: certificates });
}

export const GET = withApiAuth(getCertificatesHandler);
