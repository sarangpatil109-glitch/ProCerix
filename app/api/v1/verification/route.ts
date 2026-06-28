import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { CertificateService } from "@/services/certificate-service";

async function verifyHandler(req: any, ctx: any, auth: any) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
  }

  const result = await CertificateService.verifyCertificate(id);
  if (!result.valid) {
    return NextResponse.json({ valid: false, error: "Certificate not found or invalid" }, { status: 404 });
  }

  return NextResponse.json({ valid: true, data: result.certificate });
}

export const GET = withApiAuth(verifyHandler);
