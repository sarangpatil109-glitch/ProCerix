import { createClient } from "@/lib/supabase/server";
import { CertificatePDFGenerator } from "@/engines/certificate/pdf-generator";

export class CertificateService {
  private static generateCredentialId() {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PCX-${year}-${random}`;
  }

  static async issueCertificate(userId: string, courseId: string) {
    const supabase = await createClient();

    // 1. Idempotency Check: Prevent duplicate generation per user/course
    const { data: existingCert } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (existingCert) {
      return existingCert;
    }

    // 2. Security Check: Validate Enrollment Active
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (!enrollment || enrollment.status !== "active") {
      throw new Error("Active enrollment required for certificate issuance");
    }

    // 3. Generate Secure Unique ID
    const credentialId = this.generateCredentialId();

    // 4. Save Certificate
    const { data: certificate, error } = await supabase
      .from("certificates")
      .insert({
        user_id: userId,
        course_id: courseId,
        credential_id: credentialId,
      } as any)
      .select()
      .single();

    if (error) throw new Error("Failed to issue certificate securely");

    // 5. Upgrade Enrollment Status
    await supabase
      .from("enrollments")
      .update({ status: "completed", completed_at: new Date().toISOString() } as any)
      .eq("id", enrollment.id);

    return certificate;
  }

  static async getCertificate(credentialId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("certificates")
      .select(`
        *,
        profiles!inner(first_name, last_name),
        courses!inner(title)
      `)
      .eq("credential_id", credentialId)
      .single();

    if (error) return null;
    return data;
  }

  static async getUserCertificates(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("certificates")
      .select(`
        *,
        courses!inner(title, slug)
      `)
      .eq("user_id", userId)
      .order("issued_at", { ascending: false });

    if (error) return [];
    return data;
  }

  static async downloadCertificatePdf(credentialId: string) {
    const cert = await this.getCertificate(credentialId);
    if (!cert) throw new Error("Certificate not found");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${appUrl}/verify/${credentialId}`;

    const pdfBuffer = await CertificatePDFGenerator.generate({
      candidateName: `${cert.profiles.first_name} ${cert.profiles.last_name}`,
      courseName: cert.courses.title,
      credentialId: cert.credential_id,
      issueDate: new Date(cert.issued_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }),
      verificationUrl,
    });

    return pdfBuffer;
  }
}
