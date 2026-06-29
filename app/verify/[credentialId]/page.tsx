import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CertificateService } from "@/services/certificate-service";
import { ShieldCheck, Calendar, BookOpen, User } from "lucide-react";
import Link from "next/link";

export async function generateMetadata(props: { params: Promise<{ credentialId: string }> }): Promise<Metadata> {
  const params = await props.params;
  const cert = await CertificateService.getCertificate(params.credentialId);
  if (!cert) return { title: "Certificate Not Found" };
  const name = await CertificateService.getCertificateHolderName(cert);
  return { title: `ProCerix Verified: ${name}` };
}

export default async function VerifyCertificatePage(props: { params: Promise<{ credentialId: string }> }) {
  const params = await props.params;
  const cert = await CertificateService.getCertificate(params.credentialId);

  if (!cert) {
    notFound();
  }

  const courses = cert.courses as { title: string } | null;
  const name = await CertificateService.getCertificateHolderName(cert);
  const course = courses?.title ?? "Course";
  const issueDate = new Date(cert.issued_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black selection:bg-blue-500/30 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
        
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50 dark:ring-green-900/10 mb-8">
            <ShieldCheck className="w-10 h-10" />
          </div>
          
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Verified Credential</h1>
            <p className="text-blue-600 dark:text-blue-400 font-mono font-bold tracking-widest">{cert.credential_id}</p>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-6 text-left">
            <div className="flex items-center gap-4">
               <User className="w-5 h-5 text-gray-400" />
               <div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Candidate</p>
                 <p className="text-lg font-bold text-gray-900 dark:text-white">{name}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               <BookOpen className="w-5 h-5 text-gray-400" />
               <div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Course Completed</p>
                 <p className="text-lg font-bold text-gray-900 dark:text-white">{course}</p>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <Calendar className="w-5 h-5 text-gray-400" />
               <div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Issue Date</p>
                 <p className="text-lg font-bold text-gray-900 dark:text-white">{issueDate}</p>
               </div>
            </div>
          </div>
          
          <div className="pt-8">
            <Link 
              href={`/api/certificates/${cert.credential_id}/download`} 
              target="_blank"
              className="block w-full py-4 px-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-lg mb-6"
            >
              Download PDF Certificate
            </Link>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed text-center">
              Issued by ProCerix.<br/>
              Not affiliated with any university or government unless explicitly stated.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
