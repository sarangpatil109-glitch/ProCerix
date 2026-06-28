"use server";
import { CertificateService } from "@/services/certificate-service";
import { revalidatePath } from "next/cache";

export async function issueCertificateAction(userId: string, courseId: string) {
  try {
    const cert = await CertificateService.issueCertificate(userId, courseId);
    revalidatePath("/dashboard");
    return { success: true, credentialId: cert.credential_id };
  } catch (error: any) {
    return { error: error.message };
  }
}
