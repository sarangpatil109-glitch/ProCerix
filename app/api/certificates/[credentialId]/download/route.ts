import { NextRequest, NextResponse } from "next/server";
import { CertificateService } from "@/services/certificate-service";

export async function GET(req: NextRequest, props: { params: Promise<{ credentialId: string }> }) {
  try {
    const params = await props.params;
    const pdfBuffer = await CertificateService.downloadCertificatePdf(params.credentialId);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ProCerix_Certificate_${params.credentialId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Certificate generation error", error);
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
  }
}
