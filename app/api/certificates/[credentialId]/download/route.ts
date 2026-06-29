import { NextRequest, NextResponse } from "next/server";
import { CertificateService } from "@/services/certificate-service";

export async function GET(req: NextRequest, props: { params: Promise<{ credentialId: string }> }) {
  const params = await props.params;
  try {
    const pdfBuffer = await CertificateService.downloadCertificatePdf(params.credentialId);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ProCerix_Certificate_${params.credentialId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: any) {
    console.error("[certificate/download] credentialId:", params.credentialId);
    console.error("[certificate/download] message:", error?.message);
    console.error("[certificate/download] stack:", error?.stack);
    return NextResponse.json(
      {
        error: "Failed to generate certificate",
        detail: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
