import { createClient } from "@/lib/supabase/server";
import { CertificateService } from "@/services/certificate-service";
import { CertificateCard } from "@/components/dashboard/certificate-card";

export default async function DashboardCertificates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  const certificates = await CertificateService.getUserCertificates(userId);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Certificates</h1>
        <p className="text-gray-500 dark:text-gray-400">View, download, and verify your achieved credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {certificates.map((certificate: any) => (
          <CertificateCard key={certificate.id} certificate={certificate} />
        ))}
        {certificates.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500">
            You haven't earned any certificates yet.
          </div>
        )}
      </div>
    </div>
  );
}
