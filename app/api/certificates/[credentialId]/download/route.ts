import { NextRequest, NextResponse } from "next/server";
import { CertificateService } from "@/services/certificate-service";

export async function GET(req: NextRequest, { params }: { params: { credentialId: string } }) {
  try {
    const pdfBuffer = await CertificateService.downloadCertificatePdf(params.credentialId);

    return new NextResponse(pdfBuffer, {
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
