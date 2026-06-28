import Link from "next/link";
import { Download, ExternalLink, ShieldCheck } from "lucide-react";

export function CertificateCard({ certificate }: { certificate: any }) {
  const issueDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 p-4">
         <ShieldCheck className="w-8 h-8 text-green-500 opacity-20 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mb-4 pr-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
          {certificate.courses.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-mono">
          ID: {certificate.credential_id}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Issued: {issueDate}
        </p>
      </div>
      
      <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
        <Link 
          href={`/verify/${certificate.credential_id}`}
          target="_blank"
          className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
        >
          <ExternalLink className="w-4 h-4" /> Verify
        </Link>
        <Link 
          href={`/api/certificates/${certificate.credential_id}/download`}
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm"
        >
          <Download className="w-4 h-4" /> Download
        </Link>
      </div>
    </div>
  );
}
