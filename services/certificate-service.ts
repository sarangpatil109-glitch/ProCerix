import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CertificatePDFGenerator } from "@/engines/certificate/pdf-generator";

export class CertificateService {
  private static generateCredentialId() {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PCX-${year}-${random}`;
  }

  static async issueCertificate(userId: string, courseId: string): Promise<{ credential_id: string }> {
    // Admin client is required: the certificates table has no INSERT RLS policy.
    // The admin client bypasses RLS for write operations while the enrollment
    // check still validates that the user is legitimately enrolled.
    const adminDb = createAdminClient();

    // 1. Idempotency: return existing certificate without creating a duplicate
    const { data: existingCert } = await adminDb
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existingCert) {
      return existingCert as any;
    }

    // 2. Validate enrollment exists (active OR already completed)
    const { data: enrollment } = await adminDb
      .from("enrollments")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (!enrollment || !["active", "completed"].includes(enrollment.status)) {
      throw new Error("Active enrollment required for certificate issuance");
    }

    // 3. Generate unique credential ID
    const credentialId = this.generateCredentialId();

    // 4. Save certificate record
    const { data: certificate, error } = await adminDb
      .from("certificates")
      .insert({
        user_id: userId,
        course_id: courseId,
        credential_id: credentialId,
      } as any)
      .select()
      .single();

    if (error) throw new Error(`Failed to save certificate: ${error.message}`);

    // 5. Mark enrollment completed
    if (enrollment.status === "active") {
      await adminDb
        .from("enrollments")
        .update({ status: "completed", completed_at: new Date().toISOString() } as any)
        .eq("id", enrollment.id);
    }

    return certificate as any;
  }

  static async getCertificate(credentialId: string) {
    // Admin client: verify page is public (no auth required), and profiles/courses
    // joins may be blocked by RLS for unauthenticated visitors.
    const adminDb = createAdminClient();
    const { data, error } = await adminDb
      .from("certificates")
      .select(`
        *,
        profiles(first_name, last_name),
        courses(title)
      `)
      .eq("credential_id", credentialId)
      .maybeSingle();

    if (error) {
      console.error("[getCertificate] Supabase error:", error.message, "code:", error.code);
      return null;
    }
    if (!data) {
      console.warn("[getCertificate] No certificate found for credential_id:", credentialId);
      return null;
    }
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

  static async verifyCertificate(credentialId: string) {
    const certificate = await this.getCertificate(credentialId);
    if (!certificate) return { valid: false };
    return { valid: true, certificate };
  }

  static async downloadCertificatePdf(credentialId: string) {
    const cert = await this.getCertificate(credentialId);
    if (!cert) throw new Error("Certificate not found");

    const profiles = (cert as any).profiles as { first_name: string; last_name: string } | null;
    const courses = (cert as any).courses as { title: string } | null;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${appUrl}/verify/${credentialId}`;

    const pdfBuffer = await CertificatePDFGenerator.generate({
      candidateName: profiles
        ? `${profiles.first_name} ${profiles.last_name}`
        : "Certificate Holder",
      courseName: courses?.title ?? "Course",
      credentialId: cert.credential_id,
      issueDate: new Date(cert.issued_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }),
      verificationUrl,
    });

    return pdfBuffer;
  }
}
